/**
 * Cache mémoire à durée de vie courte.
 *
 * Réservé aux réponses publiques, identiques pour tout le monde. Rien qui
 * dépende de l'utilisateur ne doit passer par ici : une entrée est partagée
 * par tous les appelants, sans distinction.
 *
 * Le cache vit dans le processus. Avec plusieurs instances, chacune a le sien —
 * c'est sans conséquence pour des agrégats à durée de vie de quelques
 * secondes, mais ça exclut d'y ranger quoi que ce soit qui doive être cohérent
 * entre instances.
 */
export function createTtlCache({ ttlMs = 30_000, maxEntries = 200 } = {}) {
  const entries = new Map();

  const évincer = () => {
    const maintenant = Date.now();
    for (const [clé, entrée] of entries) {
      if (entrée.expiresAt <= maintenant) entries.delete(clé);
    }
    // Une Map itère dans l'ordre d'insertion : les plus anciennes partent d'abord.
    while (entries.size > maxEntries) {
      entries.delete(entries.keys().next().value);
    }
  };

  return {
    get(clé) {
      const entrée = entries.get(clé);
      if (!entrée) return undefined;
      if (entrée.expiresAt <= Date.now()) {
        entries.delete(clé);
        return undefined;
      }
      return entrée.value;
    },

    set(clé, value) {
      entries.set(clé, { value, expiresAt: Date.now() + ttlMs });
      évincer();
      return value;
    },

    /**
     * Calcule la valeur si elle est absente ou périmée. La promesse est mise en
     * cache immédiatement : dix requêtes simultanées sur la même clé déclenchent
     * un seul calcul, pas dix.
     */
    async remember(clé, calculer) {
      const connue = this.get(clé);
      if (connue !== undefined) return connue;

      const promesse = calculer().catch((erreur) => {
        // Un échec ne doit pas rester en cache pendant toute la durée de vie.
        entries.delete(clé);
        throw erreur;
      });

      this.set(clé, promesse);
      return promesse;
    },

    clear() {
      entries.clear();
    },

    get size() {
      return entries.size;
    },
  };
}
