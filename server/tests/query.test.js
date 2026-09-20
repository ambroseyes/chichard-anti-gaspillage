import { describe, expect, it } from 'vitest';
import { parseFilter, parseSort } from '../src/entities/query.js';

const champs = new Set(['name', 'store_id', 'quantity_available', 'tags']);

describe('analyse des filtres', () => {
  it('accepte une recherche insensible à la casse', () => {
    const where = parseFilter({ name: { contains: 'riz', mode: 'insensitive' } }, champs);
    expect(where).toEqual({ name: { contains: 'riz', mode: 'insensitive' } });
  });

  it('refuse une valeur de mode inattendue', () => {
    expect(() => parseFilter({ name: { contains: 'riz', mode: 'default' } }, champs)).toThrow();
    expect(() => parseFilter({ name: { contains: 'riz', mode: 'DROP TABLE' } }, champs)).toThrow();
  });

  it('refuse un modificateur seul, qui ne compare rien', () => {
    // Laisser passer ce filtre rendrait toute la table visible alors que
    // l'appelant croit avoir restreint sa requête.
    expect(() => parseFilter({ name: { mode: 'insensitive' } }, champs)).toThrow();
  });

  it('refuse toujours un opérateur inconnu', () => {
    expect(() => parseFilter({ name: { regex: '.*' } }, champs)).toThrow();
  });

  it('refuse un champ qui n’existe pas', () => {
    expect(() => parseFilter({ mot_de_passe: 'x' }, champs)).toThrow();
  });

  it('traduit les formes courantes', () => {
    expect(parseFilter({ store_id: 'abc' }, champs)).toEqual({ store_id: 'abc' });
    expect(parseFilter({ store_id: ['a', 'b'] }, champs)).toEqual({ store_id: { in: ['a', 'b'] } });
    expect(parseFilter({ quantity_available: { gt: 0 } }, champs)).toEqual({
      quantity_available: { gt: 0 },
    });
  });
});

describe('analyse du tri', () => {
  it('lit le sens depuis le préfixe', () => {
    expect(parseSort('-created_date')).toEqual({ created_date: 'desc' });
    expect(parseSort('name')).toEqual({ name: 'asc' });
  });

  it('refuse un champ de tri non conforme', () => {
    expect(() => parseSort('name; DROP TABLE')).toThrow();
  });
});
