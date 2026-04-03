import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, Trash2, Plus, Minus, ArrowRight, 
  Clock, MapPin, ShoppingBag, Leaf, Sparkles, Tag, X
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from 'sonner';
import SmartCartSuggestions from '@/components/cart/SmartCartSuggestions';

export default function Cart() {
  const [user, setUser] = useState(null);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {
        base44.auth.redirectToLogin();
      }
    };
    loadUser();
  }, []);

  const { data: cartItems = [], isLoading } = useQuery({
    queryKey: ['cart', user?.email],
    queryFn: () => base44.entities.CartItem.filter({ user_email: user.email }),
    enabled: !!user,
  });

  const updateQuantityMutation = useMutation({
    mutationFn: ({ id, quantity }) => base44.entities.CartItem.update(id, { quantity }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id) => base44.entities.CartItem.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Article supprimé');
    },
  });

  const { data: userCoupons = [] } = useQuery({
    queryKey: ['user-coupons', user?.email],
    queryFn: () => base44.entities.Coupon.filter({ user_email: user.email, status: 'ACTIVE' }),
    enabled: !!user,
  });

  const totalAmount = cartItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  const totalSavings = cartItems.reduce((sum, item) => 
    sum + ((item.original_price - item.unit_price) * item.quantity), 0
  );

  const couponDiscount = appliedCoupon
    ? appliedCoupon.type === 'PERCENT'
      ? Math.round(totalAmount * appliedCoupon.value / 100)
      : appliedCoupon.value
    : 0;
  const finalTotal = Math.max(0, totalAmount - couponDiscount);

  const applyCoupon = () => {
    setCouponError('');
    const coupon = userCoupons.find(c => c.code.toUpperCase() === couponInput.toUpperCase());
    if (!coupon) { setCouponError('Code invalide ou déjà utilisé'); return; }
    if (new Date(coupon.valid_to) < new Date()) { setCouponError('Ce coupon a expiré'); return; }
    if (coupon.min_cart_amount && totalAmount < coupon.min_cart_amount) { setCouponError(`Minimum de commande : ${coupon.min_cart_amount.toLocaleString()} FCFA`); return; }
    setAppliedCoupon(coupon);
    toast.success(`Coupon appliqué : -${coupon.type === 'PERCENT' ? coupon.value + '%' : coupon.value.toLocaleString() + ' FCFA'}`);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="w-12 h-12 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Votre panier est vide</h2>
          <p className="text-gray-500 mb-6">Découvrez nos offres anti-gaspillage</p>
          <Link to={createPageUrl('Catalog')}>
            <Button className="bg-emerald-500 hover:bg-emerald-600">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Explorer le catalogue
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-48">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Mon panier</h1>

        {/* Savings banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-4 mb-6 text-white"
        >
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-xl p-2">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold">Vous économisez {totalSavings.toLocaleString()} FCFA</p>
              <p className="text-sm text-emerald-100">sur cette commande</p>
            </div>
          </div>
        </motion.div>

        {/* Coupon code */}
        <div className="mb-4">
          {!appliedCoupon ? (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={couponInput}
                  onChange={e => { setCouponInput(e.target.value); setCouponError(''); }}
                  placeholder="Code coupon"
                  className="w-full h-10 pl-9 pr-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                />
              </div>
              <Button onClick={applyCoupon} variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                Appliquer
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
              <Tag className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700 flex-1">
                {appliedCoupon.code} — {appliedCoupon.type === 'PERCENT' ? `-${appliedCoupon.value}%` : `-${appliedCoupon.value.toLocaleString()} FCFA`}
              </span>
              <button onClick={() => { setAppliedCoupon(null); setCouponInput(''); }} className="text-gray-400 hover:text-red-500">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {couponError && <p className="text-xs text-red-500 mt-1 pl-1">{couponError}</p>}
        </div>

        {/* Smart Cart AI */}
        {cartItems.length >= 2 && (
          <SmartCartSuggestions cartItems={cartItems} user={user} />
        )}

        {/* Cart items */}
        <div className="space-y-4">
          <AnimatePresence>
            {cartItems.map((item) => {
              const daysLeft = Math.ceil(
                (new Date(item.expiration_date) - new Date()) / (1000 * 60 * 60 * 24)
              );

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <Card className="p-4">
                    <div className="flex gap-4">
                      {/* Image */}
                      <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                        {item.product_image ? (
                          <img 
                            src={item.product_image} 
                            alt={item.product_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl">
                            🛒
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate mb-1">
                          {item.product_name}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{item.store_name}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            daysLeft <= 1 ? 'bg-red-100 text-red-600' :
                            daysLeft <= 3 ? 'bg-orange-100 text-orange-600' :
                            'bg-emerald-100 text-emerald-600'
                          }`}>
                            <Clock className="w-3 h-3 inline mr-1" />
                            {daysLeft <= 1 ? "Expire aujourd'hui" : `${daysLeft}j`}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-emerald-600">
                              {item.unit_price?.toLocaleString()} FCFA
                            </span>
                            {item.original_price > item.unit_price && (
                              <span className="ml-2 text-xs text-gray-400 line-through">
                                {item.original_price?.toLocaleString()}
                              </span>
                            )}
                          </div>

                          {/* Quantity controls */}
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                if (item.quantity <= 1) {
                                  deleteItemMutation.mutate(item.id);
                                } else {
                                  updateQuantityMutation.mutate({ 
                                    id: item.id, 
                                    quantity: item.quantity - 1 
                                  });
                                }
                              }}
                            >
                              {item.quantity <= 1 ? <Trash2 className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                            </Button>
                            <span className="w-8 text-center font-semibold">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantityMutation.mutate({ 
                                id: item.id, 
                                quantity: item.quantity + 1 
                              })}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Fixed bottom bar */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white border-t z-40">
        <div className="max-w-2xl mx-auto p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Sous-total</span>
            <span className="font-medium">{totalAmount.toLocaleString()} FCFA</span>
          </div>
          <div className="flex items-center justify-between text-sm text-emerald-600">
            <span>Économies anti-gaspi</span>
            <span className="font-medium">-{totalSavings.toLocaleString()} FCFA</span>
          </div>
          {appliedCoupon && (
            <div className="flex items-center justify-between text-sm text-purple-600">
              <span>Coupon {appliedCoupon.code}</span>
              <span className="font-medium">-{couponDiscount.toLocaleString()} FCFA</span>
            </div>
          )}
          <div className="flex items-center justify-between text-lg font-bold">
            <span>Total</span>
            <span>{finalTotal.toLocaleString()} FCFA</span>
          </div>
          <Link to={createPageUrl('Checkout')}>
            <Button className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-base">
              Passer commande
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}