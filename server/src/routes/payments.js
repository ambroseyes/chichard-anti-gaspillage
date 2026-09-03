import { Router, raw } from 'express';
import { z } from 'zod';
import { handler } from '../lib/async-handler.js';
import { badRequest, forbidden, notFound } from '../lib/errors.js';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../auth/middleware.js';
import { settlePayment, verifyWebhookSignature } from '../payments/index.js';
import { recordAudit } from '../lib/audit.js';
import { logger } from '../lib/logger.js';

export const paymentsRouter = Router();

/**
 * Rappel de l'opérateur. Le corps est lu en brut : la signature porte sur les
 * octets reçus, pas sur un JSON re-sérialisé.
 */
paymentsRouter.post(
  '/webhook',
  raw({ type: '*/*', limit: '64kb' }),
  handler(async (req, res) => {
    const signature = req.get('x-chichard-signature') ?? req.get('x-signature');
    if (!verifyWebhookSignature(req.body, signature)) {
      logger.warn({ ip: req.ip }, 'webhook de paiement rejeté : signature invalide');
      throw forbidden('Signature invalide');
    }

    let payload;
    try {
      payload = JSON.parse(req.body.toString('utf8'));
    } catch {
      throw badRequest('Corps JSON invalide');
    }

    const parsed = z
      .object({
        reference: z.string().min(1),
        status: z.enum(['succeeded', 'failed', 'pending', 'cancelled']),
        provider_ref: z.string().optional(),
      })
      .safeParse(payload);
    if (!parsed.success) throw badRequest('Notification invalide', parsed.error.issues);

    const intent = await settlePayment({
      reference: parsed.data.reference,
      status: parsed.data.status,
      providerRef: parsed.data.provider_ref,
      raw: payload,
    });

    if (!intent) throw notFound('Référence de paiement inconnue');

    logger.info(
      { reference: parsed.data.reference, status: parsed.data.status },
      'paiement mis à jour par notification opérateur',
    );
    res.json({ received: true });
  }),
);

/** Suivi du paiement, réservé au client concerné. */
paymentsRouter.get(
  '/:reference',
  requireAuth,
  handler(async (req, res) => {
    const intent = await prisma.paymentIntent.findUnique({ where: { reference: req.params.reference } });
    if (!intent) throw notFound('Paiement introuvable');
    if (intent.customer_email !== req.user.email && req.user.role !== 'admin') throw forbidden();

    res.json({
      data: {
        reference: intent.reference,
        status: intent.status,
        amount: intent.amount,
        provider: intent.provider,
        failure_reason: intent.failure_reason,
      },
    });
  }),
);

/**
 * Encaissement d'un paiement en espèces par le magasin ou le livreur.
 * Réservé aux comptes qui remettent effectivement la commande.
 */
paymentsRouter.post(
  '/:reference/settle-cash',
  requireAuth,
  handler(async (req, res) => {
    const intent = await prisma.paymentIntent.findUnique({ where: { reference: req.params.reference } });
    if (!intent) throw notFound('Paiement introuvable');
    if (intent.provider !== 'manual') throw badRequest('Ce paiement ne se règle pas en espèces');

    const { withStoreContext } = await import('../access/context.js');
    const storeIds = await withStoreContext(req);
    const order = await prisma.order.findUnique({ where: { id: intent.target_id } });

    const allowed =
      req.user.role === 'admin' ||
      req.user.is_delivery_driver ||
      (order?.store_id && storeIds.includes(order.store_id));
    if (!allowed) throw forbidden();

    const settled = await settlePayment({ reference: intent.reference, status: 'succeeded' });
    await recordAudit(req, {
      action: 'update', module: 'Payment', entity_id: intent.id, description: 'encaissement espèces',
    });

    res.json({ data: settled });
  }),
);
