import { describe, expect, it, vi } from 'vitest';
import { createTtlCache } from '../src/lib/cache.js';

describe('cache à durée de vie courte', () => {
  it('rend la valeur mise en cache, puis l’oublie une fois périmée', () => {
    vi.useFakeTimers();
    const cache = createTtlCache({ ttlMs: 1000 });

    cache.set('a', 42);
    expect(cache.get('a')).toBe(42);

    vi.advanceTimersByTime(1001);
    expect(cache.get('a')).toBeUndefined();
    vi.useRealTimers();
  });

  it('ne calcule qu’une fois pour plusieurs appels simultanés', async () => {
    const cache = createTtlCache({ ttlMs: 1000 });
    let appels = 0;
    const calculer = async () => {
      appels += 1;
      return 'résultat';
    };

    const [a, b, c] = await Promise.all([
      cache.remember('clé', calculer),
      cache.remember('clé', calculer),
      cache.remember('clé', calculer),
    ]);

    expect([a, b, c]).toEqual(['résultat', 'résultat', 'résultat']);
    // Sans mise en cache immédiate de la promesse, trois requêtes simultanées
    // déclencheraient trois calculs identiques.
    expect(appels).toBe(1);
  });

  it('ne garde pas un échec en cache', async () => {
    const cache = createTtlCache({ ttlMs: 10_000 });
    let appels = 0;

    const échouer = async () => {
      appels += 1;
      throw new Error('base injoignable');
    };

    await expect(cache.remember('clé', échouer)).rejects.toThrow('base injoignable');
    await expect(cache.remember('clé', échouer)).rejects.toThrow('base injoignable');

    // Une panne passagère ne doit pas être resservie pendant dix secondes.
    expect(appels).toBe(2);
  });

  it('évince les entrées les plus anciennes au-delà de la capacité', () => {
    const cache = createTtlCache({ ttlMs: 10_000, maxEntries: 3 });
    for (const clé of ['a', 'b', 'c', 'd']) cache.set(clé, clé);

    expect(cache.size).toBe(3);
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('d')).toBe('d');
  });
});
