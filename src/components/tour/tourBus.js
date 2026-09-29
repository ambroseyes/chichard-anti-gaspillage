/**
 * Petit relais entre la page « Guide » et l'hôte des guides.
 *
 * La page d'aide demande de rejouer une visite ; l'hôte, monté ailleurs dans
 * l'arbre, l'entend et la lance. Un simple ensemble d'abonnés suffit — pas
 * besoin d'un contexte pour un signal aussi ponctuel.
 */
const abonnés = new Set();

export function demanderGuide(page) {
  abonnés.forEach((fn) => fn(page));
}

export function surDemandeGuide(fn) {
  abonnés.add(fn);
  return () => abonnés.delete(fn);
}
