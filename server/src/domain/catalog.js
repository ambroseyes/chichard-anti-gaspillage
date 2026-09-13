import { definitions } from '../entities/schema.js';
import { badRequest } from '../lib/errors.js';

/**
 * Recherche catalogue.
 *
 * Le navigateur n'a plus à télécharger le catalogue pour le filtrer lui-même :
 * il envoie des critères, le serveur renvoie une page de résultats et le
 * décompte de chaque facette. C'est la condition pour que le catalogue
 * dépasse la centaine de produits sans que des articles disparaissent
 * silencieusement des résultats.
 *
 * Ce module ne parle pas à la base : il traduit des paramètres d'URL en
 * critères, et des critères en clause `where`. Il est donc testable seul.
 */

export const CATEGORY_LABELS = {
  fruits_legumes: 'Fruits & légumes',
  produits_laitiers: 'Produits laitiers',
  viandes_poissons: 'Viandes & poissons',
  boulangerie: 'Boulangerie',
  epicerie: 'Épicerie',
  boissons: 'Boissons',
  surgeles: 'Surgelés',
  hygiene: 'Hygiène',
  conserves: 'Conserves',
  condiments: 'Condiments',
};

export const CATEGORIES = definitions.get('Product')?.properties?.category?.enum ?? [];

export const SORT_OPTIONS = [
  { id: 'relevance', label: 'Pertinence' },
  { id: 'price_asc', label: 'Prix croissant' },
  { id: 'price_desc', label: 'Prix décroissant' },
  { id: 'discount', label: 'Meilleure remise' },
  { id: 'expiration', label: 'Expire bientôt' },
  { id: 'rating', label: 'Les mieux notés' },
  { id: 'newest', label: 'Nouveautés' },
];

const SORT_IDS = new Set(SORT_OPTIONS.map((s) => s.id));
export const DEFAULT_SORT = 'relevance';

/**
 * Fenêtres d'expiration proposées en facette. `days` compte les jours de
 * calendrier depuis aujourd'hui inclus : `days: 1` ne garde que ce qui périme
 * aujourd'hui.
 */
export const EXPIRATION_BUCKETS = [
  { id: 'today', label: "Expire aujourd'hui", days: 1 },
  { id: '3days', label: 'Sous 3 jours', days: 3 },
  { id: 'week', label: 'Sous 7 jours', days: 7 },
];

const BUCKET_BY_ID = new Map(EXPIRATION_BUCKETS.map((b) => [b.id, b]));

export const PER_PAGE_DEFAULT = 24;
export const PER_PAGE_MAX = 60;
const MAX_TOKENS = 6;
const MAX_LIST_VALUES = 20;

/** Nombre de résultats reclassés en mémoire quand un tri par pertinence est demandé. */
export const RANKING_CANDIDATES = 1000;

// --- Analyse des paramètres ------------------------------------------------

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const endOfDayPlus = (date, days) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days, 23, 59, 59, 999);

/**
 * Découpe la requête en mots. Les accents sont conservés ici : c'est cette
 * chaîne qui part en base, et un `LIKE` insensible à la casse ne l'est pas
 * aux accents.
 */
export function tokenize(query) {
  if (typeof query !== 'string') return [];
  return query
    .toLowerCase()
    .split(/[\s,;]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2)
    .slice(0, MAX_TOKENS);
}

/** Retire les accents — pour comparer en mémoire, jamais pour interroger la base. */
export function fold(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function asList(raw) {
  if (raw === undefined || raw === null || raw === '') return [];
  const values = Array.isArray(raw) ? raw : String(raw).split(',');
  return [...new Set(values.map((v) => String(v).trim()).filter(Boolean))].slice(0, MAX_LIST_VALUES);
}

function asNumber(raw) {
  if (raw === undefined || raw === null || raw === '') return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function asInteger(raw, fallback) {
  const value = asNumber(raw);
  return value === null ? fallback : Math.trunc(value);
}

/**
 * Traduit les paramètres d'URL en critères normalisés.
 *
 * Une catégorie inconnue déclenche une 400 plutôt qu'un filtre ignoré : un
 * lien tapé de travers doit le dire, pas renvoyer tout le catalogue comme si
 * de rien n'était.
 */
export function parseCriteria(query = {}) {
  const categories = asList(query.category);
  const unknown = categories.filter((c) => !CATEGORIES.includes(c));
  if (unknown.length) throw badRequest(`Catégorie inconnue : ${unknown.join(', ')}`);

  const expires = query.expires ? String(query.expires) : null;
  if (expires && !BUCKET_BY_ID.has(expires)) {
    throw badRequest(`Fenêtre d'expiration inconnue : ${expires}`);
  }

  const sort = query.sort ? String(query.sort) : DEFAULT_SORT;
  if (!SORT_IDS.has(sort)) throw badRequest(`Tri inconnu : ${sort}`);

  const priceMin = asNumber(query.price_min);
  const priceMax = asNumber(query.price_max);

  const perPage = Math.min(PER_PAGE_MAX, Math.max(1, asInteger(query.per_page, PER_PAGE_DEFAULT)));
  const page = Math.max(1, asInteger(query.page, 1));

  const q = typeof query.q === 'string' ? query.q.trim().slice(0, 120) : '';

  return {
    q,
    tokens: tokenize(q),
    categories,
    brands: asList(query.brand),
    stores: asList(query.store),
    price_min: priceMin !== null && priceMin >= 0 ? priceMin : null,
    price_max: priceMax !== null && priceMax >= 0 ? priceMax : null,
    expires,
    min_rating: asNumber(query.min_rating),
    verified_only: query.verified === '1' || query.verified === 'true',
    sort,
    page,
    per_page: perPage,
  };
}

// --- Construction de la requête -------------------------------------------

/**
 * Clause `where` correspondant aux critères.
 *
 * `skipFacet` sert au calcul des facettes : le décompte des marques s'obtient
 * en appliquant tous les filtres *sauf* celui des marques, sinon cocher une
 * marque ferait tomber toutes les autres à zéro et l'utilisateur ne pourrait
 * plus en ajouter une seconde.
 */
export function buildWhere(criteria, { now = new Date(), skipFacet = null } = {}) {
  const and = [
    // Périmètre public : en vente, en stock, pas encore périmé.
    { status: 'active' },
    { quantity_available: { gt: 0 } },
    { expiration_date: { gte: startOfDay(now) } },
  ];

  for (const token of criteria.tokens) {
    and.push({
      OR: [
        { name: { contains: token, mode: 'insensitive' } },
        { brand: { contains: token, mode: 'insensitive' } },
        { store_name: { contains: token, mode: 'insensitive' } },
        { description: { contains: token, mode: 'insensitive' } },
        { tags: { has: token } },
      ],
    });
  }

  if (skipFacet !== 'categories' && criteria.categories.length) {
    and.push({ category: { in: criteria.categories } });
  }
  if (skipFacet !== 'brands' && criteria.brands.length) {
    and.push({ brand: { in: criteria.brands } });
  }
  if (skipFacet !== 'stores' && criteria.stores.length) {
    // Facette posée sur le nom du magasin : `store_id` est optionnel sur un
    // produit, filtrer dessus ferait disparaître de la facette des boutiques
    // qui ont pourtant des articles en vente.
    and.push({ store_name: { in: criteria.stores } });
  }

  if (skipFacet !== 'price') {
    const price = {};
    if (criteria.price_min !== null) price.gte = criteria.price_min;
    if (criteria.price_max !== null) price.lte = criteria.price_max;
    if (Object.keys(price).length) and.push({ discounted_price: price });
  }

  if (skipFacet !== 'expiration' && criteria.expires) {
    const bucket = BUCKET_BY_ID.get(criteria.expires);
    and.push({ expiration_date: { lte: endOfDayPlus(now, bucket.days - 1) } });
  }

  if (criteria.min_rating !== null && criteria.min_rating > 0) {
    and.push({ avg_rating: { gte: criteria.min_rating } });
  }
  if (criteria.verified_only) and.push({ is_verified: true });

  return { AND: and };
}

/** Borne haute d'un compartiment d'expiration, pour en compter le contenu. */
export function expirationBoundary(bucket, now = new Date()) {
  return endOfDayPlus(now, bucket.days - 1);
}

/**
 * Ordre de tri.
 *
 * `id` ferme systématiquement la liste : sans ordre total, deux produits de
 * même prix peuvent changer de place entre la page 1 et la page 2, et un
 * article se retrouve compté deux fois ou jamais.
 */
export function orderByFor(sort) {
  switch (sort) {
    case 'price_asc':
      return [{ discounted_price: 'asc' }, { id: 'asc' }];
    case 'price_desc':
      return [{ discounted_price: 'desc' }, { id: 'asc' }];
    case 'discount':
      return [{ discount_percent: 'desc' }, { id: 'asc' }];
    case 'expiration':
      return [{ expiration_date: 'asc' }, { id: 'asc' }];
    case 'rating':
      return [{ avg_rating: 'desc' }, { reviews_count: 'desc' }, { id: 'asc' }];
    case 'newest':
      return [{ created_date: 'desc' }, { id: 'asc' }];
    default:
      // Sans mot-clé, « pertinence » vaut la promesse du site : la plus forte
      // remise d'abord, puis ce qui périme le plus tôt.
      return [{ discount_percent: 'desc' }, { expiration_date: 'asc' }, { id: 'asc' }];
  }
}

// --- Classement par pertinence --------------------------------------------

const WEIGHTS = {
  name_exact: 120,
  name_prefix: 60,
  name: 35,
  brand: 20,
  tag: 15,
  store: 8,
  description: 4,
};

/**
 * Note un produit face aux mots cherchés. Un mot trouvé dans le nom pèse plus
 * que le même mot trouvé dans la description ou le nom du magasin — sans quoi
 * chercher « Mahima » remonterait tout le rayon du magasin Mahima avant le
 * produit qui porte ce nom.
 */
export function scoreProduct(product, tokens) {
  if (!tokens.length) return 0;

  const name = fold(product.name);
  const brand = fold(product.brand);
  const store = fold(product.store_name);
  const description = fold(product.description);
  const tags = (product.tags ?? []).map(fold);

  let score = 0;
  for (const raw of tokens) {
    const token = fold(raw);
    if (name === token) score += WEIGHTS.name_exact;
    else if (name.startsWith(token)) score += WEIGHTS.name_prefix;
    else if (name.includes(token)) score += WEIGHTS.name;

    if (brand.includes(token)) score += WEIGHTS.brand;
    if (tags.some((tag) => tag.includes(token))) score += WEIGHTS.tag;
    if (store.includes(token)) score += WEIGHTS.store;
    if (description.includes(token)) score += WEIGHTS.description;
  }

  // À pertinence égale, la meilleure remise passe devant.
  return score * 1000 + Math.min(999, product.discount_percent ?? 0);
}

/** Trie des candidats par pertinence décroissante, `id` en départage. */
export function rankByRelevance(candidates, tokens) {
  return [...candidates].sort((a, b) => {
    const diff = scoreProduct(b, tokens) - scoreProduct(a, tokens);
    return diff !== 0 ? diff : String(a.id).localeCompare(String(b.id));
  });
}
