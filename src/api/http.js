/**
 * Client HTTP de l'application.
 *
 * Porte trois responsabilités que chaque appel n'a plus à connaître :
 * l'URL de base, le jeton d'accès (avec rafraîchissement automatique), et la
 * traduction des erreurs serveur en `ApiError` exploitables par l'interface.
 */

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';
const TOKEN_KEY = 'chichard.access_token';

export class ApiError extends Error {
  constructor(status, message, { code, details } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code ?? null;
    this.details = details ?? null;
  }

  get isAuthError() {
    return this.status === 401;
  }
}

let accessToken = null;
try {
  accessToken = localStorage.getItem(TOKEN_KEY);
} catch {
  // Navigation privée ou stockage bloqué : la session ne survivra pas au rechargement.
}

const listeners = new Set();

export function setAccessToken(token) {
  accessToken = token ?? null;
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Sans stockage, le jeton reste en mémoire pour la durée de l'onglet.
  }
  listeners.forEach((fn) => fn(accessToken));
}

export const getAccessToken = () => accessToken;

export const onTokenChange = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

/** Un seul rafraîchissement à la fois, partagé par tous les appels en attente. */
let refreshing = null;

async function refreshSession() {
  refreshing ??= fetch(`${API_URL}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
    .then(async (response) => {
      if (!response.ok) throw new ApiError(401, 'Session expirée');
      const body = await response.json();
      setAccessToken(body.access_token);
      return body.access_token;
    })
    .finally(() => {
      refreshing = null;
    });

  return refreshing;
}

async function parseError(response) {
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // Réponse non JSON (proxy, passerelle) : on garde le message générique.
  }
  const message =
    payload?.error?.message ??
    (response.status >= 500
      ? "Le serveur est momentanément indisponible."
      : "La requête n'a pas abouti.");
  return new ApiError(response.status, message, {
    code: payload?.error?.code,
    details: payload?.error?.details,
  });
}

export async function request(path, { method = 'GET', body, headers, retryOn401 = true, ...rest } = {}) {
  const isFormLike = body instanceof FormData || body instanceof Blob || body instanceof File;

  const response = await fetch(`${API_URL}${path}`, {
    method,
    credentials: 'include',
    headers: {
      ...(body && !isFormLike ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : isFormLike ? body : JSON.stringify(body),
    ...rest,
  });

  if (response.status === 401 && retryOn401) {
    try {
      await refreshSession();
      return request(path, { method, body, headers, retryOn401: false, ...rest });
    } catch {
      setAccessToken(null);
      throw new ApiError(401, "Votre session a expiré, reconnectez-vous.");
    }
  }

  if (!response.ok) throw await parseError(response);
  if (response.status === 204) return null;

  return response.json();
}

export const apiUrl = API_URL;
