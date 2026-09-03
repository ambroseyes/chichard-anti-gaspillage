import { apiUrl, getAccessToken } from './http';

/**
 * Abonnement aux changements d'une entité (flux SSE).
 * Renvoie une fonction de désabonnement, comme attendu dans un `useEffect`.
 */
export function subscribeToEntity(entityName, onEvent) {
  const token = getAccessToken();
  if (!token) return () => {};

  // EventSource ne permet pas d'en-tête : le jeton passe en paramètre, sur une
  // connexion TLS, et n'est jamais journalisé côté serveur.
  const url = `${apiUrl}/api/realtime/events?entities=${encodeURIComponent(entityName)}&access_token=${encodeURIComponent(token)}`;
  const source = new EventSource(url, { withCredentials: true });

  const handler = (event) => {
    try {
      onEvent(JSON.parse(event.data));
    } catch {
      // Message mal formé : on l'ignore plutôt que de casser la page.
    }
  };

  source.addEventListener(entityName, handler);
  return () => {
    source.removeEventListener(entityName, handler);
    source.close();
  };
}
