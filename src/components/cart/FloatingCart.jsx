import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingCart, X, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from 'framer-motion';

export default function FloatingCart({ userEmail }) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: cartItems = [] } = useQuery({
    queryKey: ['cart', userEmail],
    queryFn: () => base44.entities.CartItem.filter({ user_email: userEmail }),
    enabled: !!userEmail,
    refetchInterval: 5000,
  });

  const updateQty = useMutation({
    mutationFn: ({ id, quantity }) =>
      quantity <= 0
        ? base44.entities.CartItem.delete(id)
        : base44.entities.CartItem.update(id, { quantity }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart', userEmail] }),
  });

  const totalCount = cartItems.reduce((s, i) => s + (i.quantity || 1), 0);
  const totalPrice = cartItems.reduce((s, i) => s + (i.unit_price || 0) * (i.quantity || 1), 0);
  const totalSavings = cartItems.reduce((s, i) => s + ((i.original_price || 0) - (i.unit_price || 0)) * (i.quantity || 1), 0);

  if (!userEmail) return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-lg p-4 transition-all"
      >
        <ShoppingCart className="w-6 h-6" />
        {totalCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
            {totalCount}
          </span>
        )}
      </button>

      {/* Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-white z-50 flex flex-col shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-emerald-500" />
                  Mon panier ({totalCount})
                </h2>
                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cartItems.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Votre panier est vide</p>
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                      {item.product_image && (
                        <img src={item.product_image} alt={item.product_name} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{item.product_name}</p>
                        <p className="text-xs text-gray-400">{item.store_name}</p>
                        <p className="text-sm font-bold text-emerald-600 mt-0.5">
                          {((item.unit_price || 0) * (item.quantity || 1)).toLocaleString()} F
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQty.mutate({ id: item.id, quantity: (item.quantity || 1) - 1 })}
                          className="w-7 h-7 rounded-full bg-white border flex items-center justify-center hover:bg-gray-100"
                        >
                          {(item.quantity || 1) <= 1 ? <Trash2 className="w-3 h-3 text-red-400" /> : <Minus className="w-3 h-3" />}
                        </button>
                        <span className="w-6 text-center text-sm font-semibold">{item.quantity || 1}</span>
                        <button
                          onClick={() => updateQty.mutate({ id: item.id, quantity: (item.quantity || 1) + 1 })}
                          className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              {cartItems.length > 0 && (
                <div className="border-t p-4 space-y-3">
                  {totalSavings > 0 && (
                    <div className="flex justify-between text-sm text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">
                      <span>🎉 Vous économisez</span>
                      <span className="font-bold">{totalSavings.toLocaleString()} F</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-gray-900">
                    <span>Total</span>
                    <span>{totalPrice.toLocaleString()} F CFA</span>
                  </div>
                  <Link to={createPageUrl('Checkout')} onClick={() => setIsOpen(false)}>
                    <Button className="w-full bg-emerald-500 hover:bg-emerald-600 rounded-xl h-12">
                      Passer la commande
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}