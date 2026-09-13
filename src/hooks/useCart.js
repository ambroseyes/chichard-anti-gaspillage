import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api';
import { useAuth } from '@/lib/AuthContext';
import { goToLogin } from '@/lib/navigation';
import { EMPTY_ARRAY } from '@/lib/stable';

/**
 * Panier de l'utilisateur connecté.
 *
 * Chaque écran ajoutait au panier avec sa propre copie de la logique (relire
 * la ligne existante, incrémenter ou créer, rafraîchir). Une seule copie ici :
 * l'en-tête, le catalogue et la fiche produit voient toujours le même panier
 * au même instant.
 */
export function useCart() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const key = ['cart', user?.email];

  const { data: items = EMPTY_ARRAY, isLoading } = useQuery({
    queryKey: key,
    queryFn: () => api.entities.CartItem.filter({ user_email: user.email }, '-created_date', 100),
    enabled: Boolean(user),
  });

  const refresh = useCallback(() => queryClient.invalidateQueries({ queryKey: key }), [queryClient, user?.email]); // eslint-disable-line react-hooks/exhaustive-deps

  const add = useMutation({
    mutationFn: async ({ product, quantity = 1 }) => {
      const existing = await api.entities.CartItem.filter({
        user_email: user.email,
        product_id: product.id,
      });

      if (existing.length > 0) {
        return api.entities.CartItem.update(existing[0].id, {
          quantity: (existing[0].quantity || 1) + quantity,
        });
      }

      return api.entities.CartItem.create({
        user_email: user.email,
        product_id: product.id,
        product_name: product.name,
        product_image: product.image_url,
        quantity,
        unit_price: product.discounted_price,
        original_price: product.original_price,
        store_name: product.store_name,
        expiration_date: product.expiration_date,
      });
    },
    onSuccess: refresh,
  });

  const setQuantity = useMutation({
    mutationFn: ({ id, quantity }) =>
      quantity <= 0
        ? api.entities.CartItem.delete(id)
        : api.entities.CartItem.update(id, { quantity }),
    onSuccess: refresh,
  });

  const remove = useMutation({
    mutationFn: (id) => api.entities.CartItem.delete(id),
    onSuccess: refresh,
  });

  const totals = useMemo(() => {
    let count = 0;
    let subtotal = 0;
    let savings = 0;
    for (const item of items) {
      const quantity = item.quantity || 1;
      count += quantity;
      subtotal += (item.unit_price || 0) * quantity;
      savings += Math.max(0, (item.original_price || 0) - (item.unit_price || 0)) * quantity;
    }
    return { count, subtotal, savings };
  }, [items]);

  /**
   * Ajout depuis un bouton : un visiteur non connecté part se connecter au
   * lieu de voir l'ajout échouer en silence.
   */
  const addToCart = useCallback(
    (product, quantity = 1) => {
      if (!user) {
        goToLogin();
        return false;
      }
      add.mutate({ product, quantity });
      return true;
    },
    [user, add],
  );

  return {
    items,
    isLoading,
    ...totals,
    addToCart,
    isAdding: add.isPending,
    setQuantity: (id, quantity) => setQuantity.mutate({ id, quantity }),
    remove: (id) => remove.mutate(id),
  };
}
