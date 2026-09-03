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
        if (!OPERATORS.has(op)) throw badRequest(`Opérateur non autorisé : ${op}`);
        clause[op] = value;
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
