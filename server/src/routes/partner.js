import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { handler } from '../lib/async-handler.js';
import { forbidden } from '../lib/errors.js';
import crypto from 'node:crypto';
import { requireAuth, requirePartner } from '../auth/middleware.js';
import { prisma as db } from '../lib/prisma.js';
import { sendEmail } from '../integrations/email.js';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';
import { badRequest, notFound } from '../lib/errors.js';
import { withStoreContext } from '../access/context.js';
import { DISCOUNT_LADDER, urgencyFor, suggestedPrice } from '../domain/pricing.js';
import { CATEGORY_LABELS } from '../domain/catalog.js';
import { derivedFields } from '../entities/derived.js';

export const partnerRouter = Router();

/**
 * Candidature partenaire : crée le magasin, rattache le compte et envoie le
 * courriel de vérification. Ouvert à tout compte connecté — c'est le point
 * d'entrée qui *fait* de quelqu'un un partenaire.
 */
export const partnerSignupRouter = Router();

partnerSignupRouter.post(
  '/stores',
  requireAuth,
  handler(async (req, res) => {
    const parsed = z
      .object({
        name: z.string().min(2).max(120),
        address: z.string().min(3).max(255),
        city: z.string().min(2).max(80),
        phone: z.string().max(20).optional(),
        email: z.string().email().optional(),
        description: z.string().max(1000).optional(),
        opening_hours: z.string().max(120).optional(),
        logo_url: z.string().url().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
      })
      .safeParse(req.body);
    if (!parsed.success) throw badRequest('Informations du magasin invalides', parsed.error.issues);

    const token = crypto.randomBytes(24).toString('base64url');

    const store = await db.store.create({
      data: {
        ...parsed.data,
        owner_email: req.user.email,
        // Un magasin naît « en attente » : seul le backoffice peut le vérifier.
        status: 'pending',
        is_partner: false,
        verification_token: token,
        email_verified: false,
      },
    });

    await db.user.update({ where: { id: req.user.id }, data: { store_id: store.id } });

    const link = `${env.CORS_ORIGINS.split(',')[0]}/VerifyPartner?token=${token}&store_id=${store.id}`;
    sendEmail({
      to: parsed.data.email ?? req.user.email,
      subject: 'Vérifiez votre adresse — partenaire Chichard',
      html: `<p>Bienvenue sur Chichard.</p><p>Confirmez l'adresse de votre magasin <strong>${store.name}</strong> en suivant ce lien :</p><p><a href="${link}">${link}</a></p><p>Votre dossier sera ensuite examiné par notre équipe.</p>`,
    }).catch((error) => logger.warn({ err: error }, 'e-mail de vérification non envoyé'));

    res.status(201).json({ data: store });
  }),
);

/** Confirmation de l'adresse par le propriétaire, via le lien reçu. */
partnerSignupRouter.post(
  '/stores/verify',
  handler(async (req, res) => {
    const parsed = z.object({ store_id: z.string(), token: z.string() }).safeParse(req.body);
    if (!parsed.success) throw badRequest('Lien de vérification invalide');

    const store = await db.store.findUnique({ where: { id: parsed.data.store_id } });
    if (!store || !store.verification_token || store.verification_token !== parsed.data.token) {
      throw badRequest('Lien de vérification invalide ou expiré');
    }

    const updated = await db.store.update({
      where: { id: store.id },
      data: { email_verified: true, verification_token: null },
    });
    res.json({ data: { id: updated.id, name: updated.name, email_verified: true } });
  }),
);

partnerRouter.use(requireAuth, requirePartner);

/** Confirmation ou refus d'une réservation d'expérience par le partenaire. */
partnerRouter.patch(
  '/bookings/:id/status',
  handler(async (req, res) => {
    const parsed = z
      .object({ status: z.enum(['confirmed', 'cancelled', 'completed', 'no_show']) })
      .safeParse(req.body);
    if (!parsed.success) throw badRequest('Statut invalide', parsed.error.issues);

    const storeIds = await withStoreContext(req);
    const booking = await db.experienceBooking.findUnique({ where: { id: req.params.id } });
    if (!booking) throw notFound('Réservation introuvable');

    const experience = await db.experience.findUnique({ where: { id: booking.experience_id } });
    if (!experience || !storeIds.includes(experience.store_id)) throw notFound('Réservation introuvable');

    const [updated] = await db.$transaction([
      db.experienceBooking.update({
        where: { id: booking.id },
        data: { status: parsed.data.status, confirmation_sent: true },
      }),
      db.notification.create({
        data: {
          user_email: booking.user_email,
          title:
            parsed.data.status === 'confirmed'
              ? `Réservation confirmée : ${experience.title}`
              : `Réservation ${parsed.data.status} : ${experience.title}`,
          message:
            parsed.data.status === 'confirmed'
              ? `Rendez-vous le ${experience.event_date?.toLocaleDateString('fr-FR')} à ${experience.event_time ?? ''} — ${experience.location ?? experience.store_name}.`
              : 'Consultez vos réservations pour le détail.',
          type: 'system',
          action_url: '/LoyaltyProgram',
          data: { booking_id: booking.id, experience_id: experience.id },
        },
      }),
      // Une annulation rend la place et rembourse les points.
      ...(parsed.data.status === 'cancelled'
        ? [
            db.experience.update({
              where: { id: experience.id },
              data: { current_participants: { decrement: 1 } },
            }),
            db.user.updateMany({
              where: { email: booking.user_email },
              data: { loyalty_points: { increment: booking.points_spent } },
            }),
            db.loyaltyTransaction.create({
              data: {
                user_email: booking.user_email,
                type: 'earn',
                points: booking.points_spent,
                source: 'bonus',
                description: `Remboursement : ${experience.title}`,
              },
            }),
          ]
        : []),
    ]);

    res.json({ data: updated });
  }),
);

/**
 * Tableau de bord partenaire — chiffres réels, agrégés en base sur la période
 * demandée. Aucun jeu de données de démonstration.
 */
/**
 * Nombre de produits urgents remontés au tableau de bord. La liste complète
 * vit sur l'écran des produits ; ici, elle sert à alerter, pas à inventorier.
 */
const URGENTS_AFFICHÉS = 20;

/**
 * Jusqu'à combien de jours restants un produit est-il « urgent » ou
 * « critique » ? Dérivé du barème plutôt que recopié : si les paliers
 * changent, la requête suit.
 */
const JOURS_URGENCE = Math.max(
  ...DISCOUNT_LADDER.filter((palier) => palier.urgency === 'urgent' || palier.urgency === 'critical')
    .map((palier) => palier.maxDaysLeft),
);

/*
 * On compare des dates de calendrier, pas des instants : un produit qui périme
 * ce soir est à J-0. Les bornes encadrent donc des journées entières.
 */
const débutDeJournée = (now = new Date()) =>
  new Date(now.getFullYear(), now.getMonth(), now.getDate());

const finDeLUrgence = (now = new Date()) =>
  new Date(now.getFullYear(), now.getMonth(), now.getDate() + JOURS_URGENCE, 23, 59, 59, 999);

partnerRouter.get(
  '/dashboard',
  handler(async (req, res) => {
    const days = Math.min(Number(req.query.days) || 30, 365);
    const since = new Date(Date.now() - days * 86_400_000);
    const storeIds = await withStoreContext(req);
    if (!storeIds.length) throw forbidden("Aucun magasin n'est rattaché à votre compte");

    const [orders, products, parRayon, daily, topProducts, urgent] = await Promise.all([
      prisma.order.aggregate({
        where: { store_id: { in: storeIds }, created_date: { gte: since }, status: { not: 'cancelled' } },
        _sum: { total_amount: true, total_savings: true, co2_saved_kg: true },
        _count: true,
      }),
      prisma.product.groupBy({
        by: ['status'],
        where: { store_id: { in: storeIds } },
        _count: { _all: true },
        _sum: { quantity_available: true, quantity_sold: true },
      }),
      prisma.product.groupBy({
        by: ['category'],
        where: { store_id: { in: storeIds } },
        _count: { _all: true },
        _sum: { quantity_sold: true },
      }),
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
      prisma.product.findMany({
        where: {
          store_id: { in: storeIds },
          status: 'active',
          expiration_date: { gte: débutDeJournée(), lte: finDeLUrgence() },
        },
        orderBy: { expiration_date: 'asc' },
        take: URGENTS_AFFICHÉS,
        select: {
          id: true,
          name: true,
          expiration_date: true,
          discounted_price: true,
          original_price: true,
        },
      }),
    ]);

    const now = new Date();

    const parStatut = (statut) => products.find((ligne) => ligne.status === statut);
    const somme = (champ) =>
      products.reduce((total, ligne) => total + (ligne._sum[champ] ?? 0), 0);

    res.json({
      data: {
        period_days: days,
        revenue: orders._sum.total_amount ?? 0,
        orders: orders._count,
        savings_generated: orders._sum.total_savings ?? 0,
        co2_saved_kg: orders._sum.co2_saved_kg ?? 0,
        active_products: parStatut('active')?._count._all ?? 0,
        sold_out_products: parStatut('sold_out')?._count._all ?? 0,
        units_in_stock: somme('quantity_available'),
        units_sold: somme('quantity_sold'),
        urgent_products: urgent.map((produit) => {
          const { urgency, daysLeft } = urgencyFor(produit.expiration_date, now);
          return {
            id: produit.id,
            name: produit.name,
            days_left: daysLeft,
            urgency,
            current_price: produit.discounted_price,
            suggested_price: suggestedPrice(produit.original_price, produit.expiration_date, now),
          };
        }),
        daily: daily.map((d) => ({
          date: d.day,
          commandes: Number(d.commandes),
          ventes: Number(d.ventes),
        })),
        top_products: topProducts,
        // Répartition par rayon : elle était reconstruite dans le navigateur à
        // partir d'une page de produits, donc fausse dès que le stock
        // dépassait cette page.
        products_by_category: parRayon
          .map((ligne) => ({
            category: ligne.category,
            label: CATEGORY_LABELS[ligne.category] ?? ligne.category,
            products: ligne._count._all,
            units_sold: ligne._sum.quantity_sold ?? 0,
          }))
          .sort((a, b) => b.units_sold - a.units_sold || a.label.localeCompare(b.label, 'fr')),
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
          ...derivedFields('Product', { discounted_price: price }, p),
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
