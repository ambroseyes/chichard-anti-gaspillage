import { describe, expect, it } from 'vitest';
import {
  issuePickupToken,
  verifyPickupToken,
  generateConfirmationCode,
  hashCode,
  codeMatches,
} from '../src/domain/pickup-token.js';

describe('jeton de retrait', () => {
  it('valide un jeton émis pour la bonne commande', () => {
    const token = issuePickupToken({ target: 'order', id: 'cmd-1' });
    expect(verifyPickupToken(token, { target: 'order', id: 'cmd-1' }).valid).toBe(true);
  });

  it("refuse un jeton fabriqué à partir du seul identifiant de commande", () => {
    // C'est exactement l'attaque que permettait l'ancien format `ORDER_<id>`.
    expect(verifyPickupToken('order.cmd-1', { target: 'order', id: 'cmd-1' }).valid).toBe(false);
    expect(verifyPickupToken('order.cmd-1.9999999999999.x', { id: 'cmd-1' }).reason).toBe('signature');
  });

  it('refuse un jeton signé pour une autre commande', () => {
    const token = issuePickupToken({ target: 'order', id: 'cmd-1' });
    expect(verifyPickupToken(token, { target: 'order', id: 'cmd-2' }).reason).toBe('mismatch');
  });

  it('refuse un jeton dont la signature a été modifiée', () => {
    const token = issuePickupToken({ target: 'order', id: 'cmd-1' });
    const tampered = `${token.slice(0, -2)}ZZ`;
    expect(verifyPickupToken(tampered, { id: 'cmd-1' }).valid).toBe(false);
  });

  it('refuse un jeton expiré', () => {
    const token = issuePickupToken({ target: 'order', id: 'cmd-1', ttlMs: 1000, now: 0 });
    expect(verifyPickupToken(token, { id: 'cmd-1', now: 10_000 }).reason).toBe('expired');
  });
});

describe('code de confirmation', () => {
  it('produit un code lisible sans caractères ambigus', () => {
    const code = generateConfirmationCode();
    expect(code).toMatch(/^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
  });

  it('ne se compare que par condensat, insensible à la casse', () => {
    const code = generateConfirmationCode();
    const hash = hashCode(code);
    expect(codeMatches(code.toLowerCase(), hash)).toBe(true);
    expect(codeMatches('AAAA-BBBB', hash)).toBe(false);
  });

  it('ne se répète pas', () => {
    const codes = new Set(Array.from({ length: 500 }, () => generateConfirmationCode()));
    expect(codes.size).toBe(500);
  });
});
