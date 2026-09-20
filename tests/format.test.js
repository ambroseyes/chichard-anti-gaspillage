import { describe, expect, it } from 'vitest';
import {
  daysUntil,
  expiryLabel,
  formatKg,
  formatPercent,
  formatXAF,
  isMobileMoneyNumber,
} from '@/lib/format';

describe('montants en francs CFA', () => {
  it('formate sans décimale et avec séparateur de milliers', () => {
    expect(formatXAF(12500)).toMatch(/12\s?500 FCFA/);
  });

  it('arrondit à l’entier — le franc CFA n’a pas de sous-unité', () => {
    expect(formatXAF(1499.6)).toMatch(/1\s?500 FCFA/);
  });

  it('traite les valeurs absentes comme zéro plutôt que d’afficher NaN', () => {
    expect(formatXAF(undefined)).toMatch(/0 FCFA/);
    expect(formatXAF(null)).toMatch(/0 FCFA/);
  });
});

describe('dates de péremption', () => {
  const now = new Date('2026-03-10T08:00:00Z');

  it.each([
    ['2026-03-10T20:00:00Z', 'Dernier jour'],
    ['2026-03-11T20:00:00Z', 'Demain'],
    ['2026-03-14T20:00:00Z', 'Dans 4 jours'],
    ['2026-03-01T00:00:00Z', 'Périmé'],
  ])('%s → %s', (date, expected) => {
    expect(expiryLabel(date, now)).toBe(expected);
  });

  it('renvoie null pour une date absente', () => {
    expect(daysUntil(null)).toBeNull();
  });
});

describe('autres formats', () => {
  it('utilise la virgule décimale française', () => {
    expect(formatPercent(12.34)).toBe('12,3 %');
    expect(formatKg(3.456)).toBe('3,5 kg');
  });
});

describe('numéro joignable par paiement mobile', () => {
  it('accepte les formes qu’un client saisit réellement', () => {
    for (const saisie of ['699112233', '6 99 11 22 33', '+237699112233', '00237699112233']) {
      expect(isMobileMoneyNumber(saisie)).toBe(true);
    }
  });

  it('refuse ce qu’un opérateur ne saurait pas joindre', () => {
    // Huit chiffres (ancienne numérotation), fixe en 2, saisie vide.
    for (const saisie of ['99112233', '233421234', '', null, '12345']) {
      expect(isMobileMoneyNumber(saisie)).toBe(false);
    }
  });

  it('applique la même règle que le serveur', () => {
    // Le serveur refuse la commande sur ce critère : un écart entre les deux
    // laisserait le client bloqué sans comprendre pourquoi.
    expect(isMobileMoneyNumber('6991122334')).toBe(false);
    expect(isMobileMoneyNumber('623711223')).toBe(true);
  });
});
