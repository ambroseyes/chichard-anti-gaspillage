/**
 * Formatage. Une locale explicite partout : sans elle, la mise en forme des
 * montants variait d'un navigateur à l'autre.
 */
const LOCALE = 'fr-CM';

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

const dateFormatter = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'long' });
const shortDateFormatter = new Intl.DateTimeFormat(LOCALE, { day: '2-digit', month: '2-digit' });
const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium', timeStyle: 'short' });

const toDate = (value) => (value instanceof Date ? value : new Date(value));

export const formatDate = (value) => (value ? dateFormatter.format(toDate(value)) : '—');
export const formatShortDate = (value) => (value ? shortDateFormatter.format(toDate(value)) : '—');
export const formatDateTime = (value) => (value ? dateTimeFormatter.format(toDate(value)) : '—');

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

/** « il reste 2 jours », « dernier jour », « périmé ». */
export function expiryLabel(value, now = new Date()) {
  const days = daysUntil(value, now);
  if (days === null) return 'Date inconnue';
  if (days < 0) return 'Périmé';
  if (days === 0) return 'Dernier jour';
  if (days === 1) return 'Demain';
  return `Dans ${days} jours`;
}
