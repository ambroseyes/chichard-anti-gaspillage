import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';

let transport = null;

function getTransport() {
  if (transport) return transport;
  if (!env.SMTP_HOST) {
    // Sans SMTP configuré, on journalise au lieu d'échouer : utile en local.
    transport = {
      sendMail: async (message) => {
        logger.info({ to: message.to, subject: message.subject }, 'e-mail simulé (SMTP non configuré)');
        return { messageId: 'dev-noop' };
      },
    };
    return transport;
  }
  transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
  });
  return transport;
}

export async function sendEmail({ to, subject, html, text }) {
  if (!to) throw new Error('Destinataire manquant');
  return getTransport().sendMail({ from: env.MAIL_FROM, to, subject, html, text });
}
