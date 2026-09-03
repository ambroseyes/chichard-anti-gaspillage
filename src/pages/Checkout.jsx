import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api';
import { useAuth } from '@/lib/AuthContext';
import { formatXAF } from '@/lib/format';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Banknote, 
  CheckCircle, Store, Truck
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [deliveryType, setDeliveryType] = useState('pickup');
  const [paymentMethod, setPaymentMethod] = useState('orange_money');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [couponCode, setCouponCode] = useState('');

  useEffect(() => {
    if (!user) return;
    setPhone((p) => p || user.phone || '');
    setAddress((a) => a || user.address || '');
  }, [user]);

  const { data: cartItems = [] } = useQuery({
    queryKey: ['cart', user?.email],
    queryFn: () => api.entities.CartItem.filter({ user_email: user.email }, '-created_date', 100),
    enabled: Boolean(user),
  });

  /**
   * Le devis est calculé par le serveur, avec les prix du catalogue, le coupon
   * et les frais de livraison. C'est exactement le montant qui sera facturé :
   * l'écran n'annonce plus un total que le paiement ignorerait.
   */
  const { data: quote, isFetching: quoting } = useQuery({
    queryKey: ['order-quote', user?.email, deliveryType, couponCode],
    queryFn: () => api.orders.quote({ delivery_type: deliveryType, coupon_code: couponCode || null }),
    enabled: Boolean(user) && cartItems.length > 0,
    placeholderData: (previous) => previous,
  });

  const checkout = useMutation({
    mutationFn: () =>
      api.orders.create({
        delivery_type: deliveryType,
        payment_method: paymentMethod,
        delivery_address: deliveryType === 'delivery' ? address : undefined,
        customer_phone: phone,
        coupon_code: couponCode || undefined,
      }),
    onSuccess: ({ order, confirmation_code: code, pickup_token: token, payment }) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });

      toast.success(
        payment?.status === 'succeeded'
          ? 'Commande payée et confirmée'
          : 'Commande enregistrée — validez le paiement sur votre téléphone',
      );
      navigate(
        `/OrderConfirmation?commande=${order.id}&code=${encodeURIComponent(code)}&jeton=${encodeURIComponent(token)}`,
        { replace: true },
      );
    },
    onError: (error) => {
      const indisponibles = error?.details?.unavailable;
      if (indisponibles?.length) {
        toast.error(
          `Plus disponible : ${indisponibles.map((i) => i.product_name ?? i.product_id).join(', ')}`,
        );
        queryClient.invalidateQueries({ queryKey: ['cart'] });
        return;
      }
      toast.error(error.message ?? "La commande n'a pas abouti");
    },
  });

  const handleSubmit = () => {
    if (!phone.trim()) {
      toast.error('Renseignez votre numéro de téléphone');
      return;
    }
    if (deliveryType === 'delivery' && !address.trim()) {
      toast.error('Renseignez votre adresse de livraison');
      return;
    }
    checkout.mutate();
  };

  const totalAmount = quote?.total ?? 0;
  const totalSavings = quote?.savings ?? 0;
  const isProcessing = checkout.isPending;

  if (!user || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-white border-b sticky top-14 md:top-16 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">Finaliser la commande</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Order Summary */}
        <Card className="p-4">
          <h2 className="font-semibold mb-4">Résumé de la commande</h2>
          <div className="space-y-3">
            {cartItems.map(item => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                  {item.product_image ? (
                    <img src={item.product_image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">🛒</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.product_name}</p>
                  <p className="text-sm text-gray-500">x{item.quantity}</p>
                </div>
                <p className="font-medium">{formatXAF(item.unit_price * item.quantity)}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Sous-total</span>
              <span>{formatXAF(quote?.subtotal ?? 0)}</span>
            </div>
            {totalSavings > 0 && (
              <div className="flex justify-between text-sm text-emerald-600">
                <span>Économies anti-gaspillage</span>
                <span>−{formatXAF(totalSavings)}</span>
              </div>
            )}
            {quote?.discount > 0 && (
              <div className="flex justify-between text-sm text-emerald-600">
                <span>Code promo {quote.coupon_applied}</span>
                <span>−{formatXAF(quote.discount)}</span>
              </div>
            )}
            {quote?.deliveryFee > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Livraison</span>
                <span>{formatXAF(quote.deliveryFee)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total</span>
              <span>{quoting ? '…' : formatXAF(totalAmount)}</span>
            </div>
          </div>

          {/* Code promo : la validité et le montant sont tranchés par le serveur. */}
          <div className="mt-4 pt-4 border-t">
            <Label htmlFor="coupon">Code promo</Label>
            <Input
              id="coupon"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="ECO-XXXXXX"
              className="mt-1.5 uppercase"
            />
            {quote?.couponError && <p className="text-sm text-red-600 mt-1.5">{quote.couponError}</p>}
            {quote?.coupon_applied && !quote.couponError && (
              <p className="text-sm text-emerald-600 mt-1.5">Code {quote.coupon_applied} appliqué.</p>
            )}
          </div>
        </Card>

        {/* Delivery Options */}
        <Card className="p-4">
          <h2 className="font-semibold mb-4">Mode de récupération</h2>
          <RadioGroup value={deliveryType} onValueChange={setDeliveryType}>
            <div className="space-y-3">
              <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                deliveryType === 'pickup' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'
              }`}>
                <RadioGroupItem value="pickup" />
                <Store className="w-5 h-5 text-gray-500" />
                <div className="flex-1">
                  <p className="font-medium">Retrait en magasin</p>
                  <p className="text-sm text-gray-500">Gratuit — prêt sous 1 h</p>
                </div>
              </label>
              <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                deliveryType === 'delivery' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'
              }`}>
                <RadioGroupItem value="delivery" />
                <Truck className="w-5 h-5 text-gray-500" />
                <div className="flex-1">
                  <p className="font-medium">Livraison à domicile</p>
                  <p className="text-sm text-gray-500">
                    {quote?.deliveryFee ? `${formatXAF(quote.deliveryFee)} — sous 24 h` : 'Sous 24 h'}
                  </p>
                </div>
              </label>
            </div>
          </RadioGroup>

          {deliveryType === 'delivery' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 space-y-3"
            >
              <Label>Adresse de livraison</Label>
              <Textarea 
                placeholder="Votre adresse complète..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </motion.div>
          )}
        </Card>

        {/* Contact */}
        <Card className="p-4">
          <h2 className="font-semibold mb-4">Contact</h2>
          <div className="space-y-3">
            <div>
              <Label>Numéro de téléphone</Label>
              <Input 
                placeholder="6XX XX XX XX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Payment */}
        <Card className="p-4">
          <h2 className="font-semibold mb-4">Mode de paiement</h2>
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
            <div className="space-y-3">
              <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                paymentMethod === 'orange_money' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'
              }`}>
                <RadioGroupItem value="orange_money" />
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold">
                  OM
                </div>
                <span className="font-medium">Orange Money</span>
              </label>
              <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                paymentMethod === 'mtn_money' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'
              }`}>
                <RadioGroupItem value="mtn_money" />
                <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center text-white font-bold">
                  MTN
                </div>
                <span className="font-medium">MTN Mobile Money</span>
              </label>
              <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                paymentMethod === 'cash' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'
              }`}>
                <RadioGroupItem value="cash" />
                <Banknote className="w-10 h-10 p-2 bg-gray-100 rounded-lg text-gray-500" />
                <span className="font-medium">Paiement à la livraison</span>
              </label>
            </div>
          </RadioGroup>
        </Card>
      </div>

      {/* Fixed bottom */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white border-t z-40">
        <div className="max-w-2xl mx-auto p-4">
          <Button
            onClick={handleSubmit}
            disabled={isProcessing}
            className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-base"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Traitement...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Confirmer • {formatXAF(totalAmount)}
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}