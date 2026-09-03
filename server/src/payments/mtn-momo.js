import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';

/** MTN Mobile Money — API Collection (`requesttopay`). */
async function accessToken() {
  const credentials = Buffer.from(`${env.MTN_MOMO_API_USER}:${env.MTN_MOMO_API_KEY}`).toString('base64');

  const response = await fetch(`${env.MTN_MOMO_BASE_URL}/collection/token/`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Ocp-Apim-Subscription-Key': env.MTN_MOMO_SUBSCRIPTION_KEY,
    },
  });

  if (!response.ok) throw new Error(`MTN MoMo : jeton refusé (${response.status})`);
  const body = await response.json();
  return body.access_token;
}

export const mtnMomoProvider = {
  name: 'mtn_momo',

  async initiate({ reference, amount, phone, description }) {
    const token = await accessToken();
    const referenceId = crypto.randomUUID();

    const response = await fetch(`${env.MTN_MOMO_BASE_URL}/collection/v1_0/requesttopay`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Reference-Id': referenceId,
        'X-Target-Environment': env.NODE_ENV === 'production' ? 'mtncameroon' : 'sandbox',
        'Ocp-Apim-Subscription-Key': env.MTN_MOMO_SUBSCRIPTION_KEY,
        'X-Callback-Url': `${env.PUBLIC_BASE_URL}/api/payments/webhook`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: String(amount),
        currency: 'XAF',
        externalId: reference,
        payer: { partyIdType: 'MSISDN', partyId: String(phone ?? '').replace(/\D/g, '') },
        payerMessage: description,
        payeeNote: 'Chichard',
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      logger.warn({ status: response.status, body }, 'MTN MoMo : transaction refusée');
      throw new Error(`MTN MoMo : refus (${response.status})`);
    }

    return { status: 'pending', providerRef: referenceId };
  },
};
