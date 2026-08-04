import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    const now = new Date();
    const threeDaysLater = new Date(now);
    threeDaysLater.setDate(now.getDate() + 3);

    // Get all active products
    const products = await base44.asServiceRole.entities.Product.filter({ status: 'active' });

    // Filter products expiring within 3 days (and not already expired)
    const expiringProducts = products.filter(p => {
      if (!p.expiration_date) return false;
      const expDate = new Date(p.expiration_date);
      return expDate >= now && expDate <= threeDaysLater;
    });

    // Get all user preferences
    const preferences = await base44.asServiceRole.entities.UserPreference.filter({});

    let consumerNotifications = 0;
    let partnerNotifications = 0;
    const partnerNotified = new Set();

    for (const product of expiringProducts) {
      const expDateStr = new Date(product.expiration_date).toLocaleDateString('fr-FR');

      // --- Notify consumers whose preferences match ---
      const matchingPrefs = preferences.filter(p =>
        (p.favorite_categories || []).includes(product.category)
      );

      for (const pref of matchingPrefs) {
        const productAllergens = product.allergens || [];
        const userAllergensToAvoid = pref.allergens_to_avoid || [];
        if (productAllergens.some(a => userAllergensToAvoid.includes(a))) continue;

        const notifPrefs = pref.notification_preferences || {};
        if (notifPrefs.dlc_alerts === false) continue;

        await base44.asServiceRole.entities.Notification.create({
          user_email: pref.user_email,
          title: `Produit bientôt périmé : ${product.name}`,
          message: `${product.name} chez ${product.store_name} expire le ${expDateStr}. Profitez-en à ${product.discounted_price} FCFA !`,
          type: 'expiration',
          action_url: '/Catalog',
          image_url: product.image_url,
          data: { product_id: product.id, expiration_date: product.expiration_date }
        });
        consumerNotifications++;
      }

      // --- Notify the partner (once per store) ---
      if (product.store_id && !partnerNotified.has(product.store_id)) {
        try {
          const store = await base44.asServiceRole.entities.Store.get(product.store_id);
          if (store && store.owner_email) {
            await base44.asServiceRole.entities.Notification.create({
              user_email: store.owner_email,
              title: `Produit proche de péremption : ${product.name}`,
              message: `${product.name} expire le ${expDateStr}. Pensez à ajuster le prix ou à le mettre en avant pour accélérer la vente.`,
              type: 'expiration',
              action_url: '/PartnerDashboard',
              data: { product_id: product.id, store_id: product.store_id }
            });
            partnerNotifications++;
            partnerNotified.add(product.store_id);
          }
        } catch (e) {
          // Store not found, skip
        }
      }
    }

    return Response.json({
      success: true,
      expiringProducts: expiringProducts.length,
      consumerNotifications,
      partnerNotifications
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}