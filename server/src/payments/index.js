import crypto from 'node:crypto';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';
import { manualProvider } from './manual.js';
import { orangeMoneyProvider } from './orange-money.js';
import { mtnMomoProvider } from './mtn-momo.js';

const providers = {
  manual: manualProvider,
  orange_money: orangeMoneyProvider,
  mtn_momo: mtnMomoProvider,
};

/**
 * Choisit l'opérateur : le mode de paiement demandé par le client prime, avec
 * repli sur le fournisseur configuré. Le paiement à la livraison ou au retrait
 * ne sollicite aucun opérateur.
 */
function resolveProvider(method) {
  if (method === 'cash' || method === 'cash_on_pickup') return manualProvider;
  if (method === 'orange_money' && env.ORANGE_MONEY_BASE_URL) return orangeMoneyProvider;
  if (method === 'mtn_money' && env.MTN_MOMO_BASE_URL) return mtnMomoProvider;
  return providers[env.PAYMENT_PROVIDER] ?? manualProvider;
}

/**
 * Ouvre une intention de paiement. Rien n'est jamais marqué « payé » ici :
 * seul un rappel signé de l'opérateur (`settlePayment`) peut le faire.
 */
export async function createPaymentIntent({
  targetType,
  targetId,
  amount,
  customerEmail,
  customerPhone,
  method,
}) {
  const provider = resolveProvider(method);
  const reference = `PAY-${crypto.randomBytes(9).toString('base64url')}`;

  const intent = await prisma.paymentIntent.create({
    data: {
      reference,
      provider: provider.name,
      target_type: targetType,
      target_id: targetId,
      amount,
      customer_email: customerEmail,
      customer_phone: customerPhone ?? null,
      status: 'pending',
    },
  });

  try {
    const result = await provider.initiate({
      reference,
      amount,
      phone: customerPhone,
      description: `Chichard ${targetType} ${targetId}`,
    });

    return prisma.paymentIntent.update({
      where: { id: intent.id },
      data: { status: result.status, provider_ref: result.providerRef ?? null },
    });
  } catch (error) {
    logger.error({ err: error, reference }, "initiation du paiement impossible");
    return prisma.paymentIntent.update({
      where: { id: intent.id },
      data: { status: 'failed', failure_reason: error.message?.slice(0, 500) ?? 'erreur inconnue' },
    });
  }
}

/**
 * Applique le résultat transmis par l'opérateur, puis répercute le statut sur
 * la commande ou la réservation concernée.
 */
export async function settlePayment({ reference, status, providerRef, raw }) {
  const intent = await prisma.paymentIntent.findUnique({ where: { reference } });
  if (!intent) return null;
  if (intent.status === 'succeeded') return intent; // rappel rejoué : sans effet

  const updated = await prisma.paymentIntent.update({
    where: { id: intent.id },
    data: {
      status,
      provider_ref: providerRef ?? intent.provider_ref,
      raw_callback: raw ?? undefined,
    },
  });

  const paymentStatus = status === 'succeeded' ? 'paid' : status === 'failed' ? 'failed' : 'pending';

  if (intent.target_type === 'order') {
    await prisma.order.updateMany({
      where: { id: intent.target_id },
      data: {
        payment_status: paymentStatus,
        status: status === 'succeeded' ? 'confirmed' : undefined,
      },
    });
  } else if (intent.target_type === 'reservation') {
    await prisma.clickCollectReservation.updateMany({
      where: { id: intent.target_id },
      data: {
        payment_status: paymentStatus,
        status: status === 'succeeded' ? 'confirmed' : undefined,
      },
    });
  }

  return updated;
}

/** Signature HMAC du corps brut du webhook, comparée en temps constant. */
export function verifyWebhookSignature(rawBody, signature) {
  if (!env.PAYMENT_WEBHOOK_SECRET) return false;
  const expected = crypto
    .createHmac('sha256', env.PAYMENT_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature ?? ''));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
