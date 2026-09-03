import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const entitiesDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'entities');

/** Définitions d'entités chargées une fois au démarrage. */
export const definitions = new Map();

for (const file of readdirSync(entitiesDir).filter((f) => f.endsWith('.json'))) {
  const def = JSON.parse(readFileSync(join(entitiesDir, file), 'utf8'));
  definitions.set(def.name, def);
}

const DATE_FIELD = /(_date|_at|_from|_to|_updated|_executed|_used)$|^timestamp$/;

function fieldSchema(field, spec) {
  const isDate = spec.type === 'string' && DATE_FIELD.test(field);

  let base;
  if (isDate) {
    // Le client envoie indifféremment « 2026-03-04 » ou un ISO complet.
    base = z.union([z.string(), z.date()]).transform((v) => {
      const d = v instanceof Date ? v : new Date(v);
      if (Number.isNaN(d.getTime())) throw new Error(`Date invalide pour ${field}`);
      return d;
    });
  } else if (spec.enum) {
    base = z.enum(spec.enum);
  } else {
    switch (spec.type) {
      case 'string': base = z.string(); break;
      case 'number': base = z.number(); break;
      case 'integer': base = z.number().int(); break;
      case 'boolean': base = z.boolean(); break;
      case 'array': base = z.array(spec.items?.type === 'string' ? z.string() : z.any()); break;
      case 'object': base = z.record(z.any()); break;
      default: base = z.any();
    }
  }
  if (spec.maxLength && spec.type === 'string' && !isDate) base = base.max(spec.maxLength);
  return base;
}

const cache = new Map();

/**
 * Schéma de validation d'une entité. `partial` pour les mises à jour.
 * Les champs non déclarés sont rejetés : le schéma est la seule porte d'entrée.
 */
export function schemaFor(entity, { partial = false } = {}) {
  const key = `${entity}:${partial}`;
  if (cache.has(key)) return cache.get(key);

  const def = definitions.get(entity);
  if (!def) return null;

  const required = new Set(def.required ?? []);
  const shape = {};
  for (const [field, spec] of Object.entries(def.properties ?? {})) {
    if (field === 'password_hash') continue; // jamais écrit via l'API
    const s = fieldSchema(field, spec);
    shape[field] = partial || !required.has(field) ? s.optional().nullable() : s;
  }

  const schema = z.object(shape).strict();
  cache.set(key, schema);
  return schema;
}

/** Champs autorisés dans les filtres de lecture. */
export function fieldsOf(entity) {
  const def = definitions.get(entity);
  if (!def) return new Set();
  return new Set([...Object.keys(def.properties ?? {}), 'id', 'created_date', 'updated_date']);
}

/** Colonnes jamais renvoyées au client. */
const HIDDEN = { User: ['password_hash', 'verification_token'], Store: ['verification_token'] };

export function stripHidden(entity, row) {
  const hidden = HIDDEN[entity];
  if (!row || !hidden) return row;
  const copy = { ...row };
  for (const field of hidden) delete copy[field];
  return copy;
}
