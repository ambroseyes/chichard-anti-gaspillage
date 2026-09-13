/**
 * Références stables pour les valeurs par défaut.
 *
 * `const { data: items = [] } = useQuery(...)` crée un tableau neuf à chaque
 * rendu tant que la requête n'a pas répondu. Utilisée comme dépendance d'un
 * `useEffect`, cette valeur change donc à chaque rendu : l'effet se relance
 * sans fin s'il écrit dans l'état — c'est la boucle observée sur la page
 * d'accueil. Partager une même instance vide supprime la cause.
 */
export const EMPTY_ARRAY = Object.freeze([]);
export const EMPTY_OBJECT = Object.freeze({});
