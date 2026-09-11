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

/**
 * L'assistance IA est-elle activée sur cette instance ?
 *
 * Le serveur l'annonce dans /api/config. Sans cette vérification, les écrans
 * appellent une IA absente et récoltent un 503 : un aller-retour réseau pour
 * rien, et une erreur dans la console à chaque chargement.
 */
export function useAiEnabled() {
  const config = useAppConfig();
  return Boolean(config?.features?.ai);
}
