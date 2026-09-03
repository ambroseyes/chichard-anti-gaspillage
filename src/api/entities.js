import { request } from './http';

/**
 * Accès aux entités.
 *
 * `api.entities.Product.filter({ status: 'active' }, '-created_date', 20)`
 * appelle `/api/entities/Product`. Les droits sont appliqués par le serveur :
 * une requête peut légitimement revenir vide, ce n'est pas une erreur.
 */

const search = (params) => {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    query.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
  }
  const s = query.toString();
  return s ? `?${s}` : '';
};

function entityClient(name) {
  const base = `/api/entities/${name}`;

  return {
    /** Liste paginée. Renvoie un tableau : les écrans consomment directement le résultat. */
    async list(sort = '-created_date', limit = 50, offset = 0) {
      const { data } = await request(`${base}${search({ sort, limit, offset })}`);
      return data;
    },

    /** Comme `list`, avec un filtre. */
    async filter(filter = {}, sort = '-created_date', limit = 50, offset = 0) {
      const { data } = await request(`${base}${search({ filter, sort, limit, offset })}`);
      return data;
    },

    /** Variante renvoyant aussi le total, pour les tableaux paginés. */
    async page({ filter, sort = '-created_date', limit = 50, offset = 0 } = {}) {
      return request(`${base}${search({ filter, sort, limit, offset })}`);
    },

    async get(id) {
      const { data } = await request(`${base}/${id}`);
      return data;
    },

    async create(payload) {
      const { data } = await request(base, { method: 'POST', body: payload });
      return data;
    },

    async update(id, payload) {
      const { data } = await request(`${base}/${id}`, { method: 'PATCH', body: payload });
      return data;
    },

    async delete(id) {
      await request(`${base}/${id}`, { method: 'DELETE' });
      return { id };
    },
  };
}

/** Les noms d'entités sont créés à la demande : pas de liste à maintenir ici. */
export const entities = new Proxy(
  {},
  {
    get(cache, name) {
      if (typeof name !== 'string') return undefined;
      cache[name] ??= entityClient(name);
      return cache[name];
    },
  },
);
