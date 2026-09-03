import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { handler } from '../lib/async-handler.js';
import { forbidden } from '../lib/errors.js';
import { requireAuth, requirePartner } from '../auth/middleware.js';
import { withStoreContext } from '../access/context.js';
import { urgencyFor, suggestedPrice } from '../domain/pricing.js';

export const partnerRouter = Router();

partnerRouter.use(requireAuth, requirePartner);

/**
 * Tableau de bord partenaire — chiffres réels, agrégés en base sur la période
 * demandée. Aucun jeu de données de démonstration.
 */
partnerRouter.get(
  '/dashboard',
  handler(async (req, res) => {
    const days = Math.min(Number(req.query.days) || 30, 365);
    const since = new Date(Date.now() - days * 86_400_000);
    const storeIds = await withStoreContext(req);
    if (!storeIds.length) throw forbidden("Aucun magasin n'est rattaché à votre compte");

    const [orders, products, daily, topProducts] = await Promise.all([
      prisma.order.aggregate({
        where: { store_id: { in: storeIds }, created_date: { gte: since }, status: { not: 'cancelled' } },
        _sum: { total_amount: true, total_savings: true, co2_saved_kg: true },
        _count: true,
      }),
      prisma.product.findMany({ where: { store_id: { in: storeIds } } }),
      prisma.$queryRaw`
        SELECT date_trunc('day', "created_date") AS day,
               COUNT(*)::int                     AS commandes,
               COALESCE(SUM("total_amount"), 0)  AS ventes
          FROM "Order"
         WHERE "store_id" = ANY(${storeIds})
           AND "created_date" >= ${since}
           AND "status" <> 'cancelled'
         GROUP BY 1
         ORDER BY 1
      `,
      prisma.product.findMany({
        where: { store_id: { in: storeIds } },
        orderBy: { quantity_sold: 'desc' },
        take: 5,
        select: { id: true, name: true, quantity_sold: true, discounted_price: true },
      }),
    ]);

    const now = new Date();
    const urgent = products
      .filter((p) => p.status === 'active')
      .map((p) => ({ product: p, ...urgencyFor(p.expiration_date, now) }))
      .filter((p) => p.urgency === 'urgent' || p.urgency === 'critical');

    res.json({
      data: {
        period_days: days,
        revenue: orders._sum.total_amount ?? 0,
        orders: orders._count,
        savings_generated: orders._sum.total_savings ?? 0,
        co2_saved_kg: orders._sum.co2_saved_kg ?? 0,
        active_products: products.filter((p) => p.status === 'active').length,
        sold_out_products: products.filter((p) => p.status === 'sold_out').length,
        units_in_stock: products.reduce((s, p) => s + (p.quantity_available ?? 0), 0),
        units_sold: products.reduce((s, p) => s + (p.quantity_sold ?? 0), 0),
        urgent_products: urgent.map((u) => ({
          id: u.product.id,
          name: u.product.name,
          days_left: u.daysLeft,
          urgency: u.urgency,
          current_price: u.product.discounted_price,
          suggested_price: suggestedPrice(u.product.original_price, u.product.expiration_date, now),
        })),
        daily: daily.map((d) => ({
          date: d.day,
          commandes: Number(d.commandes),
          ventes: Number(d.ventes),
        })),
        top_products: topProducts,
      },
    });
  }),
);

/**
 * Application des prix conseillés. Le calcul est fait côté serveur à partir de
 * la date limite : le client ne fixe pas le montant.
 */
partnerRouter.post(
  '/products/apply-suggested-prices',
  handler(async (req, res) => {
    const parsed = z.object({ product_ids: z.array(z.string()).min(1).max(200) }).safeParse(req.body);
    if (!parsed.success) throw forbidden('Liste de produits invalide');

    const storeIds = await withStoreContext(req);
    const products = await prisma.product.findMany({
      where: { id: { in: parsed.data.product_ids }, store_id: { in: storeIds } },
    });

    const now = new Date();
    const updates = products.map((p) => {
      const price = suggestedPrice(p.original_price, p.expiration_date, now);
      return prisma.product.update({
        where: { id: p.id },
        data: {
          discounted_price: price,
          ai_suggested_price: price,
          urgency_level: urgencyFor(p.expiration_date, now).urgency === 'expired'
            ? 'critical'
            : urgencyFor(p.expiration_date, now).urgency,
        },
      });
    });

    const updated = await prisma.$transaction(updates);
    res.json({ data: { updated: updated.length } });
  }),
);

/** Ajustement de stock tracé : toute variation laisse un mouvement. */
partnerRouter.post(
  '/products/:id/adjust-stock',
  handler(async (req, res) => {
    const parsed = z
      .object({
        quantity: z.number().int(),
        reason: z.enum(['reception', 'inventaire', 'casse', 'peremption', 'retour']),
        notes: z.string().max(255).optional(),
      })
      .safeParse(req.body);
    if (!parsed.success) throw forbidden('Ajustement invalide');

    const storeIds = await withStoreContext(req);
    const product = await prisma.product.findFirst({
      where: { id: req.params.id, store_id: { in: storeIds } },
    });
    if (!product) throw forbidden('Produit introuvable dans vos magasins');

    const next = Math.max(0, (product.quantity_available ?? 0) + parsed.data.quantity);

    const [updated] = await prisma.$transaction([
      prisma.product.update({
        where: { id: product.id },
        data: { quantity_available: next, status: next > 0 ? 'active' : 'sold_out' },
      }),
      prisma.stockMovement.create({
        data: {
          product_id: product.id,
          store_id: product.store_id,
          movement_type: parsed.data.quantity >= 0 ? 'in' : 'adjustment',
          quantity: Math.abs(parsed.data.quantity),
          reason: parsed.data.reason,
          notes: parsed.data.notes ?? null,
          user_email: req.user.email,
          previous_quantity: product.quantity_available ?? 0,
          new_quantity: next,
        },
      }),
    ]);

    res.json({ data: updated });
  }),
);
