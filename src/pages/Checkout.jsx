import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, MapPin, CreditCard, Smartphone, Banknote, 
  CheckCircle, Store, Truck, Leaf
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
  const [user, setUser] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [deliveryType, setDeliveryType] = useState('pickup');
  const [paymentMethod, setPaymentMethod] = useState('orange_money');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        setPhone(userData.phone || '');
        setAddress(userData.address || '');
      } catch (e) {
        base44.auth.redirectToLogin();
      }
    };
    loadUser();
  }, []);

  const { data: cartItems = [] } = useQuery({
    queryKey: ['cart', user?.email],
    queryFn: () => base44.entities.CartItem.filter({ user_email: user.email }),
    enabled: !!user,
  });

  const totalAmount = cartItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  const totalSavings = cartItems.reduce((sum, item) => 
    sum + ((item.original_price - item.unit_price) * item.quantity), 0
  );

  const handleSubmit = async () => {
    if (!phone) {
      toast.error('Veuillez entrer votre numéro de téléphone');
      return;
    }
    if (deliveryType === 'delivery' && !address) {
      toast.error('Veuillez entrer votre adresse de livraison');
      return;
    }

    setIsProcessing(true);

    // Create order
    const order = await base44.entities.Order.create({
      customer_email: user.email,
      customer_name: user.full_name,
      items: cartItems.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        store_name: item.store_name
      })),
      total_amount: totalAmount,
      total_savings: totalSavings,
      status: 'pending',
      payment_method: paymentMethod,
      delivery_type: deliveryType,
      delivery_address: deliveryType === 'delivery' ? address : null,
      store_name: cartItems[0]?.store_name
    });

    // Update user stats
    await base44.auth.updateMe({
      phone,
      address: deliveryType === 'delivery' ? address : user.address,
      total_savings: (user.total_savings || 0) + totalSavings,
      total_orders: (user.total_orders || 0) + 1,
      waste_avoided_kg: (user.waste_avoided_kg || 0) + (cartItems.length * 0.5)
    });

    // Clear cart
    for (const item of cartItems) {
      await base44.entities.CartItem.delete(item.id);
    }

    // Send confirmation email
    const itemsHtml = cartItems.map(item =>
      `<tr>
        <td style="padding:6px 0;border-bottom:1px solid #f3f4f6">${item.product_name} x${item.quantity}</td>
        <td style="padding:6px 0;border-bottom:1px solid #f3f4f6;text-align:right">${(item.unit_price * item.quantity).toLocaleString()} FCFA</td>
      </tr>`
    ).join('');

    const paymentLabels = {
      orange_money: 'Orange Money',
      mtn_money: 'MTN Mobile Money',
      cash: 'Paiement à la livraison',
    };

    await base44.integrations.Core.SendEmail({
      to: user.email,
      subject: `✅ Commande confirmée #${order.id.slice(0, 8)} — Chichard`,
      body: `
        <div style="font-family:sans-serif;max-width:560px;margin:auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
          <div style="background:linear-gradient(135deg,#10b981,#0d9488);padding:32px 24px;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:24px">🌿 Chichard</h1>
            <p style="color:#d1fae5;margin:8px 0 0">Merci pour votre commande !</p>
          </div>
          <div style="padding:28px 24px">
            <p style="color:#374151;font-size:15px">Bonjour <strong>${user.full_name}</strong>,</p>
            <p style="color:#6b7280;font-size:14px">Votre commande <strong>#${order.id.slice(0, 8)}</strong> a bien été reçue. En achetant des produits anti-gaspillage, vous avez contribué à sauver la planète ! 🌍</p>

            <div style="background:#f9fafb;border-radius:12px;padding:16px;margin:20px 0">
              <h2 style="font-size:15px;color:#111827;margin:0 0 12px">Détail de la commande</h2>
              <table style="width:100%;font-size:14px;color:#374151">
                ${itemsHtml}
                <tr>
                  <td style="padding:10px 0 4px;color:#10b981;font-weight:600">Économies réalisées</td>
                  <td style="padding:10px 0 4px;color:#10b981;font-weight:600;text-align:right">-${totalSavings.toLocaleString()} FCFA</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-weight:700;font-size:16px;color:#111827">Total payé</td>
                  <td style="padding:6px 0;font-weight:700;font-size:16px;color:#111827;text-align:right">${totalAmount.toLocaleString()} FCFA</td>
                </tr>
              </table>
            </div>

            <div style="display:flex;gap:12px;margin:20px 0">
              <div style="flex:1;background:#ecfdf5;border-radius:10px;padding:12px;text-align:center">
                <p style="margin:0;font-size:12px;color:#6b7280">Mode de récupération</p>
                <p style="margin:4px 0 0;font-weight:600;color:#065f46;font-size:13px">${deliveryType === 'pickup' ? '🏪 Retrait en magasin' : '🚚 Livraison à domicile'}</p>
              </div>
              <div style="flex:1;background:#eff6ff;border-radius:10px;padding:12px;text-align:center">
                <p style="margin:0;font-size:12px;color:#6b7280">Paiement</p>
                <p style="margin:4px 0 0;font-weight:600;color:#1e40af;font-size:13px">${paymentLabels[paymentMethod] || paymentMethod}</p>
              </div>
            </div>

            ${deliveryType === 'delivery' && address ? `<p style="color:#6b7280;font-size:13px">📍 Livraison à : <strong>${address}</strong></p>` : ''}

            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px;margin-top:16px;text-align:center">
              <p style="margin:0;color:#065f46;font-size:13px">🌱 Vous avez évité environ <strong>${(cartItems.length * 0.5).toFixed(1)} kg de CO₂</strong> avec cette commande. Merci !</p>
            </div>

            <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:24px">Chichard — La plateforme anti-gaspillage 🌍</p>
          </div>
        </div>
      `
    });

    setIsProcessing(false);
    toast.success('Commande confirmée ! Un email de confirmation vous a été envoyé.');
    navigate(createPageUrl('Orders'));
  };

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
                <p className="font-medium">{(item.unit_price * item.quantity).toLocaleString()} FCFA</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between text-emerald-600 mb-2">
              <span>Économies</span>
              <span>-{totalSavings.toLocaleString()} FCFA</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{totalAmount.toLocaleString()} FCFA</span>
            </div>
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
                  <p className="text-sm text-gray-500">Gratuit • Prêt en 1h</p>
                </div>
              </label>
              <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                deliveryType === 'delivery' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'
              }`}>
                <RadioGroupItem value="delivery" />
                <Truck className="w-5 h-5 text-gray-500" />
                <div className="flex-1">
                  <p className="font-medium">Livraison à domicile</p>
                  <p className="text-sm text-gray-500">1 000 FCFA • Sous 24h</p>
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
                Confirmer • {totalAmount.toLocaleString()} FCFA
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}