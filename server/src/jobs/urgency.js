import { prisma } from '../lib/prisma.js';
import { urgencyFor, suggestedPrice } from '../domain/pricing.js';

/**
 * Réévalue le niveau d'urgence et le prix conseillé de chaque produit actif,
 * et bascule en `expired` ceux dont la date est dépassée.
 */
export async function refreshUrgencyLevels({ now = new Date() } = {}) {
  const expired = await prisma.product.updateMany({
    where: { status: 'active', expiration_date: { lt: new Date(now.toDateString()) } },
    data: { status: 'expired' },
  });

  const products = await prisma.product.findMany({
    where: { status: 'active', expiration_date: { not: null } },
    select: { id: true, expiration_date: true, original_price: true, urgency_level: true },
  });

  let updated = 0;
  for (const product of products) {
    const { urgency } = urgencyFor(product.expiration_date, now);
    if (urgency === 'expired' || urgency === product.urgency_level) continue;

    await prisma.product.update({
      where: { id: product.id },
      data: {
        urgency_level: urgency,
        ai_suggested_price: suggestedPrice(product.original_price, product.expiration_date, now),
      },
    });
    updated += 1;
  }

  return { expired: expired.count, reclassified: updated };
}
