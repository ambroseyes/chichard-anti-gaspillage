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

    if (!product.store_id) {
      return Response.json({ success: true, message: 'No store_id on product' });
    }

    // Get the store to find owner and custom threshold
    const store = await base44.asServiceRole.entities.Store.get(product.store_id);
    if (!store) {
      return Response.json({ success: true, message: 'Store not found' });
    }

    const threshold = store.stock_alert_settings?.low_stock_threshold ?? 5;

    // Only notify if quantity is at or below the store's threshold
    if ((product.quantity_available ?? 0) > threshold) {
      return Response.json({ success: true, message: 'Quantity above threshold, no notification sent', threshold, quantity: product.quantity_available });
    }

    // Collect all emails to notify (owner + employees)
    const notifyEmails = [store.owner_email, ...(store.employee_emails || [])].filter(Boolean);

    let notificationsCreated = 0;
    for (const email of notifyEmails) {
      await base44.asServiceRole.entities.Notification.create({
        user_email: email,
        title: `Stock critique : ${product.name}`,
        message: `Le stock de ${product.name} est critique (${product.quantity_available} unité(s) restante(s), seuil ${threshold}). Ajustez le prix ou réapprovisionnez rapidement.`,
        type: 'system',
        action_url: '/PartnerProducts',
        data: { product_id: product.id, store_id: store.id, quantity: product.quantity_available, threshold }
      });
      notificationsCreated++;
    }

    // Send email alert if enabled
    if (store.stock_alert_settings?.enable_email_alerts && store.owner_email) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: store.owner_email,
          subject: `Alerte stock critique : ${product.name}`,
          body: `
            <div style="font-family:sans-serif;max-width:560px;margin:auto">
              <div style="background:linear-gradient(135deg,#f97316,#ea580c);padding:24px;text-align:center;border-radius:12px 12px 0 0">
                <h1 style="color:#fff;margin:0;font-size:20px">⚠️ Alerte stock critique</h1>
              </div>
              <div style="padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
                <p style="color:#374151">Le stock du produit <strong>${product.name}</strong> a atteint un niveau critique.</p>
                <table style="width:100%;font-size:14px;margin:16px 0">
                  <tr><td style="color:#6b7280;padding:4px 0">Quantité restante</td><td style="font-weight:600;text-align:right;color:#dc2626">${product.quantity_available} unité(s)</td></tr>
                  <tr><td style="color:#6b7280;padding:4px 0">Seuil d'alerte</td><td style="font-weight:600;text-align:right">${threshold} unité(s)</td></tr>
                  <tr><td style="color:#6b7280;padding:4px 0">Magasin</td><td style="font-weight:600;text-align:right">${store.name}</td></tr>
                </table>
                <p style="color:#6b7280;font-size:13px">Connectez-vous à votre espace partenaire pour ajuster le prix ou réapprovisionner.</p>
              </div>
            </div>
          `
        });
      } catch (e) {
        // Email failed, but in-app notifications were created
      }
    }

    return Response.json({ success: true, notificationsCreated, threshold, quantity: product.quantity_available });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}