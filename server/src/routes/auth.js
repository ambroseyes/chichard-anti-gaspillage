import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import crypto from 'node:crypto';
import { prisma } from '../lib/prisma.js';
import { handler } from '../lib/async-handler.js';
import { badRequest, unauthorized } from '../lib/errors.js';
import { hashPassword, verifyPassword } from '../auth/password.js';
import {
  consumeRefreshToken,
  issueRefreshToken,
  revokeAllForUser,
  revokeRefreshToken,
  signAccessToken,
} from '../auth/tokens.js';
import { requireAuth } from '../auth/middleware.js';
import { stripHidden } from '../entities/schema.js';
import { recordAudit } from '../lib/audit.js';
import { sendEmail } from '../integrations/email.js';
import { passwordResetEmail } from '../integrations/templates.js';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';

export const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 10,
  // La suite de tests ouvre de nombreuses sessions : le quota fausserait le résultat.
  skip: () => env.NODE_ENV === 'test',
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { message: 'Trop de tentatives. Réessayez dans quelques minutes.' } },
});

const credentials = z.object({
  email: z.string().email('Adresse e-mail invalide').toLowerCase().trim(),
  password: z.string().min(10, 'Le mot de passe doit faire au moins 10 caractères'),
});

const registration = credentials.extend({
  full_name: z.string().min(2, 'Nom trop court').max(120),
  phone: z.string().min(8).max(20).optional(),
  city: z.string().max(80).optional(),
});

const REFRESH_COOKIE = 'chichard_refresh';

function setRefreshCookie(res, token, expiresAt) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/api/auth',
  });
}

async function issueSession(res, req, user) {
  const { token, expiresAt } = await issueRefreshToken(user, {
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  });
  setRefreshCookie(res, token, expiresAt);
  return {
    access_token: signAccessToken(user),
    user: stripHidden('User', user),
  };
}

authRouter.post(
  '/register',
  loginLimiter,
  handler(async (req, res) => {
    const parsed = registration.safeParse(req.body);
    if (!parsed.success) throw badRequest('Inscription invalide', parsed.error.issues);
    const { email, password, ...profile } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw badRequest('Un compte existe déjà avec cette adresse');

    const user = await prisma.user.create({
      data: {
        email,
        password_hash: await hashPassword(password),
        referral_code: crypto.randomBytes(4).toString('hex').toUpperCase(),
        ...profile,
      },
    });

    await recordAudit(req, {
      action: 'create', module: 'Auth', description: 'inscription',
      entity_id: user.id, actor_email: user.email,
    });
    res.status(201).json(await issueSession(res, req, user));
  }),
);

authRouter.post(
  '/login',
  loginLimiter,
  handler(async (req, res) => {
    const parsed = credentials.safeParse(req.body);
    if (!parsed.success) throw unauthorized('Identifiants invalides');
    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    const ok = await verifyPassword(user?.password_hash, password);

    if (!user || !ok || !user.is_active) {
      await recordAudit(req, {
        action: 'login', module: 'Auth', success: false, actor_email: email,
        description: 'identifiants refusés',
      });
      // Message identique dans les deux cas : on n'indique pas si le compte existe.
      throw unauthorized('Identifiants invalides');
    }

    await prisma.user.update({ where: { id: user.id }, data: { last_login_at: new Date() } });
    await recordAudit(req, {
      action: 'login', module: 'Auth', entity_id: user.id, actor_email: user.email,
    });

    res.json(await issueSession(res, req, user));
  }),
);

authRouter.post(
  '/refresh',
  handler(async (req, res) => {
    const record = await consumeRefreshToken(req.cookies?.[REFRESH_COOKIE]);
    if (!record) throw unauthorized('Session expirée');

    const user = await prisma.user.findUnique({ where: { email: record.user_email } });
    if (!user?.is_active) throw unauthorized('Session expirée');

    res.json(await issueSession(res, req, user));
  }),
);

authRouter.post(
  '/logout',
  handler(async (req, res) => {
    await revokeRefreshToken(req.cookies?.[REFRESH_COOKIE]);
    res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
    res.status(204).end();
  }),
);

authRouter.get(
  '/me',
  requireAuth,
  handler(async (req, res) => {
    res.json({ data: stripHidden('User', req.user) });
  }),
);

/** Champs qu'un utilisateur peut modifier sur son propre compte. */
const profileUpdate = z
  .object({
    full_name: z.string().min(2).max(120),
    phone: z.string().max(20),
    city: z.string().max(80),
    address: z.string().max(255),
    avatar_url: z.string().url(),
    featured_badge: z.string().max(60),
    is_public_profile: z.boolean(),
    allow_messages: z.boolean(),
    dietary_preferences: z.array(z.string().max(40)).max(30),
    allergens_to_avoid: z.array(z.string().max(40)).max(30),
    favorite_stores: z.array(z.string()).max(50),
    preferences: z.record(z.any()),
  })
  .partial()
  .strict();

authRouter.patch(
  '/me',
  requireAuth,
  handler(async (req, res) => {
    const parsed = profileUpdate.safeParse(req.body);
    if (!parsed.success) {
      // Un champ hors liste blanche (points, rôle, statut partenaire…) est refusé
      // explicitement plutôt que silencieusement ignoré.
      throw badRequest('Champs non modifiables depuis le profil', parsed.error.issues);
    }
    const user = await prisma.user.update({ where: { id: req.user.id }, data: parsed.data });
    res.json({ data: stripHidden('User', user) });
  }),
);

authRouter.post(
  '/change-password',
  requireAuth,
  handler(async (req, res) => {
    const schema = z.object({
      current_password: z.string(),
      new_password: z.string().min(10, 'Le mot de passe doit faire au moins 10 caractères'),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) throw badRequest('Requête invalide', parsed.error.issues);

    if (!(await verifyPassword(req.user.password_hash, parsed.data.current_password))) {
      throw unauthorized('Mot de passe actuel incorrect');
    }

    await prisma.user.update({
      where: { id: req.user.id },
      data: { password_hash: await hashPassword(parsed.data.new_password) },
    });
    // Un changement de mot de passe invalide toutes les autres sessions.
    await revokeAllForUser(req.user.email);
    await recordAudit(req, { action: 'update', module: 'Auth', description: 'mot de passe modifié' });

    res.status(204).end();
  }),
);

authRouter.post(
  '/forgot-password',
  loginLimiter,
  handler(async (req, res) => {
    const email = String(req.body?.email ?? '').toLowerCase().trim();
    const user = email ? await prisma.user.findUnique({ where: { email } }) : null;

    if (user) {
      const token = crypto.randomBytes(32).toString('base64url');
      await prisma.refreshToken.create({
        data: {
          token_hash: crypto.createHash('sha256').update(`reset:${token}`).digest('hex'),
          user_email: user.email,
          expires_at: new Date(Date.now() + 3600_000),
          user_agent: 'password-reset',
        },
      });
      sendEmail({
        to: user.email,
        subject: 'Réinitialisation de votre mot de passe — Chichard',
        html: passwordResetEmail({
          resetUrl: `${env.CORS_ORIGINS.split(',')[0]}/reset-password?token=${token}`,
        }),
      }).catch((error) => logger.warn({ err: error }, 'e-mail de réinitialisation non envoyé'));
    }

    // Réponse identique que le compte existe ou non.
    res.json({ data: { sent: true } });
  }),
);

authRouter.post(
  '/reset-password',
  loginLimiter,
  handler(async (req, res) => {
    const schema = z.object({ token: z.string(), password: z.string().min(10) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) throw badRequest('Requête invalide', parsed.error.issues);

    const hash = crypto.createHash('sha256').update(`reset:${parsed.data.token}`).digest('hex');
    const record = await prisma.refreshToken.findUnique({ where: { token_hash: hash } });
    if (!record || record.revoked_at || record.expires_at < new Date()) {
      throw badRequest('Lien expiré ou déjà utilisé');
    }

    await prisma.refreshToken.update({ where: { id: record.id }, data: { revoked_at: new Date() } });
    await prisma.user.update({
      where: { email: record.user_email },
      data: { password_hash: await hashPassword(parsed.data.password) },
    });
    await revokeAllForUser(record.user_email);

    res.status(204).end();
  }),
);
