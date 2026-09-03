import { prisma } from '../lib/prisma.js';
import { badRequest, conflict, notFound } from '../lib/errors.js';
import { xaf } from './pricing.js';
import { generateConfirmationCode, hashCode } from './pickup-token.js';
import { createPaymentIntent } from '../payments/index.js';
import { publish } from '../realtime/bus.js';

/**
 * Réserve un panier Click & Collect.
 *
 * L'incrément de `quantity_reserved` est conditionné par une clause SQL sur la
 * quantité restante : deux réservations simultanées sur le dernier panier ne
 * peuvent pas aboutir toutes les deux.
 */
export async function createReservation({ user, input }) {
  const basket = await prisma.clickCollectBasket.findUnique({ where: { id: input.basket_id } });
  if (!basket) throw notFound('Panier introuvable');
  if (basket.status !== 'active') throw badRequest("Ce panier n'est plus disponible");

  const quantity = input.quantity ?? 1;
  const remaining = (basket.quantity_available ?? 0) - (basket.quantity_reserved ?? 0);
  if (quantity < 1) throw badRequest('Quantité invalide');
  if (remaining < quantity) throw conflict(`Il ne reste que ${Math.max(0, remaining)} panier(s)`);

  if (basket.pickup_slots?.length && !basket.pickup_slots.includes(input.pickup_slot)) {
    throw badRequest('Créneau de retrait invalide');
  }

  const unitPrice = xaf(basket.discounted_price);
  const totalAmount = unitPrice * quantity;
  const savings = Math.max(0, xaf(basket.original_price) - unitPrice) * quantity;
  const code = generateConfirmationCode();

  const reservation = await prisma.$transaction(async (tx) => {
    const claimed = await tx.$executeRaw`
      UPDATE "ClickCollectBasket"
         SET "quantity_reserved" = "quantity_reserved" + ${quantity}
       WHERE "id" = ${basket.id}
         AND "quantity_available" - "quantity_reserved" >= ${quantity}
    `;
    if (claimed !== 1) throw conflict('Ce panier vient d’être réservé par quelqu’un d’autre');

    await tx.clickCollectBasket.updateMany({
      where: { id: basket.id, quantity_reserved: { gte: basket.quantity_available ?? 0 } },
      data: { status: 'sold_out' },
    });

    return tx.clickCollectReservation.create({
      data: {
        customer_email: user.email,
        customer_name: user.full_name ?? null,
        customer_phone: input.customer_phone ?? user.phone ?? null,
        basket_id: basket.id,
        basket_name: basket.name,
        store_id: basket.store_id,
        store_name: basket.store_name,
        store_address: basket.store_address,
        pickup_date: basket.pickup_date,
        pickup_slot: input.pickup_slot,
        quantity,
        unit_price: unitPrice,
        total_amount: totalAmount,
        savings_amount: savings,
        payment_method: input.payment_method,
        payment_status: 'pending',
        confirmation_code_hash: hashCode(code),
        status: 'reserved',
        co2_saved_kg: (basket.co2_saved_kg ?? 0) * quantity,
      },
    });
  });

  const payment = await createPaymentIntent({
    targetType: 'reservation',
    targetId: reservation.id,
    amount: totalAmount,
    customerEmail: user.email,
    customerPhone: reservation.customer_phone,
    method: input.payment_method,
  });

  const updated = await prisma.clickCollectReservation.update({
    where: { id: reservation.id },
    data: { payment_reference: payment.reference, payment_status: payment.status },
  });

  publish('ClickCollectReservation', { type: 'create', id: updated.id, data: updated });

  // Le code n'est renvoyé qu'ici, une seule fois : la base n'en garde qu'un condensat.
  return { reservation: updated, confirmation_code: code, payment };
}

/** Valide un retrait en magasin à partir du code présenté par le client. */
export async function collectReservation({ reservationId, code, storeIds }) {
  const reservation = await prisma.clickCollectReservation.findUnique({ where: { id: reservationId } });
  if (!reservation) throw notFound('Réservation introuvable');
  if (!storeIds.includes(reservation.store_id)) throw notFound('Réservation introuvable');
  if (reservation.status === 'collected') throw badRequest('Réservation déjà retirée');

  const { codeMatches } = await import('./pickup-token.js');
  if (!codeMatches(code, reservation.confirmation_code_hash)) {
    throw badRequest('Code de confirmation invalide');
  }

  return prisma.clickCollectReservation.update({
    where: { id: reservation.id },
    data: { status: 'collected', collected_at: new Date() },
  });
}
