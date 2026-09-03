import { describe, expect, it } from 'vitest';
import {
  computeOrderTotals,
  couponDiscount,
  suggestedPrice,
  urgencyFor,
  co2SavedKg,
} from '../src/domain/pricing.js';

const lines = [
  { unit_price: 900, original_price: 1500, quantity: 2, weight_kg: 1 },
  { unit_price: 650, original_price: 1000, quantity: 1, weight_kg: 1 },
];

describe('totaux de commande', () => {
  it('additionne les lignes et calcule les économies', () => {
    const t = computeOrderTotals({ lines, deliveryType: 'pickup' });
    expect(t.subtotal).toBe(2450);
    expect(t.savings).toBe(1550);
    expect(t.deliveryFee).toBe(0);
    expect(t.total).toBe(2450);
  });

  it('facture les frais de livraison annoncés', () => {
    const t = computeOrderTotals({ lines, deliveryType: 'delivery', deliveryFee: 1000 });
    expect(t.deliveryFee).toBe(1000);
    expect(t.total).toBe(3450);
  });

  it('offre la livraison au-delà du seuil', () => {
    const gros = [{ unit_price: 30000, original_price: 40000, quantity: 1, weight_kg: 5 }];
    const t = computeOrderTotals({
      lines: gros,
      deliveryType: 'delivery',
      deliveryFee: 1000,
      freeDeliveryThreshold: 25000,
    });
    expect(t.deliveryFee).toBe(0);
  });

  it('applique une remise en pourcentage', () => {
    const coupon = { status: 'ACTIVE', type: 'PERCENT', value: 10 };
    const t = computeOrderTotals({ lines, coupon });
    expect(t.discount).toBe(245);
    expect(t.total).toBe(2205);
  });

  it('ne rend jamais un total négatif', () => {
    const coupon = { status: 'ACTIVE', type: 'FIXED', value: 999_999 };
    const t = computeOrderTotals({ lines, coupon });
    expect(t.total).toBe(0);
    expect(t.discount).toBe(2450);
  });
});

describe('coupons', () => {
  it('refuse un coupon déjà utilisé', () => {
    expect(couponDiscount({ status: 'USED', type: 'FIXED', value: 500 }, 5000).error).toMatch(/déjà/);
  });

  it('refuse un coupon expiré', () => {
    const coupon = { status: 'ACTIVE', type: 'FIXED', value: 500, valid_to: '2020-01-01' };
    expect(couponDiscount(coupon, 5000).error).toMatch(/expiré/);
  });

  it('refuse en dessous du minimum de commande', () => {
    const coupon = { status: 'ACTIVE', type: 'FIXED', value: 500, min_cart_amount: 10_000 };
    expect(couponDiscount(coupon, 5000).amount).toBe(0);
  });
});

describe('urgence et prix conseillé', () => {
  const now = new Date('2026-03-10T08:00:00Z');

  it.each([
    ['2026-03-10T20:00:00Z', 'critical', 0.7],
    ['2026-03-12T20:00:00Z', 'urgent', 0.5],
    ['2026-03-14T20:00:00Z', 'soon', 0.35],
    ['2026-03-16T20:00:00Z', 'normal', 0.2],
  ])('%s → %s', (date, urgency, rate) => {
    const result = urgencyFor(date, now);
    expect(result.urgency).toBe(urgency);
    expect(result.suggestedRate).toBe(rate);
  });

  it('applique le palier au prix d’origine', () => {
    expect(suggestedPrice(1000, '2026-03-12T20:00:00Z', now)).toBe(500);
  });

  it('marque comme périmé au-delà de la date', () => {
    expect(urgencyFor('2026-03-01', now).urgency).toBe('expired');
  });
});

describe('CO2 évité', () => {
  it('se calcule sur le poids réel, pas sur le nombre de lignes', () => {
    expect(co2SavedKg(lines, 2.5)).toBe(7.5);
  });
});
