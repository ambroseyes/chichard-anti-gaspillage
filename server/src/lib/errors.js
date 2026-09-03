/** Erreur portant un statut HTTP, destinée à être renvoyée telle quelle au client. */
export class HttpError extends Error {
  constructor(status, message, { code, details } = {}) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code ?? null;
    this.details = details ?? null;
  }
}

export const badRequest = (message, details) => new HttpError(400, message, { code: 'bad_request', details });
export const unauthorized = (message = "Authentification requise") => new HttpError(401, message, { code: 'unauthorized' });
export const forbidden = (message = "Vous n'avez pas accès à cette ressource") => new HttpError(403, message, { code: 'forbidden' });
export const notFound = (message = 'Ressource introuvable') => new HttpError(404, message, { code: 'not_found' });
export const conflict = (message, details) => new HttpError(409, message, { code: 'conflict', details });
export const unprocessable = (message, details) => new HttpError(422, message, { code: 'unprocessable', details });
export const tooManyRequests = (message = 'Trop de requêtes, réessayez dans un instant') => new HttpError(429, message, { code: 'rate_limited' });
