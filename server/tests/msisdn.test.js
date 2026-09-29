import { describe, expect, it } from 'vitest';
import { formatMsisdn, isMobileMoneyNumber, requireMsisdn, toMsisdn } from '../src/payments/msisdn.js';

describe('mise au format MSISDN', () => {
  it('ajoute l’indicatif à un numéro local', () => {
    // Régression : le tunnel collecte ce format, les opérateurs attendent
    // l'international. Envoyé tel quel, tout paiement mobile était rejeté.
    expect(toMsisdn('699112233')).toBe('237699112233');
    expect(toMsisdn('6 99 11 22 33')).toBe('237699112233');
    expect(toMsisdn('699-11-22-33')).toBe('237699112233');
  });

  it('accepte les formes internationales', () => {
    expect(toMsisdn('+237699112233')).toBe('237699112233');
    expect(toMsisdn('00237699112233')).toBe('237699112233');
    expect(toMsisdn('237699112233')).toBe('237699112233');
    expect(toMsisdn('(237) 699 11 22 33')).toBe('237699112233');
  });

  it('refuse ce qui ne peut pas être un mobile camerounais', () => {
    expect(toMsisdn('12345')).toBeNull();
    expect(toMsisdn('')).toBeNull();
    expect(toMsisdn(null)).toBeNull();
    expect(toMsisdn(undefined)).toBeNull();
    // Huit chiffres : ancienne numérotation, plus attribuée.
    expect(toMsisdn('99112233')).toBeNull();
    // Dix chiffres nationaux : une saisie de trop.
    expect(toMsisdn('6991122334')).toBeNull();
    // Les fixes commencent par 2, pas par 6 : injoignables en paiement mobile.
    expect(toMsisdn('233421234')).toBeNull();
  });

  it('ne se laisse pas tromper par un indicatif au milieu du numéro', () => {
    // « 237 » apparaît dans les chiffres mais pas en tête : le numéro reste
    // national et doit être préfixé, pas tronqué.
    expect(toMsisdn('623711223')).toBe('237623711223');
  });

  it('expose un prédicat cohérent avec la conversion', () => {
    expect(isMobileMoneyNumber('699112233')).toBe(true);
    expect(isMobileMoneyNumber('12345')).toBe(false);
  });

  it('refuse explicitement plutôt que de rendre un numéro vide', () => {
    expect(() => requireMsisdn('12345')).toThrow(/invalide/i);
    expect(requireMsisdn('699112233')).toBe('237699112233');
  });

  it('met en forme pour l’affichage', () => {
    expect(formatMsisdn('699112233')).toBe('+237 6 99 11 22 33');
    // Une saisie inexploitable est rendue telle quelle : on n'invente rien.
    expect(formatMsisdn('inconnu')).toBe('inconnu');
  });
});
