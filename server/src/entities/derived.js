/**
 * Champs dérivés, recalculés par le serveur à chaque écriture.
 *
 * `discount_percent` pourrait se calculer à la lecture ; il est stocké parce
 * qu'on veut trier dessus. Une base ne sait pas ordonner sur le rapport de
 * deux colonnes via Prisma, et un classement « meilleure remise » calculé
 * dans le navigateur ne classerait que la page déjà reçue — c'est-à-dire pas
 * le catalogue.
 */

const DERIVERS = {
  Product: {
    fields: ['discount_percent'],
    compute(row) {
      const original = row.original_price;
      const discounted = row.discounted_price;
      if (typeof original !== 'number' || typeof discounted !== 'number') return {};
      if (original <= 0) return { discount_percent: 0 };
      const percent = Math.round((1 - discounted / original) * 100);
      return { discount_percent: Math.min(100, Math.max(0, percent)) };
    },
  },
};

/**
 * Renvoie les champs à poser en plus de la charge utile.
 *
 * `previous` porte la ligne existante lors d'une mise à jour partielle : une
 * requête qui ne change que `discounted_price` doit quand même retrouver
 * `original_price` pour recalculer la remise.
 */
export function derivedFields(entity, payload, previous = null) {
  const deriver = DERIVERS[entity];
  if (!deriver) return {};
  return deriver.compute(previous ? { ...previous, ...payload } : payload);
}

/**
 * Retire d'une charge utile les champs que le serveur calcule lui-même.
 * Un client qui annonce « remise 90 % » sur un produit plein tarif est ignoré.
 */
export function stripDerived(entity, payload) {
  const deriver = DERIVERS[entity];
  if (!deriver) return payload;
  for (const field of deriver.fields) delete payload[field];
  return payload;
}
