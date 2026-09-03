/**
 * Règles de tarification — fonctions pures, testées unitairement.
 * Les montants sont en francs CFA : pas de sous-unité, on arrondit à l'entier.
 */

export const xaf = (n) => Math.round(Number(n) || 0);

/** Paliers de remise selon le nombre de jours restant avant la date limite. */
export const DISCOUNT_LADDER = Object.freeze([
  { maxDaysLeft: 0, rate: 0.7, urgency: 'critical' },
  { maxDaysLeft: 1, rate: 0.7, urgency: 'critical' },
  { maxDaysLeft: 3, rate: 0.5, urgency: 'urgent' },
  { maxDaysLeft: 5, rate: 0.35, urgency: 'soon' },
  { maxDaysLeft: 7, rate: 0.2, urgency: 'normal' },
]);

export function daysUntil(date, now = new Date()) {
  if (!date) return null;
  const target = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(target.getTime())) return null;
  return Math.ceil((target.getTime() - now.getTime()) / 86_400_000);
}

/** Niveau d'urgence et remise conseillée pour un produit. */
export function urgencyFor(expirationDate, now = new Date()) {
  const daysLeft = daysUntil(expirationDate, now);
  if (daysLeft === null) return { urgency: 'normal', suggestedRate: 0, daysLeft: null };
  if (daysLeft < 0) return { urgency: 'expired', suggestedRate: 0, daysLeft };
  const tier = DISCOUNT_LADDER.find((t) => daysLeft <= t.maxDaysLeft);
  return {
    urgency: tier?.urgency ?? 'normal',
    suggestedRate: tier?.rate ?? 0,
    daysLeft,
  };
}

export function suggestedPrice(originalPrice, expirationDate, now = new Date()) {
  const { suggestedRate } = urgencyFor(expirationDate, now);
  return xaf(originalPrice * (1 - suggestedRate));
}

/**
 * Réduction apportée par un coupon. Ne dépasse jamais le sous-total.
 * Renvoie `{ amount, error }` — `error` est un message destiné au client.
 */
export function couponDiscount(coupon, subtotal, now = new Date()) {
  if (!coupon) return { amount: 0, error: null };
  if (coupon.status !== 'ACTIVE') return { amount: 0, error: 'Ce coupon a déjà été utilisé' };
  if (coupon.valid_from && new Date(coupon.valid_from) > now) {
    return { amount: 0, error: "Ce coupon n'est pas encore valable" };
  }
  if (coupon.valid_to && new Date(coupon.valid_to) < now) {
    return { amount: 0, error: 'Ce coupon a expiré' };
  }
  if (coupon.min_cart_amount && subtotal < coupon.min_cart_amount) {
    return {
      amount: 0,
      error: `Minimum de commande : ${xaf(coupon.min_cart_amount).toLocaleString('fr-FR')} FCFA`,
    };
  }
  const raw = coupon.type === 'PERCENT' ? (subtotal * coupon.value) / 100 : coupon.value;
  return { amount: Math.min(xaf(raw), xaf(subtotal)), error: null };
}

/**
 * Total d'une commande. `lines` porte les prix relus en base, jamais ceux
 * envoyés par le client.
 */
export function computeOrderTotals({
  lines,
  deliveryType = 'pickup',
  coupon = null,
  deliveryFee = 1000,
  freeDeliveryThreshold = Infinity,
  now = new Date(),
}) {
  const subtotal = xaf(lines.reduce((sum, l) => sum + l.unit_price * l.quantity, 0));
  const savings = xaf(
    lines.reduce((sum, l) => sum + Math.max(0, (l.original_price ?? l.unit_price) - l.unit_price) * l.quantity, 0),
  );

  const { amount: discount, error: couponError } = couponDiscount(coupon, subtotal, now);

  const fee =
    deliveryType === 'delivery' && subtotal - discount < freeDeliveryThreshold ? xaf(deliveryFee) : 0;

  return {
    subtotal,
    savings,
    discount,
    couponError,
    deliveryFee: fee,
    total: Math.max(0, subtotal - discount + fee),
  };
}

/** Estimation du CO2 évité, à partir du poids réellement porté par les produits. */
export function co2SavedKg(lines, factor = 2.5) {
  const kg = lines.reduce((sum, l) => sum + (l.weight_kg ?? 0) * l.quantity, 0);
  return Math.round(kg * factor * 100) / 100;
}
