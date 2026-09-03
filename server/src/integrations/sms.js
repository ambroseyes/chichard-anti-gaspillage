import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';

/**
 * Envoi SMS via une passerelle HTTP générique (la plupart des agrégateurs
 * camerounais exposent ce format). Désactivé par défaut.
 */
export async function sendSMS({ to, message }) {
  if (env.SMS_PROVIDER === 'none' || !env.SMS_API_URL) {
    logger.info({ to }, 'SMS simulé (passerelle non configurée)');
    return { simulated: true };
  }

  const response = await fetch(env.SMS_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.SMS_API_KEY}`,
    },
    body: JSON.stringify({ to, from: env.SMS_SENDER, message }),
  });

  if (!response.ok) throw new Error(`Passerelle SMS : ${response.status}`);
  return response.json().catch(() => ({ ok: true }));
}
