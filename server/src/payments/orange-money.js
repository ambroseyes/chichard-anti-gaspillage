import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';

/**
 * Orange Money — API Web Payment.
 *
 * Le flux est asynchrone : on demande un jeton, on ouvre une transaction, puis
 * l'opérateur rappelle `/api/payments/webhook`. Aucun statut « payé » n'est
 * déduit de cette réponse.
 */
async function accessToken() {
  const credentials = Buffer.from(
    `${env.ORANGE_MONEY_CLIENT_ID}:${env.ORANGE_MONEY_CLIENT_SECRET}`,
  ).toString('base64');

  const response = await fetch(`${env.ORANGE_MONEY_BASE_URL}/oauth/v3/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) throw new Error(`Orange Money : jeton refusé (${response.status})`);
  const body = await response.json();
  return body.access_token;
}

export const orangeMoneyProvider = {
  name: 'orange_money',

  async initiate({ reference, amount, phone, description }) {
    const token = await accessToken();

    const response = await fetch(`${env.ORANGE_MONEY_BASE_URL}/omcoreapis/1.0.2/mp/pay`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchant_key: env.ORANGE_MONEY_MERCHANT_ID,
        currency: 'XAF',
        order_id: reference,
        amount,
        subscriber_msisdn: phone,
        description,
        notif_url: `${env.PUBLIC_BASE_URL}/api/payments/webhook`,
      }),
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      logger.warn({ status: response.status, body }, 'Orange Money : transaction refusée');
      throw new Error(body.message ?? `Orange Money : refus (${response.status})`);
    }

    return { status: 'pending', providerRef: body.pay_token ?? body.txnid ?? null };
  },
};
