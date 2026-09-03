/**
 * Génère prisma/schema.prisma à partir des définitions d'entités JSON.
 *
 * Les définitions vivent dans `server/entities/*.json` : un fichier par entité,
 * au format JSON Schema restreint (type, enum, default, required). C'est la
 * source de vérité du modèle métier ; le schéma Prisma en est dérivé.
 *
 *   node scripts/generate-schema.mjs
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const entitiesDir = join(root, 'entities');
const outFile = join(root, 'prisma', 'schema.prisma');

/** Champs numériques stockés en entier (quantités, compteurs, points). */
const INT_FIELD = /(^|_)(quantity|count|points|stock|attempts|participants|servings|minutes|days|completions|impressions|clicks|conversions|priority|usage|helpful|likes|saves|shares|comments|members|reports|transactions|age)(_|$)/;
/** Champs entiers que le motif ci-dessus ne capture pas. */
const INT_NAMES = new Set(['total_orders', 'qty', 'quantity']);
/** Champs stockés en date/heure. */
const DATE_FIELD = /(_date|_at|_from|_to|_updated|_executed|_used)$|^timestamp$/;
/** Exceptions : noms qui matchent DATE_FIELD mais ne sont pas des dates. */
const NOT_DATE = new Set(['valid_to_string', 'day_of_week']);

const enumNames = new Map();

function pascal(s) {
  return s.replace(/(^|_)([a-z])/g, (_, __, c) => c.toUpperCase());
}

function enumTypeName(entity, field) {
  return `${entity}${pascal(field)}`;
}

function sanitizeEnumValue(v) {
  // Prisma n'accepte pas les valeurs commençant par un chiffre.
  return /^[A-Za-z_]/.test(v) ? v : `V_${v}`;
}

function scalarFor(entity, field, def) {
  if (def.enum && def.type === 'string') {
    const name = enumTypeName(entity, field);
    if (!enumNames.has(name)) {
      enumNames.set(name, def.enum.map(sanitizeEnumValue));
    }
    return name;
  }
  switch (def.type) {
    case 'string':
      if (DATE_FIELD.test(field) && !NOT_DATE.has(field)) return 'DateTime';
      return 'String';
    case 'number':
      return INT_FIELD.test(field) || INT_NAMES.has(field) ? 'Int' : 'Float';
    case 'integer':
      return 'Int';
    case 'boolean':
      return 'Boolean';
    case 'array':
      return def.items?.type === 'string' ? 'String[]' : 'Json[]';
    case 'object':
      return 'Json';
    default:
      return 'Json';
  }
}

function defaultFor(type, value) {
  if (value === undefined) return '';
  if (type === 'String') return ` @default("${String(value).replace(/"/g, '\\"')}")`;
  if (type === 'Boolean') return ` @default(${value ? 'true' : 'false'})`;
  if (type === 'Int' || type === 'Float') return ` @default(${value})`;
  if (type.endsWith('[]')) return ' @default([])';
  if (enumNames.has(type)) return ` @default(${sanitizeEnumValue(String(value))})`;
  return '';
}

/** Champs indexés : clés étrangères logiques et colonnes de filtrage courantes. */
const INDEXED = /(_email$|_id$|^status$|^code$|^is_read$|^category$|^expiration_date$|^pickup_date$)/;

const header = `// ⚠️  FICHIER GÉNÉRÉ — ne pas éditer à la main.
// Source de vérité : server/entities/*.json
// Régénérer avec :  npm run schema:generate

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
`;

const models = [];
const files = readdirSync(entitiesDir).filter((f) => f.endsWith('.json')).sort();

for (const file of files) {
  const def = JSON.parse(readFileSync(join(entitiesDir, file), 'utf8'));
  const name = def.name || file.replace(/\.json$/, '');
  const required = new Set(def.required || []);
  const lines = [`model ${name} {`];
  lines.push('  id            String   @id @default(cuid())');

  const indexes = [];
  for (const [field, spec] of Object.entries(def.properties || {})) {
    if (field === 'id') continue;
    const type = scalarFor(name, field, spec);
    const isRequired = required.has(field);
    const optional =
      type.endsWith('[]') || spec.default !== undefined || isRequired ? '' : '?';
    const dflt = defaultFor(type, spec.default);
    const unique = spec.unique ? ' @unique' : '';
    lines.push(`  ${field.padEnd(28)} ${type}${optional}${dflt}${unique}`);
    if (spec.unique) continue;
    if (INDEXED.test(field)) indexes.push(field);
  }

  lines.push('  created_date                 DateTime @default(now())');
  lines.push('  updated_date                 DateTime @updatedAt');
  for (const idx of indexes) lines.push(`  @@index([${idx}])`);
  lines.push('}');
  models.push(lines.join('\n'));
}

const enums = [...enumNames.entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([name, values]) => `enum ${name} {\n${values.map((v) => `  ${v}`).join('\n')}\n}`);

const infra = readFileSync(join(root, 'prisma', 'infra.prisma'), 'utf8');

writeFileSync(outFile, [header, infra.trim(), ...models, ...enums].join('\n\n') + '\n');
console.log(`schema.prisma généré — ${files.length} entités, ${enums.length} enums`);
