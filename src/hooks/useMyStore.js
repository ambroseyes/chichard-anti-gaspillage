import { useQuery } from '@tanstack/react-query';
import { api } from '@/api';
import { useAuth } from '@/lib/AuthContext';

/**
 * Le magasin du partenaire connecté.
 *
 * Les écrans partenaire filtraient leurs produits sur `created_by` : ils ne
 * voyaient donc que ce que le propriétaire avait saisi lui-même, et rataient
 * tout ce qu'un employé avait ajouté. Le bon critère est le magasin.
 */
export function useMyStore() {
  const { user } = useAuth();

  const { data: store = null, isLoading } = useQuery({
    queryKey: ['store', 'mine', user?.email, user?.store_id],
    queryFn: async () => {
      if (user.store_id) {
        const parId = await api.entities.Store.filter({ id: user.store_id });
        if (parId[0]) return parId[0];
      }
      const possedes = await api.entities.Store.filter({ owner_email: user.email });
      return possedes[0] ?? null;
    },
    enabled: Boolean(user?.store_id || user?.email),
    staleTime: 5 * 60 * 1000,
  });

  return { store, storeId: store?.id ?? null, isLoading };
}
