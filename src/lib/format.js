/**
 * Formatage. Une locale explicite partout : sans elle, la mise en forme des
 * montants variait d'un navigateur à l'autre.
 */
import { DEFAULT_LANG, translate } from '@/i18n/translate';

const LOCALE = 'fr-CM';

/* Traducteur par défaut hors composant : rend le français, interpolation
   comprise. Un composant passe son propre `t` pour l'anglais. */
const fraduire = (texte, params) => translate(DEFAULT_LANG, texte, params);

const currencyFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'XAF',
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });

/** « 12 500 FCFA ». Le franc CFA n'a pas de sous-unité. */
export function formatXAF(amount) {
  const value = Math.round(Number(amount) || 0);
  // Intl rend « XAF 12 500 » selon les environnements : on impose le suffixe usuel.
  return `${numberFormatter.format(value)} FCFA`;
}

export const formatCurrencyStrict = (amount) => currencyFormatter.format(Math.round(Number(amount) || 0));

export const formatNumber = (value) => numberFormatter.format(Number(value) || 0);

export const formatPercent = (value, digits = 1) =>
  `${(Number(value) || 0).toFixed(digits).replace('.', ',')} %`;

export const formatKg = (value) => `${(Number(value) || 0).toFixed(1).replace('.', ',')} kg`;

/*
 * Les montants restent en franc CFA et en découpage fr-CM — c'est la monnaie
 * du pays, pas un choix de langue. Les dates, elles, suivent la langue : en
 * anglais, « 1 October 2026 » plutôt que « 1 octobre 2026 ». La locale de date
 * est posée par le sélecteur de langue via `setDateLocale`.
 */
const DATE_LOCALE = { fr: 'fr-CM', en: 'en-GB' };
let dateLocale = LOCALE;

const cacheFormats = new Map();
const dateFormat = (options) => {
  const clé = `${dateLocale}|${JSON.stringify(options)}`;
  let format = cacheFormats.get(clé);
  if (!format) {
    format = new Intl.DateTimeFormat(dateLocale, options);
    cacheFormats.set(clé, format);
  }
  return format;
};

/** Appelé par le fournisseur de langue : aligne le format des dates. */
export function setDateLocale(lang) {
  dateLocale = DATE_LOCALE[lang] ?? LOCALE;
}

const toDate = (value) => (value instanceof Date ? value : new Date(value));

export const formatDate = (value) =>
  value ? dateFormat({ dateStyle: 'long' }).format(toDate(value)) : '—';
export const formatShortDate = (value) =>
  value ? dateFormat({ day: '2-digit', month: '2-digit' }).format(toDate(value)) : '—';
export const formatDateTime = (value) =>
  value ? dateFormat({ dateStyle: 'medium', timeStyle: 'short' }).format(toDate(value)) : '—';

/**
 * Nombre de jours calendaires avant une date ; négatif si elle est passée.
 *
 * On compare des dates, pas des instants : un produit qui périme ce soir est
 * « dernier jour », pas « demain ».
 */
export function daysUntil(value, now = new Date()) {
  if (!value) return null;
  const target = toDate(value);
  if (Number.isNaN(target.getTime())) return null;

  const midnight = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((midnight(target) - midnight(now)) / 86_400_000);
}

/**
 * « il reste 2 jours », « dernier jour », « périmé ».
 *
 * `t` est le traducteur (voir `useT`) ; sans lui, la fonction reste utilisable
 * hors composant et renvoie le français. Le nombre de jours est interpolé
 * après traduction pour que l'anglais dise « In 2 days » et non « Dans 2 days ».
 */
export function expiryLabel(value, now = new Date(), t = fraduire) {
  const days = daysUntil(value, now);
  if (days === null) return t('Date inconnue');
  if (days < 0) return t('Périmé');
  if (days === 0) return t('Dernier jour');
  if (days === 1) return t('Demain');
  return t('Dans {n} jours', { n: days });
}

/**
 * Prix ramené à l'unité de référence : « 1 120 FCFA / kg ».
 *
 * C'est la seule façon de comparer deux articles de conditionnements
 * différents — et c'est obligatoire à l'affichage dans la plupart des pays.
 * Renvoie `null` quand le poids manque ou ne veut rien dire.
 */
const REFERENCE_UNITS = {
  g: { factor: 1000, unit: 'kg' },
  kg: { factor: 1, unit: 'kg' },
  mL: { factor: 1000, unit: 'L' },
  L: { factor: 1, unit: 'L' },
};

export function unitPrice(product) {
  const reference = REFERENCE_UNITS[product?.weight_unit];
  const weight = Number(product?.weight);
  const price = Number(product?.discounted_price);

  if (!reference || !Number.isFinite(weight) || weight <= 0) return null;
  if (!Number.isFinite(price) || price <= 0) return null;

  const amount = (price * reference.factor) / weight;
  // Un prix au kilo qui dépasse le prix de l'article signale un poids saisi
  // dans la mauvaise unité : mieux vaut ne rien afficher qu'un chiffre faux.
  if (!Number.isFinite(amount) || amount > price * 10_000) return null;

  return { amount, unit: reference.unit, label: `${formatXAF(amount)} / ${reference.unit}` };
}

/**
 * Un numéro joignable par un opérateur de paiement mobile camerounais ?
 *
 * Règle identique à celle du serveur (`server/src/payments/msisdn.js`) : les
 * opérateurs attendent 237 suivi de neuf chiffres commençant par 6. La
 * vérifier ici évite de laisser le client aller jusqu'au paiement pour
 * apprendre que son numéro ne convient pas.
 */
export function isMobileMoneyNumber(saisie) {
  const brut = String(saisie ?? '').replace(/\D/g, '');
  const sansSortie = brut.startsWith('00') ? brut.slice(2) : brut;
  const national = sansSortie.startsWith('237') ? sansSortie.slice(3) : sansSortie;
  return national.length === 9 && national.startsWith('6');
}
