import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { handler } from '../lib/async-handler.js';
import { stripHidden } from '../entities/schema.js';
import {
  CATEGORY_LABELS,
  EXPIRATION_BUCKETS,
  PER_PAGE_DEFAULT,
  RANKING_CANDIDATES,
  SORT_OPTIONS,
  buildWhere,
  expirationBoundary,
  fold,
  orderByFor,
  parseCriteria,
  rankByRelevance,
} from '../domain/catalog.js';

export const catalogRouter = Router();

/** Champs suffisants pour classer un candidat sans rapatrier toute la ligne. */
const RANKING_SELECT = {
  id: true,
  name: true,
  brand: true,
  store_name: true,
  description: true,
  tags: true,
  discount_percent: true,
};

/**
 * Page de résultats.
 *
 * Une seule requête HTTP rapporte les articles de la page, le total, et le
 * décompte de chaque facette. Le navigateur n'a jamais le catalogue entier
 * entre les mains, donc le nombre de produits peut croître sans que l'écran
 * se mette à mentir.
 */
catalogRouter.get(
  '/search',
  handler(async (req, res) => {
    const criteria = parseCriteria(req.query);
    const now = new Date();
    const where = buildWhere(criteria, { now });
    const skip = (criteria.page - 1) * criteria.per_page;

    const [total, items, categories, brands, stores, priceRange, expirationCounts] =
      await Promise.all([
        prisma.product.count({ where }),
        findPage(criteria, where, skip),
        prisma.product.groupBy({
          by: ['category'],
          where: buildWhere(criteria, { now, skipFacet: 'categories' }),
          _count: { _all: true },
        }),
        prisma.product.groupBy({
          by: ['brand'],
          where: buildWhere(criteria, { now, skipFacet: 'brands' }),
          _count: { _all: true },
        }),
        prisma.product.groupBy({
          by: ['store_name'],
          where: buildWhere(criteria, { now, skipFacet: 'stores' }),
          _count: { _all: true },
        }),
        prisma.product.aggregate({
          where: buildWhere(criteria, { now, skipFacet: 'price' }),
          _min: { discounted_price: true },
          _max: { discounted_price: true },
        }),
        Promise.all(
          EXPIRATION_BUCKETS.map((bucket) =>
            prisma.product.count({
              where: {
                AND: [
                  buildWhere(criteria, { now, skipFacet: 'expiration' }),
                  { expiration_date: { lte: expirationBoundary(bucket, now) } },
                ],
              },
            }),
          ),
        ),
      ]);

    res.json({
      data: {
        items: items.map((row) => stripHidden('Product', row)),
        page: {
          number: criteria.page,
          size: criteria.per_page,
          total,
          pages: Math.max(1, Math.ceil(total / criteria.per_page)),
        },
        facets: {
          categories: byCount(
            categories.map((row) => ({
              value: row.category,
              label: CATEGORY_LABELS[row.category] ?? row.category,
              count: row._count._all,
            })),
          ),
          brands: byCount(
            brands
              .filter((row) => row.brand)
              .map((row) => ({ value: row.brand, label: row.brand, count: row._count._all })),
          ).slice(0, 20),
          stores: byCount(
            stores.map((row) => ({
              value: row.store_name,
              label: row.store_name,
              count: row._count._all,
            })),
          ).slice(0, 20),
          price: {
            min: Math.floor(priceRange._min.discounted_price ?? 0),
            max: Math.ceil(priceRange._max.discounted_price ?? 0),
          },
          expiration: EXPIRATION_BUCKETS.map((bucket, index) => ({
            value: bucket.id,
            label: bucket.label,
            count: expirationCounts[index],
          })),
        },
        sorts: SORT_OPTIONS,
        applied: criteria,
      },
    });
  }),
);

/**
 * Suggestions de la barre de recherche : quelques produits, les rayons dont
 * le nom correspond, et les boutiques. Volontairement court — une liste de
 * suggestions qu'il faut faire défiler ne sert plus à rien.
 */
catalogRouter.get(
  '/suggest',
  handler(async (req, res) => {
    const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 60) : '';
    if (q.length < 2) {
      return res.json({ data: { products: [], categories: [], stores: [] } });
    }

    const criteria = parseCriteria({ q });
    const where = buildWhere(criteria);

    const [products, stores] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: [{ discount_percent: 'desc' }, { id: 'asc' }],
        take: 6,
        select: {
          id: true,
          name: true,
          image_url: true,
          category: true,
          discounted_price: true,
          original_price: true,
          store_name: true,
        },
      }),
      prisma.product.groupBy({
        by: ['store_name'],
        where: buildWhere({ ...criteria, tokens: [] }),
        _count: { _all: true },
      }),
    ]);

    const needle = fold(q);
    const categories = Object.entries(CATEGORY_LABELS)
      .filter(([, label]) => fold(label).includes(needle))
      .slice(0, 3)
      .map(([value, label]) => ({ value, label }));

    res.json({
      data: {
        products,
        categories,
        stores: stores
          .filter((row) => fold(row.store_name).includes(needle))
          .sort((a, b) => b._count._all - a._count._all)
          .slice(0, 3)
          .map((row) => ({ value: row.store_name, label: row.store_name, count: row._count._all })),
      },
    });
  }),
);

/**
 * Récupère la page demandée.
 *
 * Le tri par pertinence ne s'exprime pas en SQL : il est calculé sur un
 * lot borné de candidats, puis la page est relue en base. Au-delà de cette
 * borne, on retombe sur le classement métier — mieux vaut un classement
 * approché qu'une requête qui rapatrie tout le catalogue.
 */
async function findPage(criteria, where, skip) {
  const rankable = criteria.sort === 'relevance' && criteria.tokens.length > 0;

  if (!rankable) {
    return prisma.product.findMany({
      where,
      orderBy: orderByFor(criteria.sort),
      skip,
      take: criteria.per_page,
    });
  }

  const candidates = await prisma.product.findMany({
    where,
    orderBy: orderByFor('relevance'),
    take: RANKING_CANDIDATES,
    select: RANKING_SELECT,
  });

  const pageIds = rankByRelevance(candidates, criteria.tokens)
    .slice(skip, skip + criteria.per_page)
    .map((row) => row.id);
  if (!pageIds.length) return [];

  const rows = await prisma.product.findMany({ where: { id: { in: pageIds } } });
  const byId = new Map(rows.map((row) => [row.id, row]));
  return pageIds.map((id) => byId.get(id)).filter(Boolean);
}

/** Facettes du plus fourni au moins fourni, à égalité par ordre alphabétique. */
function byCount(entries) {
  return entries.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'fr'));
}

export { PER_PAGE_DEFAULT };
