import { prisma } from '../lib/prisma.js';
import { forbidden, unauthorized } from '../lib/errors.js';
import { verifyAccessToken } from './tokens.js';

const BEARER = /^Bearer (.+)$/i;

/**
 * Résout l'utilisateur courant s'il présente un jeton valide.
 * N'échoue pas en l'absence de jeton : c'est `requireAuth` qui tranche.
 */
export async function attachUser(req, _res, next) {
  const match = BEARER.exec(req.headers.authorization ?? '');
  // EventSource ne permet pas d'en-tête : le flux SSE présente son jeton en
  // paramètre. Aucune autre route ne l'accepte sous cette forme.
  const fromQuery = req.path.startsWith('/api/realtime') ? req.query?.access_token : null;
  const token = match?.[1] ?? fromQuery;
  if (!token) return next();

  try {
    const payload = verifyAccessToken(token);
    // On relit l'utilisateur en base : un rôle révoqué doit l'être immédiatement,
    // sans attendre l'expiration du jeton.
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (user?.is_active) req.user = user;
  } catch {
    // Jeton absent, expiré ou falsifié : la requête continue en anonyme.
  }
  return next();
}

export function requireAuth(req, _res, next) {
  if (!req.user) return next(unauthorized());
  return next();
}

/** Rôles applicatifs : `admin` global. */
export function requireAdmin(req, _res, next) {
  if (!req.user) return next(unauthorized());
  if (req.user.role !== 'admin') return next(forbidden());
  return next();
}

/**
 * Rôles du backoffice. `admin` applicatif vaut `admin` backoffice.
 * Toutes les routes du backoffice passent par ici — c'est le point unique.
 */
export function requireBackoffice(...roles) {
  const allowed = new Set(roles.length ? roles : ['operator', 'admin', 'super_admin']);
  return (req, _res, next) => {
    if (!req.user) return next(unauthorized());
    const role = req.user.backoffice_role === 'none' && req.user.role === 'admin'
      ? 'admin'
      : req.user.backoffice_role;
    if (!allowed.has(role)) return next(forbidden("Accès réservé au backoffice"));
    req.backofficeRole = role;
    return next();
  };
}

export function requirePartner(req, _res, next) {
  if (!req.user) return next(unauthorized());
  if (!req.user.is_partner && req.user.role !== 'admin') {
    return next(forbidden('Accès réservé aux partenaires'));
  }
  return next();
}

export function requireDriver(req, _res, next) {
  if (!req.user) return next(unauthorized());
  if (!req.user.is_delivery_driver && req.user.role !== 'admin') {
    return next(forbidden('Accès réservé aux livreurs'));
  }
  return next();
}
