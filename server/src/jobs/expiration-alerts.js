import { prisma } from '../lib/prisma.js';

/**
 * Prévient consommateurs et partenaires des produits proches de leur date
 * limite, en respectant préférences de notification et allergènes.
 */
export async function checkExpirationAlerts({ now = new Date() } = {}) {
  const horizon = new Date(now.getTime() + 3 * 86_400_000);

  const products = await prisma.product.findMany({
    where: {
      status: 'active',
      quantity_available: { gt: 0 },
      expiration_date: { gte: now, lte: horizon },
    },
  });
  if (!products.length) return { products: 0, consumers: 0, partners: 0 };

  const preferences = await prisma.userPreference.findMany();
  const storeIds = [...new Set(products.map((p) => p.store_id).filter(Boolean))];
  const stores = await prisma.store.findMany({ where: { id: { in: storeIds } } });
  const storeById = new Map(stores.map((s) => [s.id, s]));

  const notifications = [];
  const notifiedStores = new Set();

  for (const product of products) {
    const when = product.expiration_date.toLocaleDateString('fr-FR');

    for (const pref of preferences) {
      if (!(pref.favorite_categories ?? []).includes(product.category)) continue;
      if ((product.allergens ?? []).some((a) => (pref.allergens_to_avoid ?? []).includes(a))) continue;
      if (pref.notification_preferences?.dlc_alerts === false) continue;

      notifications.push({
        user_email: pref.user_email,
        title: `Bientôt périmé : ${product.name}`,
        message: `${product.name} chez ${product.store_name} expire le ${when}. Profitez-en à ${product.discounted_price} FCFA.`,
        type: 'expiration',
        action_url: '/Catalog',
        image_url: product.image_url,
        data: { product_id: product.id, expiration_date: product.expiration_date },
      });
    }

    const store = storeById.get(product.store_id);
    if (store?.owner_email && !notifiedStores.has(store.id)) {
      notifiedStores.add(store.id);
      notifications.push({
        user_email: store.owner_email,
        title: `Produit proche de péremption : ${product.name}`,
        message: `${product.name} expire le ${when}. Ajustez le prix ou mettez-le en avant.`,
        type: 'expiration',
        action_url: '/PartnerDashboard',
        data: { product_id: product.id, store_id: store.id },
      });
    }
  }

  if (notifications.length) {
    await prisma.notification.createMany({ data: notifications });
  }

  return {
    products: products.length,
    consumers: notifications.filter((n) => n.action_url === '/Catalog').length,
    partners: notifiedStores.size,
  };
}
