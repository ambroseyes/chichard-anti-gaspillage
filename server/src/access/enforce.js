import { ACCESS, policyFor } from './policies.js';
import { backofficeRoleOf, withStoreContext } from './context.js';
import { forbidden, notFound, unauthorized } from '../lib/errors.js';

const { PUBLIC, AUTH, OWNER, STORE, PARTNER, DRIVER, BACKOFFICE, ADMIN, NEVER } = ACCESS;

const isAdmin = (user) => user?.role === 'admin';
const isBackoffice = (user) => backofficeRoleOf(user) !== 'none';

/**
 * Filtre Prisma restreignant une liste au périmètre autorisé.
 * `null` = tout est visible. `DENY` = rien n'est visible.
 */
export const DENY = Symbol('deny');

export async function readScope(entity, user, req) {
  const policy = policyFor(entity);
  if (!policy) return DENY;
  if (isAdmin(user)) return null;

  const levels = [policy.read, ...(policy.readAlso ?? [])];
  const clauses = [];

  for (const level of levels) {
    switch (level) {
      case PUBLIC:
        return null;
      case AUTH:
        if (user) return null;
        break;
      case ADMIN:
        break; // déjà traité plus haut
      case BACKOFFICE:
        if (isBackoffice(user)) return null;
        break;
      case PARTNER:
        if (user?.is_partner) return null;
        break;
      case DRIVER:
        if (user?.is_delivery_driver) return null;
        break;
      case OWNER:
        if (user && policy.owner) clauses.push({ [policy.owner]: user.email });
        break;
      case STORE: {
        if (!user) break;
        const storeIds = await withStoreContext(req);
        if (storeIds.length && policy.store) {
          clauses.push({ [policy.store]: { in: storeIds } });
        }
        break;
      }
      case NEVER:
      default:
        break;
    }
  }

  if (!clauses.length) return DENY;
  return clauses.length === 1 ? clauses[0] : { OR: clauses };
}

/**
 * Vérifie le droit d'écrire (`create` / `update` / `delete`).
 * `row` est la ligne existante pour update/delete, l'objet soumis pour create.
 */
export async function assertWrite(entity, operation, { user, row, req }) {
  const policy = policyFor(entity);
  if (!policy) throw notFound(`Entité inconnue : ${entity}`);

  const level = policy[operation];
  if (!level || level === NEVER) {
    throw forbidden(
      `L'opération « ${operation} » sur ${entity} passe par un point d'entrée métier dédié`,
    );
  }
  if (isAdmin(user)) return;
  if (!user && level !== PUBLIC) throw unauthorized();

  switch (level) {
    case PUBLIC:
    case AUTH:
      return;
    case ADMIN:
      throw forbidden();
    case BACKOFFICE:
      if (isBackoffice(user)) return;
      throw forbidden();
    case PARTNER:
      if (user.is_partner) return;
      throw forbidden('Réservé aux partenaires');
    case DRIVER:
      if (user.is_delivery_driver) return;
      throw forbidden('Réservé aux livreurs');
    case OWNER: {
      if (!policy.owner) throw forbidden();
      if (row?.[policy.owner] === user.email) return;
      throw forbidden("Cette ressource ne vous appartient pas");
    }
    case STORE: {
      if (!policy.store) throw forbidden();
      const storeIds = await withStoreContext(req);
      const target = policy.store === 'id' ? row?.id : row?.[policy.store];
      // Création d'un magasin : pas encore d'id, l'utilisateur devient propriétaire.
      if (policy.store === 'id' && !target) return;
      if (target && storeIds.includes(target)) return;
      throw forbidden("Ce magasin n'est pas le vôtre");
    }
    default:
      throw forbidden();
  }
}

/**
 * Retire du payload tout champ que le client n'a pas le droit d'écrire :
 * champs système, champs pilotés par le serveur (`protected`), et — si la
 * politique définit une liste blanche `writable` — tout le reste.
 */
const SYSTEM_FIELDS = new Set(['id', 'created_date', 'updated_date']);

export function sanitizeWrite(entity, data, { user }) {
  const policy = policyFor(entity);
  const out = {};
  const rejected = [];

  for (const [key, value] of Object.entries(data ?? {})) {
    if (SYSTEM_FIELDS.has(key)) continue;
    if (policy?.writable && !policy.writable.includes(key)) {
      rejected.push(key);
      continue;
    }
    if (policy?.protected?.includes(key) && !isAdmin(user)) {
      rejected.push(key);
      continue;
    }
    out[key] = value;
  }

  return { data: out, rejected };
}

/** Champs injectés depuis la session, jamais depuis le corps de la requête. */
export function ownershipDefaults(entity, user) {
  const policy = policyFor(entity);
  if (!policy?.owner || !user) return {};
  return { [policy.owner]: user.email };
}
