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
  const path = PATH_BY_NAME.get(pageName);
  if (path) return path;

  // Un nom inconnu signale une faute de frappe ou une page supprimée : on le
  // dit en développement plutôt que de fabriquer une adresse plausible.
  if (import.meta.env.DEV) {
    console.warn(`createPageUrl : page inconnue « ${pageName} »`);
  }
  return '/';
}

/** Noms de pages connus — utile aux tests et aux menus. */
export const pageNames = [...PATH_BY_NAME.keys()];
