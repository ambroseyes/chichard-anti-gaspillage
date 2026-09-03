import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { handler } from '../lib/async-handler.js';
import { badRequest, forbidden, notFound } from '../lib/errors.js';
import { policyFor } from '../access/policies.js';
import {
  DENY,
  assertWrite,
  ownershipDefaults,
  readScope,
  sanitizeWrite,
} from '../access/enforce.js';
import { definitions, fieldsOf, schemaFor, stripHidden } from './schema.js';
import {
  decodeFilterParam,
  listQuerySchema,
  parseFilter,
  parseSort,
} from './query.js';
import { recordAudit } from '../lib/audit.js';
import { publish } from '../realtime/bus.js';

export const entitiesRouter = Router();

/** `Product` → `prisma.product` */
const delegateFor = (entity) => {
  const key = entity.charAt(0).toLowerCase() + entity.slice(1);
  return prisma[key];
};

function resolveEntity(req, _res, next) {
  const { entity } = req.params;
  if (!definitions.has(entity) || !policyFor(entity)) {
    return next(notFound(`Entité inconnue : ${entity}`));
  }
  const delegate = delegateFor(entity);
  if (!delegate) return next(notFound(`Entité non exposée : ${entity}`));
  req.entity = entity;
  req.delegate = delegate;
  return next();
}

entitiesRouter.param('entity', (req, res, next) => resolveEntity(req, res, next));

/** Combine le filtre demandé et le périmètre autorisé. */
function combine(scope, where) {
  if (scope === null) return where;
  if (!Object.keys(where).length) return scope;
  return { AND: [scope, where] };
}

// --- Liste -----------------------------------------------------------------
entitiesRouter.get(
  '/:entity',
  handler(async (req, res) => {
    const { entity, delegate } = req;
    const scope = await readScope(entity, req.user, req);
    if (scope === DENY) throw forbidden();

    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) throw badRequest('Paramètres de liste invalides', parsed.error.issues);
    const { sort, limit, offset } = parsed.data;

    const where = combine(scope, parseFilter(decodeFilterParam(parsed.data.filter), fieldsOf(entity)));

    const [rows, total] = await Promise.all([
      delegate.findMany({ where, orderBy: parseSort(sort), take: limit, skip: offset }),
      delegate.count({ where }),
    ]);

    res.json({
      data: rows.map((row) => stripHidden(entity, row)),
      meta: { total, limit, offset },
    });
  }),
);

// --- Lecture unitaire ------------------------------------------------------
entitiesRouter.get(
  '/:entity/:id',
  handler(async (req, res) => {
    const { entity, delegate } = req;
    const scope = await readScope(entity, req.user, req);
    if (scope === DENY) throw forbidden();

    const row = await delegate.findFirst({
      where: combine(scope, { id: req.params.id }),
    });
    if (!row) throw notFound();
    res.json({ data: stripHidden(entity, row) });
  }),
);

// --- Création --------------------------------------------------------------
entitiesRouter.post(
  '/:entity',
  handler(async (req, res) => {
    const { entity, delegate } = req;

    const defaults = ownershipDefaults(entity, req.user);
    const { data: cleaned, rejected } = sanitizeWrite(entity, req.body, { user: req.user });
    const payload = { ...cleaned, ...defaults };

    await assertWrite(entity, 'create', { user: req.user, row: payload, req });

    const schema = schemaFor(entity);
    const parsed = schema.safeParse(payload);
    if (!parsed.success) throw badRequest('Données invalides', parsed.error.issues);

    const row = await delegate.create({ data: parsed.data });

    await recordAudit(req, { action: 'create', module: entity, entity_id: row.id });
    publish(entity, { type: 'create', id: row.id, data: stripHidden(entity, row) });

    res.status(201).json({ data: stripHidden(entity, row), meta: { rejected_fields: rejected } });
  }),
);

// --- Mise à jour -----------------------------------------------------------
entitiesRouter.patch(
  '/:entity/:id',
  handler(async (req, res) => {
    const { entity, delegate } = req;

    const existing = await delegate.findUnique({ where: { id: req.params.id } });
    if (!existing) throw notFound();

    await assertWrite(entity, 'update', { user: req.user, row: existing, req });

    const { data: cleaned, rejected } = sanitizeWrite(entity, req.body, { user: req.user });
    // Le propriétaire d'une ligne ne peut pas la transférer à quelqu'un d'autre.
    const policy = policyFor(entity);
    if (policy?.owner) delete cleaned[policy.owner];

    const schema = schemaFor(entity, { partial: true });
    const parsed = schema.safeParse(cleaned);
    if (!parsed.success) throw badRequest('Données invalides', parsed.error.issues);

    const row = await delegate.update({ where: { id: req.params.id }, data: parsed.data });

    await recordAudit(req, { action: 'update', module: entity, entity_id: row.id });
    publish(entity, { type: 'update', id: row.id, data: stripHidden(entity, row) });

    res.json({ data: stripHidden(entity, row), meta: { rejected_fields: rejected } });
  }),
);

// --- Suppression -----------------------------------------------------------
entitiesRouter.delete(
  '/:entity/:id',
  handler(async (req, res) => {
    const { entity, delegate } = req;

    const existing = await delegate.findUnique({ where: { id: req.params.id } });
    if (!existing) throw notFound();

    await assertWrite(entity, 'delete', { user: req.user, row: existing, req });
    await delegate.delete({ where: { id: req.params.id } });

    await recordAudit(req, { action: 'delete', module: entity, entity_id: req.params.id });
    publish(entity, { type: 'delete', id: req.params.id });

    res.status(204).end();
  }),
);
