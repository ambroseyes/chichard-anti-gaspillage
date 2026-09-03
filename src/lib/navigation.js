/**
 * Redirection vers la page de connexion depuis du code hors composant
 * (intercepteur HTTP, gestionnaire d'erreur). Les composants préfèrent
 * `useNavigate`.
 */
export function goToLogin(from = window.location.pathname) {
  const target = `/connexion?suite=${encodeURIComponent(from)}`;
  if (window.location.pathname !== '/connexion') window.location.assign(target);
}

export function logout() {
  // Importé paresseusement pour éviter un cycle avec la couche API.
  import('@/api').then(({ api }) => api.auth.logout().finally(() => window.location.assign('/')));
}
