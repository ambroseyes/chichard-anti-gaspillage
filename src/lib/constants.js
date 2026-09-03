/**
 * Constantes métier de l'interface.
 *
 * Source unique : ces valeurs étaient redéclarées dans seize fichiers.
 * Celles qui ont un pendant serveur (frais de livraison, paliers de fidélité)
 * sont servies par `/api/config` et lues via `useAppConfig`.
 */

export const PRODUCT_CATEGORIES = [
  { id: 'fruits_legumes', label: 'Fruits & légumes', emoji: '🥬' },
  { id: 'produits_laitiers', label: 'Produits laitiers', emoji: '🥛' },
  { id: 'viandes_poissons', label: 'Viandes & poissons', emoji: '🍖' },
  { id: 'boulangerie', label: 'Boulangerie', emoji: '🥖' },
  { id: 'epicerie', label: 'Épicerie', emoji: '🛒' },
  { id: 'boissons', label: 'Boissons', emoji: '🥤' },
  { id: 'surgeles', label: 'Surgelés', emoji: '🧊' },
  { id: 'hygiene', label: 'Hygiène', emoji: '🧼' },
  { id: 'conserves', label: 'Conserves', emoji: '🥫' },
  { id: 'condiments', label: 'Condiments', emoji: '🧂' },
];

export const CATEGORY_LABEL = Object.fromEntries(
  PRODUCT_CATEGORIES.map((c) => [c.id, c.label]),
);

export const CATEGORY_EMOJI = Object.fromEntries(
  PRODUCT_CATEGORIES.map((c) => [c.id, c.emoji]),
);

/** Paliers d'urgence, alignés sur ceux appliqués par le serveur. */
export const URGENCY_LEVELS = {
  normal: { label: 'Normal', color: 'bg-gray-100 text-gray-700', maxDaysLeft: 7 },
  soon: { label: 'Bientôt', color: 'bg-amber-100 text-amber-700', maxDaysLeft: 5 },
  urgent: { label: 'Urgent', color: 'bg-orange-100 text-orange-700', maxDaysLeft: 3 },
  critical: { label: 'Dernier jour', color: 'bg-red-100 text-red-700', maxDaysLeft: 1 },
};

export const ORDER_STATUS = {
  pending: { label: 'En attente', color: 'bg-gray-100 text-gray-700' },
  confirmed: { label: 'Confirmée', color: 'bg-blue-100 text-blue-700' },
  ready: { label: 'Prête', color: 'bg-amber-100 text-amber-700' },
  delivered: { label: 'Remise', color: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Annulée', color: 'bg-red-100 text-red-700' },
};

export const PAYMENT_STATUS = {
  pending: { label: 'En attente de paiement', color: 'bg-amber-100 text-amber-700' },
  authorized: { label: 'Autorisé', color: 'bg-blue-100 text-blue-700' },
  paid: { label: 'Payé', color: 'bg-emerald-100 text-emerald-700' },
  failed: { label: 'Échoué', color: 'bg-red-100 text-red-700' },
  refunded: { label: 'Remboursé', color: 'bg-gray-100 text-gray-700' },
};

export const PAYMENT_METHODS = [
  { id: 'orange_money', label: 'Orange Money', badge: 'OM', tone: 'bg-orange-500' },
  { id: 'mtn_money', label: 'MTN Mobile Money', badge: 'MTN', tone: 'bg-yellow-500' },
  { id: 'card', label: 'Carte bancaire', badge: 'CB', tone: 'bg-blue-500' },
  { id: 'cash', label: 'Paiement à la remise', badge: 'ESP', tone: 'bg-gray-500' },
];

export const STORE_STATUS = {
  pending: { label: 'En attente', color: 'bg-amber-100 text-amber-700' },
  verified: { label: 'Vérifié', color: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Refusé', color: 'bg-red-100 text-red-700' },
  suspended: { label: 'Suspendu', color: 'bg-gray-200 text-gray-700' },
};

export const BACKOFFICE_ROLES = {
  none: { label: 'Aucun', color: 'bg-gray-100 text-gray-700' },
  operator: { label: 'Opérateur', color: 'bg-blue-100 text-blue-700' },
  admin: { label: 'Administrateur', color: 'bg-orange-100 text-orange-700' },
  super_admin: { label: 'Super administrateur', color: 'bg-red-100 text-red-700' },
};
