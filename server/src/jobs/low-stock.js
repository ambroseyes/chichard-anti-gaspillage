import { prisma } from '../lib/prisma.js';
import { sendEmail } from '../integrations/email.js';
import { lowStockEmail } from '../integrations/templates.js';
import { logger } from '../lib/logger.js';

const DEFAULT_THRESHOLD = 5;

/**
 * Alerte les partenaires dont un produit passe sous leur seuil.
 * Une alerte n'est envoyée qu'une fois par produit et par jour, en s'appuyant
 * sur les notifications déjà écrites.
 */
export async function notifyLowStock({ now = new Date() } = {}) {
  const stores = await prisma.store.findMany({ where: { status: 'verified' } });
  let notified = 0;

  for (const store of stores) {
    const threshold = store.stock_alert_settings?.low_stock_threshold ?? DEFAULT_THRESHOLD;

    const products = await prisma.product.findMany({
      where: {
        store_id: store.id,
        status: 'active',
        quantity_available: { lte: threshold, gt: 0 },
      },
    });
    if (!products.length) continue;

    const recipients = [store.owner_email, ...(store.employee_emails ?? [])].filter(Boolean);
    const since = new Date(now.getTime() - 86_400_000);

    for (const product of products) {
      const alreadySent = await prisma.notification.findFirst({
        where: {
          type: 'system',
          created_date: { gte: since },
          data: { path: ['product_id'], equals: product.id },
        },
      });
      if (alreadySent) continue;

      await prisma.notification.createMany({
        data: recipients.map((email) => ({
          user_email: email,
          title: `Stock critique : ${product.name}`,
          message: `${product.quantity_available} unité(s) restante(s), seuil ${threshold}.`,
          type: 'system',
          action_url: '/PartnerProducts',
          data: { product_id: product.id, store_id: store.id, threshold },
        })),
      });
      notified += 1;

      if (store.stock_alert_settings?.enable_email_alerts && store.owner_email) {
        sendEmail({
          to: store.owner_email,
          subject: `Alerte stock : ${product.name}`,
          html: lowStockEmail({ product, store, threshold }),
        }).catch((error) => logger.warn({ err: error }, "e-mail d'alerte stock non envoyé"));
      }
    }
  }

  return { notified };
}
