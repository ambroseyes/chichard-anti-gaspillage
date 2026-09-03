import { prisma } from '../lib/prisma.js';

/** Supprime les jetons de session périmés ou révoqués depuis plus d'un mois. */
export async function purgeExpiredTokens({ now = new Date() } = {}) {
  const cutoff = new Date(now.getTime() - 30 * 86_400_000);
  const { count } = await prisma.refreshToken.deleteMany({
    where: { OR: [{ expires_at: { lt: now } }, { revoked_at: { lt: cutoff } }] },
  });
  return { deleted: count };
}
