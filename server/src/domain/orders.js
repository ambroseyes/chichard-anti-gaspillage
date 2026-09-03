import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { badRequest, conflict, notFound, unprocessable } from '../lib/errors.js';
import { computeOrderTotals, co2SavedKg, xaf } from './pricing.js';
import { issuePickupToken, hashCode, generateConfirmationCode } from './pickup-token.js';
import { createPaymentIntent } from '../payments/index.js';
import { sendEmail } from '../integrations/email.js';
import { orderConfirmationEmail } from '../integrations/templates.js';
import { publish } from '../realtime/bus.js';
import { logger } from '../lib/logger.js';

const WEIGHT_TO_KG = { g: 0.001, kg: 1, L: 1, mL: 0.001, piece: 0.3 };

const productWeightKg = (p) =>
  p.weight ? p.weight * (WEIGHT_TO_KG[p.weight_unit] ?? 0.001) : 0.3;

/**
 * Crée une commande de bout en bout, dans une transaction unique :
 *
 *  1. relit les produits en base — les prix envoyés par le client sont ignorés ;
 *  2. vérifie la disponibilité et décrémente le stock (`updateMany` conditionnel :
 *     deux commandes concurrentes ne peuvent pas passer sur le dernier article) ;
 *  3. applique et consomme le coupon ;
 *  4. ajoute les frais de livraison ;
 *  5. trace un mouvement de stock ;
 *  6. vide le panier ;
 *  7. crédite les points de fidélité et les statistiques écologiques.
 *
 * Le paiement est déclenché après la transaction : la commande reste
 * `payment_status = pending` tant que l'opérateur n'a pas confirmé.
 */
export async function createOrder({ user, input }) {
  const cartItems = await prisma.cartItem.findMany({ where: { user_email: user.email } });
  if (!cartItems.length) throw badRequest('Votre panier est vide');

  const productIds = [...new Set(cartItems.map((i) => i.product_id).filter(Boolean))];
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  const byId = new Map(products.map((p) => [p.id, p]));

  const lines = [];
  const unavailable = [];

  for (const item of cartItems) {
    const product = byId.get(item.product_id);
    if (!product || product.status !== 'active') {
      unavailable.push({ product_id: item.product_id, reason: 'indisponible' });
      continue;
    }
    if ((product.quantity_available ?? 0) < item.quantity) {
      unavailable.push({
        product_id: product.id,
        product_name: product.name,
        reason: 'stock insuffisant',
        remaining: product.quantity_available ?? 0,
      });
      continue;
    }
    lines.push({
      product_id: product.id,
      product_name: product.name,
      quantity: item.quantity,
      unit_price: xaf(product.discounted_price), // prix serveur, pas prix client
      original_price: xaf(product.original_price),
      store_id: product.store_id,
      store_name: product.store_name,
      weight_kg: productWeightKg(product),
    });
  }

  if (unavailable.length) {
    throw conflict("Certains articles ne sont plus disponibles", { unavailable });
  }

  let coupon = null;
  if (input.coupon_code) {
    coupon = await prisma.coupon.findFirst({
      where: { code: input.coupon_code.toUpperCase(), user_email: user.email },
    });
    if (!coupon) throw badRequest('Code promo inconnu');
  }

  const totals = computeOrderTotals({
    lines,
    deliveryType: input.delivery_type,
    coupon,
    deliveryFee: env.DELIVERY_FEE_XAF,
    freeDeliveryThreshold: env.FREE_DELIVERY_THRESHOLD_XAF,
  });

  if (totals.couponError) throw badRequest(totals.couponError);

  const stores = [...new Set(lines.map((l) => l.store_id).filter(Boolean))];
  const confirmationCode = generateConfirmationCode();
  const co2 = co2SavedKg(lines, env.CO2_KG_PER_KG_SAVED);

  const order = await prisma.$transaction(async (tx) => {
    // Décrément conditionnel : la clause `gte` fait échouer la course.
    for (const line of lines) {
      const updated = await tx.product.updateMany({
        where: { id: line.product_id, quantity_available: { gte: line.quantity } },
        data: {
          quantity_available: { decrement: line.quantity },
          quantity_sold: { increment: line.quantity },
        },
      });
      if (updated.count !== 1) {
        throw conflict(`Stock épuisé pour « ${line.product_name} » pendant la validation`);
      }
    }

    // Passage automatique en rupture.
    await tx.product.updateMany({
      where: { id: { in: lines.map((l) => l.product_id) }, quantity_available: { lte: 0 } },
      data: { status: 'sold_out' },
    });

    if (coupon) {
      const used = await tx.coupon.updateMany({
        where: { id: coupon.id, status: 'ACTIVE' },
        data: { status: 'USED' },
      });
      if (used.count !== 1) throw conflict('Ce coupon vient d’être utilisé');
    }

    const created = await tx.order.create({
      data: {
        order_number: `CMD-${Date.now().toString(36).toUpperCase()}`,
        customer_email: user.email,
        customer_name: user.full_name ?? null,
        customer_phone: input.customer_phone ?? user.phone ?? null,
        items: lines.map(({ weight_kg: _w, ...rest }) => rest),
        subtotal_amount: totals.subtotal,
        delivery_fee: totals.deliveryFee,
        discount_amount: totals.discount,
        total_amount: totals.total,
        total_savings: totals.savings + totals.discount,
        coupon_code: coupon?.code ?? null,
        status: 'pending',
        payment_method: input.payment_method,
        payment_status: 'pending',
        delivery_type: input.delivery_type,
        delivery_address: input.delivery_type === 'delivery' ? input.delivery_address : null,
        store_id: stores.length === 1 ? stores[0] : null,
        store_name: stores.length === 1 ? lines[0].store_name : `${stores.length} magasins`,
        pickup_token_hash: hashCode(confirmationCode),
        co2_saved_kg: co2,
      },
    });

    if (coupon) {
      await tx.coupon.update({
        where: { id: coupon.id },
        data: { redeemed_order_id: created.id },
      });
    }

    for (const line of lines) {
      const product = byId.get(line.product_id);
      await tx.stockMovement.create({
        data: {
          product_id: line.product_id,
          store_id: line.store_id ?? null,
          movement_type: 'out',
          quantity: line.quantity,
          reason: 'vente',
          reference: created.id,
          user_email: user.email,
          previous_quantity: product.quantity_available ?? 0,
          new_quantity: (product.quantity_available ?? 0) - line.quantity,
        },
      });
    }

    await tx.cartItem.deleteMany({ where: { user_email: user.email } });

    // Fidélité : 1 point par tranche de 100 FCFA réellement payés.
    const points = Math.floor(totals.total / 100);
    await tx.user.update({
      where: { id: user.id },
      data: {
        total_orders: { increment: 1 },
        total_savings: { increment: totals.savings + totals.discount },
        waste_avoided_kg: { increment: co2 / env.CO2_KG_PER_KG_SAVED },
        loyalty_points: { increment: points },
        eco_points: { increment: points },
        phone: input.customer_phone ?? user.phone ?? undefined,
      },
    });
    if (points > 0) {
      await tx.loyaltyTransaction.create({
        data: {
          user_email: user.email,
          type: 'earn',
          points,
          source: 'purchase',
          description: `Commande ${created.order_number}`,
          order_id: created.id,
        },
      });
    }

    return created;
  });

  const payment = await createPaymentIntent({
    targetType: 'order',
    targetId: order.id,
    amount: order.total_amount,
    customerEmail: user.email,
    customerPhone: order.customer_phone,
    method: order.payment_method,
  });

  const withPayment = await prisma.order.update({
    where: { id: order.id },
    data: { payment_reference: payment.reference, payment_status: payment.status },
  });

  publish('Order', { type: 'create', id: order.id, data: withPayment });

  sendEmail({
    to: user.email,
    subject: `Commande ${order.order_number} enregistrée — Chichard`,
    html: orderConfirmationEmail({ order: withPayment, lines, confirmationCode, payment }),
  }).catch((error) => logger.warn({ err: error }, "e-mail de confirmation non envoyé"));

  return {
    order: withPayment,
    confirmation_code: confirmationCode,
    pickup_token: issuePickupToken({ target: 'order', id: order.id }),
    payment,
  };
}

/**
 * Prévisualise le total sans rien écrire — utilisé par le panier pour afficher
 * exactement ce qui sera facturé.
 */
export async function quoteCart({ user, deliveryType = 'pickup', couponCode = null }) {
  const cartItems = await prisma.cartItem.findMany({ where: { user_email: user.email } });
  const products = await prisma.product.findMany({
    where: { id: { in: cartItems.map((i) => i.product_id).filter(Boolean) } },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const lines = cartItems
    .filter((i) => byId.has(i.product_id))
    .map((i) => {
      const p = byId.get(i.product_id);
      return {
        product_id: p.id,
        product_name: p.name,
        quantity: i.quantity,
        unit_price: xaf(p.discounted_price),
        original_price: xaf(p.original_price),
        available: (p.quantity_available ?? 0) >= i.quantity && p.status === 'active',
        weight_kg: productWeightKg(p),
      };
    });

  const coupon = couponCode
    ? await prisma.coupon.findFirst({
        where: { code: couponCode.toUpperCase(), user_email: user.email },
      })
    : null;

  const totals = computeOrderTotals({
    lines,
    deliveryType,
    coupon,
    deliveryFee: env.DELIVERY_FEE_XAF,
    freeDeliveryThreshold: env.FREE_DELIVERY_THRESHOLD_XAF,
  });

  return {
    lines,
    ...totals,
    coupon_applied: coupon && !totals.couponError ? coupon.code : null,
    co2_saved_kg: co2SavedKg(lines, env.CO2_KG_PER_KG_SAVED),
    unavailable: lines.filter((l) => !l.available).map((l) => l.product_name),
  };
}

/** Annule une commande et remet le stock en rayon. */
export async function cancelOrder({ orderId, actor, reason }) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw notFound('Commande introuvable');
  if (['delivered', 'cancelled'].includes(order.status)) {
    throw unprocessable('Cette commande ne peut plus être annulée');
  }

  return prisma.$transaction(async (tx) => {
    for (const line of order.items ?? []) {
      await tx.product.updateMany({
        where: { id: line.product_id },
        data: {
          quantity_available: { increment: line.quantity },
          quantity_sold: { decrement: line.quantity },
          status: 'active',
        },
      });
      await tx.stockMovement.create({
        data: {
          product_id: line.product_id,
          movement_type: 'return',
          quantity: line.quantity,
          reason: 'annulation',
          reference: order.id,
          user_email: actor.email,
        },
      });
    }
    if (order.coupon_code) {
      await tx.coupon.updateMany({
        where: { code: order.coupon_code, redeemed_order_id: order.id },
        data: { status: 'ACTIVE', redeemed_order_id: null },
      });
    }
    return tx.order.update({
      where: { id: order.id },
      data: { status: 'cancelled', cancelled_at: new Date(), cancel_reason: reason ?? null },
    });
  });
}
