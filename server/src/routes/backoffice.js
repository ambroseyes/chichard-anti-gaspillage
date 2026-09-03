import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { handler } from '../lib/async-handler.js';
import { badRequest, forbidden } from '../lib/errors.js';
import { requireBackoffice } from '../auth/middleware.js';
import { stripHidden } from '../entities/schema.js';
import { recordAudit } from '../lib/audit.js';

export const backofficeRouter = Router();

// Tout le backoffice est derrière ce contrôle : il n'existe aucune route
// d'administration atteignable avec un simple compte connecté.
backofficeRouter.use(requireBackoffice());

const rangeSchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
});

/** Indicateurs calculés en base — aucune valeur n'est inventée côté client. */
backofficeRouter.get(
  '/overview',
  handler(async (req, res) => {
    const { days } = rangeSchema.parse(req.query);
    const since = new Date(Date.now() - days * 86_400_000);
    const previousSince = new Date(Date.now() - 2 * days * 86_400_000);

    const [current, previous, byDay, byStatus, products, stores, users] = await Promise.all([
      prisma.order.aggregate({
        where: { created_date: { gte: since }, status: { not: 'cancelled' } },
        _sum: { total_amount: true, total_savings: true, co2_saved_kg: true },
        _count: true,
      }),
      prisma.order.aggregate({
        where: { created_date: { gte: previousSince, lt: since }, status: { not: 'cancelled' } },
        _sum: { total_amount: true },
        _count: true,
      }),
      prisma.$queryRaw`
        SELECT date_trunc('day', "created_date") AS day,
               COUNT(*)::int                     AS orders,
               COALESCE(SUM("total_amount"), 0)  AS revenue
          FROM "Order"
         WHERE "created_date" >= ${since} AND "status" <> 'cancelled'
         GROUP BY 1
         ORDER BY 1
      `,
      prisma.order.groupBy({ by: ['status'], _count: true }),
      prisma.product.groupBy({ by: ['status'], _count: true }),
      prisma.store.groupBy({ by: ['status'], _count: true }),
      prisma.user.count(),
    ]);

    const revenue = current._sum.total_amount ?? 0;
    const previousRevenue = previous._sum.total_amount ?? 0;

    res.json({
      data: {
        period_days: days,
        revenue,
        revenue_change_pct: previousRevenue ? ((revenue - previousRevenue) / previousRevenue) * 100 : null,
        orders: current._count,
        orders_change_pct: previous._count ? ((current._count - previous._count) / previous._count) * 100 : null,
        savings_generated: current._sum.total_savings ?? 0,
        co2_saved_kg: current._sum.co2_saved_kg ?? 0,
        average_order_value: current._count ? revenue / current._count : 0,
        users_total: users,
        // `Number(...)` : les agrégats SQL bruts remontent en BigInt/Decimal.
        daily: byDay.map((d) => ({
          date: d.day,
          orders: Number(d.orders),
          revenue: Number(d.revenue),
        })),
        orders_by_status: byStatus.map((s) => ({ status: s.status, count: s._count })),
        products_by_status: products.map((s) => ({ status: s.status, count: s._count })),
        stores_by_status: stores.map((s) => ({ status: s.status, count: s._count })),
      },
    });
  }),
);

backofficeRouter.get(
  '/users',
  requireBackoffice('admin', 'super_admin'),
  handler(async (req, res) => {
    const schema = z.object({
      search: z.string().max(120).optional(),
      role: z.string().max(20).optional(),
      limit: z.coerce.number().int().min(1).max(200).default(50),
      offset: z.coerce.number().int().min(0).default(0),
    });
    const { search, role, limit, offset } = schema.parse(req.query);

    const where = {
      ...(search
        ? {
            OR: [
              { email: { contains: search, mode: 'insensitive' } },
              { full_name: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(role && role !== 'all' ? { backoffice_role: role } : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.user.findMany({ where, orderBy: { created_date: 'desc' }, take: limit, skip: offset }),
      prisma.user.count({ where }),
    ]);

    res.json({ data: rows.map((u) => stripHidden('User', u)), meta: { total, limit, offset } });
  }),
);

/** Attribution d'un rôle backoffice : réservée au super-administrateur. */
backofficeRouter.patch(
  '/users/:id/role',
  requireBackoffice('super_admin'),
  handler(async (req, res) => {
    const parsed = z
      .object({ backoffice_role: z.enum(['none', 'operator', 'admin', 'super_admin']) })
      .safeParse(req.body);
    if (!parsed.success) throw badRequest('Rôle invalide', parsed.error.issues);

    if (req.params.id === req.user.id && parsed.data.backoffice_role !== 'super_admin') {
      throw forbidden('Vous ne pouvez pas retirer votre propre rôle de super-administrateur');
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { backoffice_role: parsed.data.backoffice_role },
    });

    await recordAudit(req, {
      action: 'update', module: 'User', entity_id: user.id,
      description: `rôle backoffice → ${parsed.data.backoffice_role}`,
    });

    res.json({ data: stripHidden('User', user) });
  }),
);

backofficeRouter.patch(
  '/users/:id/status',
  requireBackoffice('admin', 'super_admin'),
  handler(async (req, res) => {
    const parsed = z.object({ is_active: z.boolean() }).safeParse(req.body);
    if (!parsed.success) throw badRequest('Requête invalide', parsed.error.issues);

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { is_active: parsed.data.is_active },
    });
    await recordAudit(req, {
      action: 'update', module: 'User', entity_id: user.id,
      description: parsed.data.is_active ? 'compte réactivé' : 'compte désactivé',
    });
    res.json({ data: stripHidden('User', user) });
  }),
);

/** Journal d'audit réel, alimenté par le serveur. */
backofficeRouter.get(
  '/audit-logs',
  requireBackoffice('admin', 'super_admin'),
  handler(async (req, res) => {
    const schema = z.object({
      search: z.string().max(120).optional(),
      action: z.string().max(20).optional(),
      module: z.string().max(60).optional(),
      limit: z.coerce.number().int().min(1).max(200).default(50),
      offset: z.coerce.number().int().min(0).default(0),
    });
    const { search, action, module, limit, offset } = schema.parse(req.query);

    const where = {
      ...(action && action !== 'all' ? { action } : {}),
      ...(module && module !== 'all' ? { module } : {}),
      ...(search
        ? {
            OR: [
              { description: { contains: search, mode: 'insensitive' } },
              { actor_email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.auditLog.findMany({ where, orderBy: { created_date: 'desc' }, take: limit, skip: offset }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({ data: rows, meta: { total, limit, offset } });
  }),
);

backofficeRouter.get(
  '/transactions',
  handler(async (req, res) => {
    const schema = z.object({
      status: z.string().max(20).optional(),
      limit: z.coerce.number().int().min(1).max(200).default(50),
      offset: z.coerce.number().int().min(0).default(0),
    });
    const { status, limit, offset } = schema.parse(req.query);
    const where = status && status !== 'all' ? { status } : {};

    const [rows, total, totals] = await Promise.all([
      prisma.order.findMany({ where, orderBy: { created_date: 'desc' }, take: limit, skip: offset }),
      prisma.order.count({ where }),
      prisma.order.aggregate({ where, _sum: { total_amount: true } }),
    ]);

    res.json({
      data: rows,
      meta: { total, limit, offset, amount_total: totals._sum.total_amount ?? 0 },
    });
  }),
);

/** Validation d'un partenaire, avec historique de statut. */
backofficeRouter.patch(
  '/stores/:id/status',
  requireBackoffice('admin', 'super_admin'),
  handler(async (req, res) => {
    const parsed = z
      .object({
        status: z.enum(['pending', 'verified', 'rejected', 'suspended']),
        notes: z.string().max(500).optional(),
      })
      .safeParse(req.body);
    if (!parsed.success) throw badRequest('Statut invalide', parsed.error.issues);

    const store = await prisma.store.findUnique({ where: { id: req.params.id } });
    if (!store) throw badRequest('Magasin introuvable');

    const [updated] = await prisma.$transaction([
      prisma.store.update({
        where: { id: store.id },
        data: { status: parsed.data.status, is_partner: parsed.data.status === 'verified' },
      }),
      prisma.partnerStatusHistory.create({
        data: {
          store_id: store.id,
          store_name: store.name,
          previous_status: store.status,
          new_status: parsed.data.status,
          changed_by: req.user.email,
          changed_by_name: req.user.full_name ?? null,
          notes: parsed.data.notes ?? null,
        },
      }),
      ...(store.owner_email
        ? [
            prisma.user.updateMany({
              where: { email: store.owner_email },
              data: { is_partner: parsed.data.status === 'verified' },
            }),
            prisma.notification.create({
              data: {
                user_email: store.owner_email,
                title: `Statut de votre boutique : ${parsed.data.status}`,
                message: parsed.data.notes ?? `Votre boutique est désormais « ${parsed.data.status} ».`,
                type: 'system',
                action_url: '/PartnerDashboard',
                data: { store_id: store.id, new_status: parsed.data.status },
              },
            }),
          ]
        : []),
    ]);

    await recordAudit(req, {
      action: 'update', module: 'Store', entity_id: store.id,
      description: `${store.status} → ${parsed.data.status}`,
    });

    res.json({ data: updated });
  }),
);
