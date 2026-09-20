import { logger } from '../lib/logger.js';

/**
 * Appels HTTP vers les opérateurs de paiement.
 *
 * Un `fetch` nu n'a pas de délai d'attente : un opérateur qui ne répond pas
 * bloquait la création de commande aussi longtemps qu'il le voulait, le client
 * restant devant un bouton qui tourne. Ces appels sont donc bornés dans le
 * temps, et repris un nombre fini de fois — seulement quand la reprise a un
 * sens.
 */

export const DÉLAI_PAR_DÉFAUT_MS = 10_000;
const REPRISES_PAR_DÉFAUT = 2;
const ATTENTE_INITIALE_MS = 300;

/**
 * Codes qu'il est raisonnable de retenter : surcharge et pannes passagères.
 * Un 400 ou un 401 se reproduira à l'identique — les retenter ne fait que
 * retarder le refus.
 */
const STATUTS_REPRENABLES = new Set([408, 425, 429, 500, 502, 503, 504]);

export class PaymentHttpError extends Error {
  constructor(message, { status = null, body = null, cause = null } = {}) {
    super(message);
    this.name = 'PaymentHttpError';
    this.status = status;
    this.body = body;
    this.cause = cause;
  }
}

const dormir = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Exécute une requête bornée dans le temps, avec reprises sur erreurs
 * transitoires. Rend la réponse telle quelle : c'est à l'appelant de décider
 * ce qu'un statut signifie pour son opérateur.
 */
export async function requestWithRetry(url, options = {}, {
  timeoutMs = DÉLAI_PAR_DÉFAUT_MS,
  retries = REPRISES_PAR_DÉFAUT,
  label = 'opérateur',
} = {}) {
  let dernièreErreur = null;

  for (let tentative = 0; tentative <= retries; tentative += 1) {
    const arrêt = AbortSignal.timeout(timeoutMs);

    try {
      const response = await fetch(url, { ...options, signal: arrêt });

      if (STATUTS_REPRENABLES.has(response.status) && tentative < retries) {
        dernièreErreur = new PaymentHttpError(`${label} : réponse ${response.status}`, {
          status: response.status,
        });
        await dormir(ATTENTE_INITIALE_MS * 2 ** tentative);
        continue;
      }

      return response;
    } catch (erreur) {
      // Expiration ou coupure réseau : reprenable tant qu'il reste des essais.
      dernièreErreur = new PaymentHttpError(
        erreur.name === 'TimeoutError'
          ? `${label} : pas de réponse en ${timeoutMs} ms`
          : `${label} : appel impossible`,
        { cause: erreur },
      );

      if (tentative >= retries) break;
      await dormir(ATTENTE_INITIALE_MS * 2 ** tentative);
    }
  }

  logger.warn({ err: dernièreErreur, url: String(url).split('?')[0] }, `${label} : appel abandonné`);
  throw dernièreErreur;
}

/**
 * Mémoire courte pour un jeton d'accès.
 *
 * Les opérateurs délivrent des jetons valables une heure. En redemander un à
 * chaque paiement ajoutait un aller-retour, une latence et un point de panne
 * supplémentaires à chaque commande.
 */
export function createTokenCache({ margeMs = 60_000 } = {}) {
  let jeton = null;
  let expiration = 0;
  let enCours = null;

  return {
    async get(obtenir) {
      if (jeton && Date.now() < expiration) return jeton;

      // Dix commandes simultanées ne doivent demander qu'un seul jeton.
      enCours ??= obtenir()
        .then(({ token, expiresInSeconds }) => {
          jeton = token;
          expiration = Date.now() + Math.max(0, expiresInSeconds * 1000 - margeMs);
          return token;
        })
        .finally(() => {
          enCours = null;
        });

      return enCours;
    },

    clear() {
      jeton = null;
      expiration = 0;
    },
  };
}
