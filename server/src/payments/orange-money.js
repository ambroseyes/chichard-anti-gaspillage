import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';
import { requireMsisdn } from './msisdn.js';
import { PaymentHttpError, createTokenCache, requestWithRetry } from './http.js';

/**
 * Orange Money — API Web Payment.
 *
 * Le flux est asynchrone : on demande un jeton, on ouvre une transaction, puis
 * l'opérateur rappelle `/api/payments/webhook`. Aucun statut « payé » n'est
 * déduit de cette réponse.
 */

const jetons = createTokenCache();

/** Ce que l'intégration exige pour fonctionner ; vérifié avant tout appel. */
const RÉGLAGES_REQUIS = [
  'ORANGE_MONEY_BASE_URL',
  'ORANGE_MONEY_CLIENT_ID',
  'ORANGE_MONEY_CLIENT_SECRET',
  'ORANGE_MONEY_MERCHANT_ID',
];

function vérifierRéglages() {
  const manquants = RÉGLAGES_REQUIS.filter((clé) => !env[clé]);
  if (manquants.length) {
    // Sans cela, l'appel partait vers une URL vide et échouait de façon
    // incompréhensible, plusieurs couches plus loin.
    throw new PaymentHttpError(
      `Orange Money : configuration incomplète (${manquants.join(', ')})`,
    );
  }
}

async function obtenirJeton() {
  const identifiants = Buffer.from(
    `${env.ORANGE_MONEY_CLIENT_ID}:${env.ORANGE_MONEY_CLIENT_SECRET}`,
  ).toString('base64');

  const response = await requestWithRetry(
    `${env.ORANGE_MONEY_BASE_URL}/oauth/v3/token`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${identifiants}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    },
    { label: 'Orange Money (jeton)' },
  );

  if (!response.ok) {
    throw new PaymentHttpError(`Orange Money : jeton refusé (${response.status})`, {
      status: response.status,
    });
  }

  const body = await response.json().catch(() => ({}));
  if (!body.access_token) {
    throw new PaymentHttpError('Orange Money : jeton absent de la réponse');
  }

  return { token: body.access_token, expiresInSeconds: Number(body.expires_in) || 3600 };
}

export const orangeMoneyProvider = {
  name: 'orange_money',

  async initiate({ reference, amount, phone, description }) {
    vérifierRéglages();

    // L'opérateur attend un MSISDN international ; le tunnel collecte un
    // numéro local. Sans cette mise au format, la transaction était refusée.
    const msisdn = requireMsisdn(phone);
    const token = await jetons.get(obtenirJeton);

    const response = await requestWithRetry(
      `${env.ORANGE_MONEY_BASE_URL}/omcoreapis/1.0.2/mp/pay`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant_key: env.ORANGE_MONEY_MERCHANT_ID,
          currency: 'XAF',
          order_id: reference,
          amount,
          subscriber_msisdn: msisdn,
          description,
          notif_url: `${env.PUBLIC_BASE_URL}/api/payments/webhook`,
        }),
      },
      { label: 'Orange Money' },
    );

    const body = await response.json().catch(() => ({}));

    if (response.status === 401) {
      // Jeton périmé côté opérateur : on l'oublie pour que la prochaine
      // tentative en redemande un plutôt que de rejouer le même.
      jetons.clear();
    }

    if (!response.ok) {
      // Le message de l'opérateur est journalisé, pas renvoyé au client :
      // il n'est ni traduit, ni destiné à un acheteur.
      logger.warn({ status: response.status, body, reference }, 'Orange Money : transaction refusée');
      throw new PaymentHttpError(`Orange Money : refus (${response.status})`, {
        status: response.status,
        body,
      });
    }

    return { status: 'pending', providerRef: body.pay_token ?? body.txnid ?? null };
  },
};
