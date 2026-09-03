import { Router } from 'express';
import { z } from 'zod';
import { handler } from '../lib/async-handler.js';
import { badRequest } from '../lib/errors.js';
import { requireAuth } from '../auth/middleware.js';
import { withStoreContext } from '../access/context.js';
import { collectReservation, createReservation } from '../domain/reservations.js';
import { sendEmail } from '../integrations/email.js';
import { reservationEmail } from '../integrations/templates.js';
import { recordAudit } from '../lib/audit.js';
import { logger } from '../lib/logger.js';

export const reservationsRouter = Router();

const schema = z.object({
  basket_id: z.string().min(1),
  pickup_slot: z.string().min(1).max(50),
  quantity: z.number().int().min(1).max(10).default(1),
  payment_method: z.enum(['orange_money', 'mtn_money', 'card', 'cash_on_pickup']),
  customer_phone: z.string().min(8).max(20).optional(),
});

reservationsRouter.post(
  '/',
  requireAuth,
  handler(async (req, res) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) throw badRequest('Réservation invalide', parsed.error.issues);

    const result = await createReservation({ user: req.user, input: parsed.data });

    sendEmail({
      to: req.user.email,
      subject: `Réservation confirmée — ${result.reservation.basket_name}`,
      html: reservationEmail({
        reservation: result.reservation,
        confirmationCode: result.confirmation_code,
      }),
    }).catch((error) => logger.warn({ err: error }, 'e-mail de réservation non envoyé'));

    await recordAudit(req, {
      action: 'create', module: 'ClickCollectReservation', entity_id: result.reservation.id,
    });

    res.status(201).json({ data: result });
  }),
);

reservationsRouter.post(
  '/:id/collect',
  requireAuth,
  handler(async (req, res) => {
    const code = String(req.body?.code ?? '');
    if (!code) throw badRequest('Code de retrait requis');

    const storeIds = await withStoreContext(req);
    const updated = await collectReservation({
      reservationId: req.params.id,
      code,
      storeIds: req.user.role === 'admin' ? [...storeIds, req.body?.store_id].filter(Boolean) : storeIds,
    });

    await recordAudit(req, {
      action: 'update', module: 'ClickCollectReservation', entity_id: updated.id, description: 'retrait validé',
    });
    res.json({ data: updated });
  }),
);
