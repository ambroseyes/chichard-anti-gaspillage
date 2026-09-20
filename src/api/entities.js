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

/** Taille d'une page lors d'un parcours complet. */
const PAGE = 100;

/**
 * Garde-fou d'un parcours complet. Au-delà, on ne rapatrie plus : c'est le
 * signe qu'il fallait paginer ou agréger côté serveur.
 */
const PLAFOND = 1000;

/**
 * Une lecture qui rend exactement le nombre de lignes demandé en cache
 * probablement d'autres. C'était la faille la plus coûteuse de ce code : les
 * écrans recevaient cinquante lignes, les traitaient comme « tout », et
 * affichaient des listes amputées ou des totaux faux sans que rien ne le
 * signale. L'avertissement ne coûte rien en production, où il disparaît.
 */
function signalerTroncature(name, reçues, limite, appel) {
  if (!import.meta.env.DEV || reçues !== limite) return;
  console.warn(
    `${name}.${appel}() a rendu ${limite} lignes, soit exactement la limite demandée : ` +
      `il en existe probablement d'autres. Utilisez page() pour paginer, all() pour tout ` +
      `parcourir, ou un agrégat côté serveur si c'est un total qui vous intéresse.`,
  );
}

function entityClient(name) {
  const base = `/api/entities/${name}`;

  return {
    /** Liste paginée. Renvoie un tableau : les écrans consomment directement le résultat. */
    async list(sort = '-created_date', limit = 50, offset = 0) {
      const { data } = await request(`${base}${search({ sort, limit, offset })}`);
      signalerTroncature(name, data.length, limit, 'list');
      return data;
    },

    /** Comme `list`, avec un filtre. */
    async filter(filter = {}, sort = '-created_date', limit = 50, offset = 0) {
      const { data } = await request(`${base}${search({ filter, sort, limit, offset })}`);
      signalerTroncature(name, data.length, limit, 'filter');
      return data;
    },

    /**
     * Parcourt toutes les pages et rend l'ensemble.
     *
     * À réserver aux ensembles dont on sait qu'ils restent petits — les
     * adresses d'un client, les variantes d'un produit. Pour un total ou un
     * décompte, un agrégat côté serveur est toujours préférable : il ne
     * rapatrie rien.
     */
    async all(filter = {}, sort = '-created_date', { plafond = PLAFOND } = {}) {
      const lignes = [];

      for (let offset = 0; offset < plafond; offset += PAGE) {
        const take = Math.min(PAGE, plafond - offset);
        const { data, meta } = await request(`${base}${search({ filter, sort, limit: take, offset })}`);
        lignes.push(...data);

        if (lignes.length >= (meta?.total ?? lignes.length) || data.length < take) {
          return lignes;
        }
      }

      if (import.meta.env.DEV) {
        console.warn(
          `${name}.all() s'est arrêté au plafond de ${plafond} lignes. ` +
            `Cet ensemble n'est pas borné : il lui faut une pagination ou un agrégat serveur.`,
        );
      }
      return lignes;
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
