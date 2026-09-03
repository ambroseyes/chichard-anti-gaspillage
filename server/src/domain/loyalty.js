import { prisma } from '../lib/prisma.js';
import { badRequest, conflict, notFound } from '../lib/errors.js';
import { generateConfirmationCode } from './pickup-token.js';

/** Paliers de fidélité — source unique, partagée avec le front via /api/config. */
export const LOYALTY_TIERS = Object.freeze([
  { key: 'bronze', label: 'Bronze', minPoints: 0 },
  { key: 'silver', label: 'Argent', minPoints: 500 },
  { key: 'gold', label: 'Or', minPoints: 1500 },
  { key: 'platinum', label: 'Platine', minPoints: 3000 },
  { key: 'diamond', label: 'Diamant', minPoints: 6000 },
]);

export const ECO_LEVELS = Object.freeze([
  { key: 'debutant', label: 'Débutant', minKg: 0 },
  { key: 'engage', label: 'Engagé', minKg: 10 },
  { key: 'expert', label: 'Expert', minKg: 50 },
  { key: 'ambassadeur', label: 'Ambassadeur', minKg: 150 },
  { key: 'heros', label: 'Héros', minKg: 500 },
]);

export const tierFor = (points) =>
  [...LOYALTY_TIERS].reverse().find((t) => points >= t.minPoints) ?? LOYALTY_TIERS[0];

export const ecoLevelFor = (kg) =>
  [...ECO_LEVELS].reverse().find((l) => kg >= l.minKg) ?? ECO_LEVELS[0];

/**
 * Échange des points contre une récompense. Le solde est débité côté serveur,
 * sous condition SQL : un double clic ou deux onglets ne peuvent pas débiter
 * deux fois le même solde.
 */
export async function redeemReward({ user, rewardId }) {
  const reward = await prisma.loyaltyReward.findUnique({ where: { id: rewardId } });
  if (!reward || !reward.is_active) throw notFound('Récompense indisponible');
  if (reward.stock !== null && reward.stock !== undefined && reward.stock <= 0) {
    throw conflict('Cette récompense est épuisée');
  }

  const cost = reward.points_required;
  if ((user.loyalty_points ?? 0) < cost) throw badRequest('Points insuffisants');

  return prisma.$transaction(async (tx) => {
    const debited = await tx.user.updateMany({
      where: { id: user.id, loyalty_points: { gte: cost } },
      data: { loyalty_points: { decrement: cost } },
    });
    if (debited.count !== 1) throw conflict('Solde de points insuffisant');

    if (reward.stock !== null && reward.stock !== undefined) {
      await tx.loyaltyReward.updateMany({
        where: { id: reward.id, stock: { gt: 0 } },
        data: { stock: { decrement: 1 } },
      });
    }

    await tx.loyaltyTransaction.create({
      data: {
        user_email: user.email,
        type: 'redeem',
        points: -cost,
        source: 'redemption',
        description: `Échange : ${reward.title}`,
      },
    });

    // Une récompense de type remise se matérialise par un coupon nominatif.
    let coupon = null;
    if (reward.reward_type === 'discount' && reward.reward_value) {
      coupon = await tx.coupon.create({
        data: {
          code: `ECO-${generateConfirmationCode(6).replace('-', '')}`,
          user_email: user.email,
          type: reward.reward_value <= 100 ? 'PERCENT' : 'FIXED',
          value: reward.reward_value,
          points_cost: cost,
          valid_from: new Date(),
          valid_to: new Date(Date.now() + 30 * 86_400_000),
          status: 'ACTIVE',
        },
      });
    }

    const refreshed = await tx.user.findUnique({ where: { id: user.id } });
    const tier = tierFor(refreshed.loyalty_points);
    if (tier.key !== refreshed.loyalty_tier) {
      await tx.user.update({ where: { id: user.id }, data: { loyalty_tier: tier.key } });
    }

    return { reward, coupon, remaining_points: refreshed.loyalty_points };
  });
}

/** Réserve une place sur une expérience partenaire, en débitant les points. */
export async function bookExperience({ user, experienceId }) {
  const experience = await prisma.experience.findUnique({ where: { id: experienceId } });
  if (!experience || !experience.is_active) throw notFound('Expérience indisponible');
  if (experience.current_participants >= experience.max_participants) {
    throw conflict('Plus de place disponible');
  }

  const cost = experience.points_required;
  if ((user.loyalty_points ?? 0) < cost) throw badRequest('Points insuffisants');

  return prisma.$transaction(async (tx) => {
    const seat = await tx.experience.updateMany({
      where: { id: experience.id, current_participants: { lt: experience.max_participants } },
      data: { current_participants: { increment: 1 } },
    });
    if (seat.count !== 1) throw conflict('Plus de place disponible');

    const debited = await tx.user.updateMany({
      where: { id: user.id, loyalty_points: { gte: cost } },
      data: { loyalty_points: { decrement: cost } },
    });
    if (debited.count !== 1) throw conflict('Solde de points insuffisant');

    await tx.loyaltyTransaction.create({
      data: {
        user_email: user.email,
        type: 'redeem',
        points: -cost,
        source: 'redemption',
        description: `Expérience : ${experience.title}`,
      },
    });

    return tx.experienceBooking.create({
      data: {
        experience_id: experience.id,
        experience_title: experience.title,
        user_email: user.email,
        user_name: user.full_name ?? null,
        user_phone: user.phone ?? null,
        status: 'confirmed',
        points_spent: cost,
        event_date: experience.event_date,
        event_time: experience.event_time,
        store_name: experience.store_name,
      },
    });
  });
}
