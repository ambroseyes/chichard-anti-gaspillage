import { backofficeRoutes, routes } from '@/routes';

/**
 * Résout un nom de page en chemin.
 *
 * Le chemin est lu dans la table des routes plutôt que déduit du nom : c'est
 * elle qui fait autorité, et un lien ne peut plus pointer vers une adresse qui
 * n'existe pas. `createPageUrl('Home')` rend « / », pas « /home ».
 */
const PATH_BY_NAME = new Map(
  [...routes, ...backofficeRoutes].map((route) => [route.name, route.path]),
);

export function createPageUrl(pageName) {
  // `ProductDetail?id=42` : le nom s'arrête au premier « ? » ou « # ». Sans
  // cette coupure, la carte produit demandait une page nommée
  // « ProductDetail?id=42 », introuvable, et renvoyait à l'accueil.
  const cut = String(pageName ?? '').search(/[?#]/);
  const name = cut === -1 ? String(pageName ?? '') : String(pageName).slice(0, cut);
  const suffix = cut === -1 ? '' : String(pageName).slice(cut);

  const path = PATH_BY_NAME.get(name);
  if (path) return `${path}${suffix}`;

  // Un nom inconnu signale une faute de frappe ou une page supprimée : on le
  // dit en développement plutôt que de fabriquer une adresse plausible.
  if (import.meta.env.DEV) {
    console.warn(`createPageUrl : page inconnue « ${name} »`);
  }
  return '/';
}

/** Noms de pages connus — utile aux tests et aux menus. */
export const pageNames = [...PATH_BY_NAME.keys()];
