import { z } from 'zod';
import { badRequest } from '../lib/errors.js';

export const MAX_LIMIT = 200;
export const DEFAULT_LIMIT = 50;

/**
 * Traduit le tri façon `-created_date` (ordre décroissant) en clause Prisma.
 */
export function parseSort(sort) {
  if (!sort) return { created_date: 'desc' };
  const desc = sort.startsWith('-');
  const field = desc ? sort.slice(1) : sort;
  if (!/^[a-z_][a-z0-9_]*$/i.test(field)) throw badRequest(`Tri invalide : ${sort}`);
  return { [field]: desc ? 'desc' : 'asc' };
}

const OPERATORS = new Set(['equals', 'not', 'in', 'notIn', 'lt', 'lte', 'gt', 'gte', 'contains', 'startsWith', 'has', 'hasSome']);

/**
 * `mode` n'est pas un opérateur mais un modificateur de comparaison textuelle.
 * Sans lui, aucune recherche par nom ne peut ignorer la casse : chercher
 * « riz » ne trouvait pas « Riz parfumé », et l'écran concluait à l'absence.
 * Seule la valeur `insensitive` est acceptée — `default` est déjà le
 * comportement de PostgreSQL et n'a rien à faire dans une requête.
 */
const MODIFIERS = { mode: new Set(['insensitive']) };

/**
 * Convertit un filtre plat `{ status: 'active', quantity_available: { gt: 0 } }`
 * en clause `where` Prisma, en n'autorisant qu'une liste fermée d'opérateurs.
 */
export function parseFilter(filter, allowedFields) {
  if (!filter || typeof filter !== 'object' || Array.isArray(filter)) return {};
  const where = {};

  for (const [field, raw] of Object.entries(filter)) {
    if (!allowedFields.has(field)) throw badRequest(`Champ inconnu dans le filtre : ${field}`);
    if (raw === null) {
      where[field] = null;
      continue;
    }
    if (typeof raw === 'object' && !Array.isArray(raw)) {
      const clause = {};
      for (const [op, value] of Object.entries(raw)) {
        const autorisées = MODIFIERS[op];
        if (autorisées) {
          if (!autorisées.has(value)) throw badRequest(`Valeur non autorisée pour ${op} : ${value}`);
          clause[op] = value;
          continue;
        }
        if (!OPERATORS.has(op)) throw badRequest(`Opérateur non autorisé : ${op}`);
        clause[op] = value;
      }
      // Un `mode` seul ne compare rien : c'est une requête mal formée, pas un
      // filtre qui laisse tout passer.
      if (Object.keys(clause).every((key) => key in MODIFIERS)) {
        throw badRequest(`Filtre sans comparaison sur le champ ${field}`);
      }
      where[field] = clause;
      continue;
    }
    where[field] = Array.isArray(raw) ? { in: raw } : raw;
  }

  return where;
}

export const listQuerySchema = z.object({
  sort: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  offset: z.coerce.number().int().min(0).default(0),
  filter: z.string().optional(),
});

export function decodeFilterParam(raw) {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw badRequest('Paramètre `filter` : JSON invalide');
  }
}
