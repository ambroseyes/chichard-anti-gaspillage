/** Gabarits d'e-mails transactionnels. HTML en ligne : les clients mail ignorent les feuilles de style. */

const xaf = (n) => `${Math.round(Number(n) || 0).toLocaleString('fr-FR')} FCFA`;

const shell = (title, body) => `
<div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:auto;background:#fff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden">
  <div style="background:linear-gradient(135deg,#10b981,#0d9488);padding:28px 24px;text-align:center">
    <h1 style="color:#fff;margin:0;font-size:22px">Chichard</h1>
    <p style="color:#d1fae5;margin:6px 0 0;font-size:14px">${title}</p>
  </div>
  <div style="padding:26px 24px">${body}</div>
  <div style="padding:16px 24px;border-top:1px solid #f3f4f6;color:#9ca3af;font-size:12px;text-align:center">
    Chichard — la plateforme anti-gaspillage
  </div>
</div>`;

export function orderConfirmationEmail({ order, lines, confirmationCode, payment }) {
  const rows = lines
    .map(
      (l) => `<tr>
        <td style="padding:6px 0;border-bottom:1px solid #f3f4f6;color:#374151">${l.product_name} × ${l.quantity}</td>
        <td style="padding:6px 0;border-bottom:1px solid #f3f4f6;text-align:right;color:#374151">${xaf(l.unit_price * l.quantity)}</td>
      </tr>`,
    )
    .join('');

  const paymentLine =
    payment?.status === 'succeeded'
      ? 'Paiement reçu.'
      : "Le paiement est en attente de confirmation par votre opérateur. Vous recevrez un message dès qu'il sera validé.";

  return shell(
    `Commande ${order.order_number}`,
    `
    <p style="color:#374151;font-size:15px">Bonjour ${order.customer_name ?? ''},</p>
    <p style="color:#6b7280;font-size:14px">Votre commande est enregistrée. ${paymentLine}</p>

    <table style="width:100%;font-size:14px;margin:18px 0">
      ${rows}
      ${order.discount_amount ? `<tr><td style="padding:6px 0;color:#10b981">Code promo ${order.coupon_code}</td><td style="padding:6px 0;text-align:right;color:#10b981">−${xaf(order.discount_amount)}</td></tr>` : ''}
      ${order.delivery_fee ? `<tr><td style="padding:6px 0;color:#6b7280">Livraison</td><td style="padding:6px 0;text-align:right;color:#6b7280">${xaf(order.delivery_fee)}</td></tr>` : ''}
      <tr><td style="padding:10px 0;font-weight:700;font-size:16px">Total</td><td style="padding:10px 0;font-weight:700;font-size:16px;text-align:right">${xaf(order.total_amount)}</td></tr>
    </table>

    <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;padding:16px;text-align:center;margin:18px 0">
      <p style="margin:0;color:#065f46;font-size:12px">Code à présenter au ${order.delivery_type === 'pickup' ? 'magasin' : 'livreur'}</p>
      <p style="margin:6px 0 0;font-size:26px;font-weight:700;letter-spacing:3px;color:#065f46;font-family:monospace">${confirmationCode}</p>
    </div>

    <p style="color:#6b7280;font-size:13px">Vous avez évité environ <strong>${order.co2_saved_kg} kg de CO₂</strong> avec cette commande.</p>
  `,
  );
}

export function reservationEmail({ reservation, confirmationCode }) {
  return shell(
    'Réservation confirmée',
    `
    <p style="color:#374151;font-size:15px">Bonjour ${reservation.customer_name ?? ''},</p>
    <p style="color:#6b7280;font-size:14px">
      Votre panier « ${reservation.basket_name} » est réservé chez ${reservation.store_name}.
    </p>
    <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;padding:16px;text-align:center;margin:18px 0">
      <p style="margin:0;color:#065f46;font-size:12px">Code de retrait</p>
      <p style="margin:6px 0 0;font-size:26px;font-weight:700;letter-spacing:3px;color:#065f46;font-family:monospace">${confirmationCode}</p>
    </div>
    <p style="color:#6b7280;font-size:13px">
      Retrait le ${new Date(reservation.pickup_date).toLocaleDateString('fr-FR')} · ${reservation.pickup_slot}<br>
      ${reservation.store_address ?? ''}
    </p>
  `,
  );
}

export function lowStockEmail({ product, store, threshold }) {
  return shell(
    'Alerte stock',
    `
    <p style="color:#374151;font-size:15px">Le stock de <strong>${product.name}</strong> est critique.</p>
    <table style="width:100%;font-size:14px;margin:16px 0">
      <tr><td style="color:#6b7280;padding:4px 0">Quantité restante</td><td style="text-align:right;font-weight:600;color:#dc2626">${product.quantity_available}</td></tr>
      <tr><td style="color:#6b7280;padding:4px 0">Seuil d'alerte</td><td style="text-align:right;font-weight:600">${threshold}</td></tr>
      <tr><td style="color:#6b7280;padding:4px 0">Magasin</td><td style="text-align:right;font-weight:600">${store.name}</td></tr>
    </table>
    <p style="color:#6b7280;font-size:13px">Ajustez le prix ou réapprovisionnez depuis votre espace partenaire.</p>
  `,
  );
}

export function passwordResetEmail({ resetUrl }) {
  return shell(
    'Réinitialisation du mot de passe',
    `
    <p style="color:#6b7280;font-size:14px">
      Cliquez sur le lien ci-dessous pour choisir un nouveau mot de passe. Il expire dans une heure.
    </p>
    <p style="text-align:center;margin:22px 0">
      <a href="${resetUrl}" style="background:#10b981;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:600">Choisir un nouveau mot de passe</a>
    </p>
    <p style="color:#9ca3af;font-size:12px">Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</p>
  `,
  );
}
