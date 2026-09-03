import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { handler } from '../lib/async-handler.js';
import { badRequest, forbidden, notFound } from '../lib/errors.js';
import { requireAuth } from '../auth/middleware.js';
import { withStoreContext } from '../access/context.js';
import { cancelOrder, createOrder, quoteCart } from '../domain/orders.js';
import { verifyPickupToken, codeMatches } from '../domain/pickup-token.js';
import { recordAudit } from '../lib/audit.js';

export const ordersRouter = Router();

const checkoutSchema = z.object({
  delivery_type: z.enum(['pickup', 'delivery']),
  payment_method: z.enum(['orange_money', 'mtn_money', 'cash', 'card']),
  delivery_address: z.string().min(5).max(500).optional(),
  customer_phone: z.string().min(8).max(20),
  coupon_code: z.string().max(40).optional(),
}).refine(
  (v) => v.delivery_type !== 'delivery' || Boolean(v.delivery_address),
  { message: 'Adresse de livraison requise', path: ['delivery_address'] },
);

ordersRouter.post(
  '/quote',
  requireAuth,
  handler(async (req, res) => {
    const schema = z.object({
      delivery_type: z.enum(['pickup', 'delivery']).default('pickup'),
      coupon_code: z.string().max(40).nullish(),
    });
    const parsed = schema.safeParse(req.body ?? {});
    if (!parsed.success) throw badRequest('Requête invalide', parsed.error.issues);

    res.json({
      data: await quoteCart({
        user: req.user,
        deliveryType: parsed.data.delivery_type,
        couponCode: parsed.data.coupon_code ?? null,
      }),
    });
  }),
);

ordersRouter.post(
  '/',
  requireAuth,
  handler(async (req, res) => {
    const parsed = checkoutSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest('Commande invalide', parsed.error.issues);

    const result = await createOrder({ user: req.user, input: parsed.data });
    await recordAudit(req, {
      action: 'create',
      module: 'Order',
      entity_id: result.order.id,
      description: `commande ${result.order.order_number} — ${result.order.total_amount} XAF`,
    });

    res.status(201).json({ data: result });
  }),
);

ordersRouter.post(
  '/:id/cancel',
  requireAuth,
  handler(async (req, res) => {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) throw notFound('Commande introuvable');

    const storeIds = await withStoreContext(req);
    const allowed =
      order.customer_email === req.user.email ||
      req.user.role === 'admin' ||
      (order.store_id && storeIds.includes(order.store_id));
    if (!allowed) throw forbidden();

    const cancelled = await cancelOrder({
      orderId: order.id,
      actor: req.user,
      reason: String(req.body?.reason ?? '').slice(0, 255) || null,
    });
    await recordAudit(req, { action: 'update', module: 'Order', entity_id: order.id, description: 'annulation' });

    res.json({ data: cancelled });
  }),
);

/**
 * Validation d'une remise (retrait magasin ou livraison).
 * Accepte soit le jeton signé du QR, soit le code court saisi à la main —
 * les deux sont vérifiés côté serveur contre un secret ou un condensat.
 */
ordersRouter.post(
  '/:id/fulfil',
  requireAuth,
  handler(async (req, res) => {
    const schema = z.object({ token: z.string().optional(), code: z.string().optional() });
    const parsed = schema.safeParse(req.body ?? {});
    if (!parsed.success || (!parsed.data.token && !parsed.data.code)) {
      throw badRequest('Jeton ou code requis');
    }

    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) throw notFound('Commande introuvable');

    const storeIds = await withStoreContext(req);
    const isHandler =
      req.user.role === 'admin' ||
      req.user.is_delivery_driver ||
      (order.store_id && storeIds.includes(order.store_id));
    if (!isHandler) throw forbidden('Seuls le magasin ou le livreur peuvent valider une remise');

    const byToken = parsed.data.token
      ? verifyPickupToken(parsed.data.token, { target: 'order', id: order.id })
      : { valid: false };
    const byCode = parsed.data.code ? codeMatches(parsed.data.code, order.pickup_token_hash) : false;

    if (!byToken.valid && !byCode) {
      await prisma.order.update({
        where: { id: order.id },
        data: { qr_scan_attempts: { increment: 1 } },
      });
      await recordAudit(req, {
        action: 'update', module: 'Order', entity_id: order.id,
        description: 'échec de validation de remise', success: false,
      });
      throw badRequest('Code de retrait invalide');
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'delivered',
        delivered_at: new Date(),
        delivered_by: req.user.email,
        qr_scanned_at: new Date(),
        qr_scan_attempts: { increment: 1 },
        // Le paiement en espèces est encaissé à la remise.
        payment_status: order.payment_method === 'cash' ? 'paid' : order.payment_status,
      },
    });

    await recordAudit(req, { action: 'update', module: 'Order', entity_id: order.id, description: 'remise validée' });
    res.json({ data: updated });
  }),
);
