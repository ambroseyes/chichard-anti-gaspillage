import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api';

/** Critères multivalués, transportés en « a,b,c » dans l'URL comme dans l'API. */
const LISTS = ['category', 'brand', 'store'];

export const DEFAULT_CRITERIA = {
  q: '',
  category: [],
  brand: [],
  store: [],
  price_min: '',
  price_max: '',
  expires: '',
  min_rating: '',
  verified: false,
  sort: 'relevance',
  page: 1,
};

/**
 * État de la recherche catalogue, stocké dans l'URL.
 *
 * Conséquence voulue : une page de résultats se partage, se met en favori et
 * répond au bouton « retour ». Un filtre rangé dans un `useState` ne fait
 * aucune des trois.
 */
export function useCatalogSearch() {
  const [params, setParams] = useSearchParams();
  const serialized = params.toString();

  const criteria = useMemo(() => {
    const current = new URLSearchParams(serialized);
    const read = (key) => current.get(key) ?? '';
    return {
      q: read('q'),
      category: splitList(read('category')),
      brand: splitList(read('brand')),
      store: splitList(read('store')),
      price_min: read('price_min'),
      price_max: read('price_max'),
      expires: read('expires'),
      min_rating: read('min_rating'),
      verified: read('verified') === '1',
      sort: read('sort') || DEFAULT_CRITERIA.sort,
      page: Math.max(1, Number(read('page')) || 1),
    };
  }, [serialized]);

  /**
   * Applique des changements de critères.
   *
   * Tout changement autre que la page ramène à la page 1 : rester sur la
   * page 4 après avoir coché un rayon affiche un vide alors qu'il y a des
   * résultats.
   */
  const update = useCallback(
    (patch, { keepPage = false } = {}) => {
      const next = new URLSearchParams(serialized);
      for (const [key, value] of Object.entries(patch)) {
        const encoded = Array.isArray(value) ? value.join(',') : value === true ? '1' : value;
        if (encoded === '' || encoded === false || encoded === null || encoded === undefined) {
          next.delete(key);
        } else {
          next.set(key, String(encoded));
        }
      }
      if (!keepPage && !('page' in patch)) next.delete('page');
      setParams(next, { replace: false });
    },
    [serialized, setParams],
  );

  /** Coche ou décoche une valeur dans une facette à choix multiple. */
  const toggle = useCallback(
    (key, value) => {
      if (!LISTS.includes(key)) return;
      const current = criteria[key];
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      update({ [key]: next });
    },
    [criteria, update],
  );

  const reset = useCallback(() => {
    // Le mot cherché survit à « effacer les filtres » : on efface des filtres,
    // pas la recherche de l'utilisateur.
    const next = new URLSearchParams();
    if (criteria.q) next.set('q', criteria.q);
    setParams(next);
  }, [criteria.q, setParams]);

  const query = useQuery({
    queryKey: ['catalog-search', serialized],
    queryFn: () => api.catalog.search(criteria),
    placeholderData: (previous) => previous,
    staleTime: 30_000,
  });

  const activeFilterCount =
    criteria.category.length +
    criteria.brand.length +
    criteria.store.length +
    (criteria.expires ? 1 : 0) +
    (criteria.price_min || criteria.price_max ? 1 : 0) +
    (criteria.min_rating ? 1 : 0) +
    (criteria.verified ? 1 : 0);

  return { criteria, update, toggle, reset, activeFilterCount, ...query };
}

function splitList(value) {
  return value ? value.split(',').filter(Boolean) : [];
}
