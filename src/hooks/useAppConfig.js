import { useQuery } from '@tanstack/react-query';
import { api } from '@/api';

/**
 * Constantes servies par le serveur (frais de livraison, moyens de paiement,
 * paliers de fidélité). Chargées une fois, puis conservées : elles ne changent
 * qu'au déploiement.
 */
export function useAppConfig() {
  const { data } = useQuery({
    queryKey: ['app-config'],
    queryFn: () => api.config.get(),
    staleTime: Infinity,
    gcTime: Infinity,
  });
  return data ?? null;
}
