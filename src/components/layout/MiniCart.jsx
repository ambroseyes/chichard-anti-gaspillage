import React from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { formatXAF, expiryLabel } from '@/lib/format';
import { useCart } from '@/hooks/useCart';

/**
 * Panier en tiroir.
 *
 * Après un ajout, l'utilisateur doit voir ce qu'il a mis et combien ça coûte
 * sans quitter la page où il faisait ses courses.
 */
export default function MiniCart({ open, onOpenChange }) {
  const { items, count, subtotal, savings, setQuantity, remove } = useCart();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="px-5 py-4 border-b">
          <SheetTitle className="flex items-center gap-2 text-left">
            <ShoppingCart className="w-5 h-5 text-emerald-600" />
            Mon panier
            <span className="text-sm font-normal text-gray-500">
              ({count} article{count > 1 ? 's' : ''})
            </span>
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 grid place-items-center px-6 text-center">
            <div>
              <div className="w-16 h-16 rounded-full bg-gray-100 grid place-items-center mx-auto mb-4">
                <ShoppingCart className="w-8 h-8 text-gray-400" />
              </div>
              <p className="font-medium text-gray-900 mb-1">Votre panier est vide</p>
              <p className="text-sm text-gray-500 mb-4">
                Chaque article sauvé, c'est un repas qui ne part pas à la poubelle.
              </p>
              <Button asChild onClick={() => onOpenChange(false)}>
                <Link to={createPageUrl('Catalog')}>Parcourir le catalogue</Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto divide-y">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3 p-4">
                  {item.product_image ? (
                    <img
                      src={item.product_image}
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover bg-gray-100 shrink-0"
                    />
                  ) : (
                    <span className="w-16 h-16 rounded-lg bg-gray-100 grid place-items-center text-2xl shrink-0">
                      🛒
                    </span>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">{item.product_name}</p>
                    <p className="text-xs text-gray-500">{item.store_name}</p>
                    {item.expiration_date && (
                      <p className="text-xs text-orange-600">{expiryLabel(item.expiration_date)}</p>
                    )}

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border rounded-md">
                        <button
                          type="button"
                          aria-label={`Retirer un ${item.product_name}`}
                          onClick={() => setQuantity(item.id, (item.quantity || 1) - 1)}
                          className="px-2 py-1 text-gray-500 hover:text-gray-900"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2 text-sm tabular-nums">{item.quantity || 1}</span>
                        <button
                          type="button"
                          aria-label={`Ajouter un ${item.product_name}`}
                          onClick={() => setQuantity(item.id, (item.quantity || 1) + 1)}
                          className="px-2 py-1 text-gray-500 hover:text-gray-900"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatXAF((item.unit_price || 0) * (item.quantity || 1))}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    aria-label={`Supprimer ${item.product_name} du panier`}
                    onClick={() => remove(item.id)}
                    className="self-start p-1 text-gray-300 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>

            <div className="border-t p-5 space-y-3 bg-gray-50">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Sous-total</span>
                <span className="font-semibold">{formatXAF(subtotal)}</span>
              </div>
              {/* Les économies comparent au prix d'origine : ce n'est pas une
                  déduction du sous-total. Alignée avec les autres lignes et
                  précédée d'un moins, elle donnait l'impression qu'on
                  retranchait 900 FCFA d'un sous-total de 850. */}
              {savings > 0 && (
                <p className="text-sm text-emerald-700 bg-emerald-50 rounded-md px-2.5 py-1.5">
                  Vous économisez <strong>{formatXAF(savings)}</strong> par rapport au prix d'origine.
                </p>
              )}
              <p className="text-xs text-gray-500">
                Livraison et remises calculées à l'étape suivante.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" asChild onClick={() => onOpenChange(false)}>
                  <Link to={createPageUrl('Cart')}>Voir le panier</Link>
                </Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700" asChild onClick={() => onOpenChange(false)}>
                  <Link to={createPageUrl('Checkout')}>Commander</Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
