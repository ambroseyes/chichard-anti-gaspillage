import { describe, expect, it } from 'vitest';
import {
  daysUntil,
  expiryLabel,
  formatKg,
  formatPercent,
  formatXAF,
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
