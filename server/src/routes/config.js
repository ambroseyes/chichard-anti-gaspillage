import { Router } from 'express';
import { env } from '../config/env.js';
import { ECO_LEVELS, LOYALTY_TIERS } from '../domain/loyalty.js';
import { DISCOUNT_LADDER } from '../domain/pricing.js';
import { definitions } from '../entities/schema.js';

export const configRouter = Router();

/**
 * Constantes métier servies au front, pour qu'il n'en redéclare aucune.
 * Toute valeur affichée dans l'interface vient d'ici.
 */
configRouter.get('/', (_req, res) => {
  const product = definitions.get('Product');

  res.json({
    data: {
      currency: 'XAF',
      locale: 'fr-CM',
      delivery_fee: env.DELIVERY_FEE_XAF,
      free_delivery_threshold: env.FREE_DELIVERY_THRESHOLD_XAF,
      payment_methods: [
        { id: 'orange_money', label: 'Orange Money' },
        { id: 'mtn_money', label: 'MTN Mobile Money' },
        { id: 'card', label: 'Carte bancaire' },
        { id: 'cash', label: 'Paiement à la livraison' },
      ],
      product_categories: (product?.properties?.category?.enum ?? []).map((id) => ({
        id,
        label: CATEGORY_LABELS[id] ?? id,
      })),
      urgency_levels: DISCOUNT_LADDER,
      loyalty_tiers: LOYALTY_TIERS,
      eco_levels: ECO_LEVELS,
      features: {
        ai: env.LLM_PROVIDER !== 'none',
        sms: env.SMS_PROVIDER !== 'none',
        payments: env.PAYMENT_PROVIDER,
      },
    },
  });
});

const CATEGORY_LABELS = {
  fruits_legumes: 'Fruits & légumes',
  produits_laitiers: 'Produits laitiers',
  viandes_poissons: 'Viandes & poissons',
  boulangerie: 'Boulangerie',
  epicerie: 'Épicerie',
  boissons: 'Boissons',
  surgeles: 'Surgelés',
  hygiene: 'Hygiène',
  conserves: 'Conserves',
  condiments: 'Condiments',
};
