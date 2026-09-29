import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';
import { requireMsisdn } from './msisdn.js';
import { PaymentHttpError, createTokenCache, requestWithRetry } from './http.js';

/** MTN Mobile Money — API Collection (`requesttopay`). */

const jetons = createTokenCache();

const RÉGLAGES_REQUIS = [
  'MTN_MOMO_BASE_URL',
  'MTN_MOMO_SUBSCRIPTION_KEY',
  'MTN_MOMO_API_USER',
  'MTN_MOMO_API_KEY',
];

function vérifierRéglages() {
  const manquants = RÉGLAGES_REQUIS.filter((clé) => !env[clé]);
  if (manquants.length) {
    throw new PaymentHttpError(`MTN MoMo : configuration incomplète (${manquants.join(', ')})`);
  }
}

async function obtenirJeton() {
  const identifiants = Buffer.from(`${env.MTN_MOMO_API_USER}:${env.MTN_MOMO_API_KEY}`).toString(
    'base64',
  );

  const response = await requestWithRetry(
    `${env.MTN_MOMO_BASE_URL}/collection/token/`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${identifiants}`,
        'Ocp-Apim-Subscription-Key': env.MTN_MOMO_SUBSCRIPTION_KEY,
      },
    },
    { label: 'MTN MoMo (jeton)' },
  );

  if (!response.ok) {
    throw new PaymentHttpError(`MTN MoMo : jeton refusé (${response.status})`, {
      status: response.status,
    });
  }

  const body = await response.json().catch(() => ({}));
  if (!body.access_token) throw new PaymentHttpError('MTN MoMo : jeton absent de la réponse');

  return { token: body.access_token, expiresInSeconds: Number(body.expires_in) || 3600 };
}

export const mtnMomoProvider = {
  name: 'mtn_momo',

  async initiate({ reference, amount, phone, description }) {
    vérifierRéglages();

    const msisdn = requireMsisdn(phone);
    const token = await jetons.get(obtenirJeton);
    const referenceId = crypto.randomUUID();

    const response = await requestWithRetry(
      `${env.MTN_MOMO_BASE_URL}/collection/v1_0/requesttopay`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Reference-Id': referenceId,
          /* Environnement cible déclaré, et non déduit de NODE_ENV : une
             préproduction tournant en `production` visait l'environnement
             réel de l'opérateur et aurait débité de vrais comptes. */
          'X-Target-Environment': env.MTN_MOMO_TARGET_ENVIRONMENT,
          'Ocp-Apim-Subscription-Key': env.MTN_MOMO_SUBSCRIPTION_KEY,
          'X-Callback-Url': `${env.PUBLIC_BASE_URL}/api/payments/webhook`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: String(amount),
          currency: 'XAF',
          externalId: reference,
          payer: { partyIdType: 'MSISDN', partyId: msisdn },
          payerMessage: description,
          payeeNote: 'Chichard',
        }),
      },
      { label: 'MTN MoMo' },
    );

    if (response.status === 401) jetons.clear();

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      logger.warn({ status: response.status, body, reference }, 'MTN MoMo : transaction refusée');
      throw new PaymentHttpError(`MTN MoMo : refus (${response.status})`, {
        status: response.status,
      });
    }

    return { status: 'pending', providerRef: referenceId };
  },
};
