import crypto from 'node:crypto';
import { env } from '../config/env.js';

/**
 * Jeton de retrait / livraison.
 *
 * Format : `<target>.<id>.<expiration>.<signature>`
 * La signature est un HMAC-SHA256 du reste, avec un secret serveur. Le jeton
 * est donc infalsifiable côté client, et sa vérification ne dépend d'aucune
 * information devinable (contrairement à un identifiant de commande).
 */
const SEPARATOR = '.';
const DEFAULT_TTL_MS = 48 * 3600_000;

const sign = (payload) =>
  crypto.createHmac('sha256', env.PICKUP_TOKEN_SECRET).update(payload).digest('base64url');

export function issuePickupToken({ target, id, ttlMs = DEFAULT_TTL_MS, now = Date.now() }) {
  const expiresAt = now + ttlMs;
  const payload = [target, id, expiresAt].join(SEPARATOR);
  return `${payload}${SEPARATOR}${sign(payload)}`;
}

/**
 * @returns {{ valid: boolean, reason?: string, target?: string, id?: string }}
 */
export function verifyPickupToken(token, { target, id, now = Date.now() } = {}) {
  if (typeof token !== 'string') return { valid: false, reason: 'format' };

  const parts = token.split(SEPARATOR);
  if (parts.length !== 4) return { valid: false, reason: 'format' };

  const [tokenTarget, tokenId, expiresAtRaw, signature] = parts;
  const payload = [tokenTarget, tokenId, expiresAtRaw].join(SEPARATOR);

  const expected = Buffer.from(sign(payload));
  const provided = Buffer.from(signature);
  if (expected.length !== provided.length || !crypto.timingSafeEqual(expected, provided)) {
    return { valid: false, reason: 'signature' };
  }

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < now) return { valid: false, reason: 'expired' };

  if (target && tokenTarget !== target) return { valid: false, reason: 'target' };
  if (id && tokenId !== id) return { valid: false, reason: 'mismatch' };

  return { valid: true, target: tokenTarget, id: tokenId };
}

/** Code court saisissable à la main, tiré d'une source cryptographique. */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // sans I, L, O, 0, 1

export function generateConfirmationCode(length = 8) {
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i += 1) out += ALPHABET[bytes[i] % ALPHABET.length];
  return `${out.slice(0, 4)}-${out.slice(4)}`;
}

export const hashCode = (code) =>
  crypto.createHmac('sha256', env.PICKUP_TOKEN_SECRET).update(code.toUpperCase()).digest('hex');

export function codeMatches(code, hash) {
  if (!code || !hash) return false;
  const a = Buffer.from(hashCode(code));
  const b = Buffer.from(hash);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
