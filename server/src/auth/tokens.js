import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';

const ISSUER = 'chichard';

/**
 * Jeton d'accès court. Ne contient que l'identité et les rôles : toute décision
 * d'autorisation est reprise côté serveur à partir de la base.
 */
export function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      backoffice_role: user.backoffice_role,
      is_partner: user.is_partner,
      is_delivery_driver: user.is_delivery_driver,
      store_id: user.store_id ?? null,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_ACCESS_TTL, issuer: ISSUER },
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_SECRET, { issuer: ISSUER });
}

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

/** Le jeton de rafraîchissement n'est stocké que sous forme de condensat. */
export async function issueRefreshToken(user, { userAgent, ip } = {}) {
  const token = crypto.randomBytes(48).toString('base64url');
  const expiresAt = new Date(Date.now() + env.JWT_REFRESH_TTL_DAYS * 86400_000);

  await prisma.refreshToken.create({
    data: {
      token_hash: hashToken(token),
      user_email: user.email,
      user_agent: userAgent?.slice(0, 255) ?? null,
      ip: ip ?? null,
      expires_at: expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function consumeRefreshToken(token) {
  if (!token) return null;
  const record = await prisma.refreshToken.findUnique({ where: { token_hash: hashToken(token) } });
  if (!record || record.revoked_at || record.expires_at < new Date()) return null;

  // Rotation : le jeton présenté est immédiatement invalidé.
  await prisma.refreshToken.update({
    where: { id: record.id },
    data: { revoked_at: new Date() },
  });
  return record;
}

export async function revokeRefreshToken(token) {
  if (!token) return;
  await prisma.refreshToken.updateMany({
    where: { token_hash: hashToken(token), revoked_at: null },
    data: { revoked_at: new Date() },
  });
}

export async function revokeAllForUser(email) {
  await prisma.refreshToken.updateMany({
    where: { user_email: email, revoked_at: null },
    data: { revoked_at: new Date() },
  });
}
