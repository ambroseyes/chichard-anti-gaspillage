import { Router } from 'express';
import { z } from 'zod';
import { handler } from '../lib/async-handler.js';
import { badRequest } from '../lib/errors.js';
import { requireAuth } from '../auth/middleware.js';
import { ECO_LEVELS, LOYALTY_TIERS, bookExperience, ecoLevelFor, redeemReward, tierFor } from '../domain/loyalty.js';

export const loyaltyRouter = Router();

loyaltyRouter.get(
  '/summary',
  requireAuth,
  handler(async (req, res) => {
    const points = req.user.loyalty_points ?? 0;
    const kg = req.user.waste_avoided_kg ?? 0;
    const tier = tierFor(points);
    const level = ecoLevelFor(kg);
    const nextTier = LOYALTY_TIERS[LOYALTY_TIERS.indexOf(tier) + 1] ?? null;
    const nextLevel = ECO_LEVELS[ECO_LEVELS.indexOf(level) + 1] ?? null;

    res.json({
      data: {
        loyalty_points: points,
        waste_avoided_kg: kg,
        tier,
        next_tier: nextTier,
        points_to_next_tier: nextTier ? Math.max(0, nextTier.minPoints - points) : 0,
        eco_level: level,
        next_eco_level: nextLevel,
        kg_to_next_level: nextLevel ? Math.max(0, nextLevel.minKg - kg) : 0,
      },
    });
  }),
);

loyaltyRouter.post(
  '/redeem',
  requireAuth,
  handler(async (req, res) => {
    const parsed = z.object({ reward_id: z.string().min(1) }).safeParse(req.body);
    if (!parsed.success) throw badRequest('Requête invalide', parsed.error.issues);
    res.json({ data: await redeemReward({ user: req.user, rewardId: parsed.data.reward_id }) });
  }),
);

loyaltyRouter.post(
  '/experiences/:id/book',
  requireAuth,
  handler(async (req, res) => {
    res.status(201).json({
      data: await bookExperience({ user: req.user, experienceId: req.params.id }),
    });
  }),
);
