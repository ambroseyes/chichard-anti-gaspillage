import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const productId = body.product_id;

    if (!productId) {
      return Response.json({ error: 'product_id required' }, { status: 400 });
    }

    const product = await base44.asServiceRole.entities.Product.get(productId);
    if (!product) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }
    if (product.status !== 'active') {
      return Response.json({ success: true, message: 'Product not active, skipping' });
    }

    // Find all user preferences that include this product's category
    const preferences = await base44.asServiceRole.entities.UserPreference.filter({});
    const matchingPrefs = preferences.filter(p =>
      (p.favorite_categories || []).includes(product.category)
    );

    let notificationsCreated = 0;

    for (const pref of matchingPrefs) {
      // Skip if allergen conflict
      const productAllergens = product.allergens || [];
      const userAllergensToAvoid = pref.allergens_to_avoid || [];
      if (productAllergens.some(a => userAllergensToAvoid.includes(a))) continue;

      // Respect notification preferences (default to true)
      const notifPrefs = pref.notification_preferences || {};
      if (notifPrefs.favorite_products_promo === false) continue;

      await base44.asServiceRole.entities.Notification.create({
        user_email: pref.user_email,
        title: `Nouveau produit dans vos préférences : ${product.name}`,
        message: `${product.name} est disponible chez ${product.store_name} à ${product.discounted_price} FCFA (au lieu de ${product.original_price} FCFA).`,
        type: 'deal',
        action_url: '/Catalog',
        image_url: product.image_url,
        data: { product_id: product.id, category: product.category, store_id: product.store_id }
      });
      notificationsCreated++;
    }

    return Response.json({ success: true, notificationsCreated, matchedPreferences: matchingPrefs.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}