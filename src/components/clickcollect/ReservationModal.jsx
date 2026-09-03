import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ShoppingBag, Clock, MapPin, CreditCard, CheckCircle2, Leaf } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const PAYMENT_METHODS = [
  { id: 'orange_money', label: 'Orange Money', icon: '🟠', color: 'border-orange-300 bg-orange-50' },
  { id: 'mtn_money', label: 'MTN Money', icon: '🟡', color: 'border-yellow-300 bg-yellow-50' },
  { id: 'card', label: 'Carte bancaire', icon: '💳', color: 'border-blue-300 bg-blue-50' },
  { id: 'cash_on_pickup', label: 'Espèces au retrait', icon: '💵', color: 'border-gray-300 bg-gray-50' },
];

export default function ReservationModal({ basket, user, open, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const qc = useQueryClient();

  const remaining = (basket?.quantity_available || 0) - (basket?.quantity_reserved || 0);
  const totalAmount = (basket?.discounted_price || 0) * quantity;
  const savings = ((basket?.original_price || 0) - (basket?.discounted_price || 0)) * quantity;

  const [confirmationCode, setConfirmationCode] = useState(null);

  /**
   * Le serveur réserve le panier de façon atomique, fixe le prix, ouvre le
   * paiement et renvoie le code de retrait — qu'il ne conserve ensuite que sous
   * forme de condensat. C'est la seule fois où ce code est visible.
   */
  const { mutate: createReservation, isPending } = useMutation({
    mutationFn: () =>
      api.reservations.create({
        basket_id: basket.id,
        pickup_slot: selectedSlot,
        quantity,
        payment_method: paymentMethod,
        customer_phone: phone,
      }),
    onSuccess: (data) => {
      setConfirmationCode(data.confirmation_code);
      qc.invalidateQueries({ queryKey: ['cc-baskets'] });
      qc.invalidateQueries({ queryKey: ['my-reservations'] });
      setStep(3);
      onSuccess?.(data);
    },
    onError: (error) => toast.error(error.message ?? "La réservation n'a pas abouti"),
  });

  const handleClose = () => {
    setStep(1);
    setSelectedSlot('');
    setQuantity(1);
    setPaymentMethod('');
    setConfirmationCode(null);
    onClose();
  };

  if (!basket) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        {step < 3 && (
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-500" />
              {step === 1 ? 'Choisir un créneau' : 'Paiement sécurisé'}
            </DialogTitle>
          </DialogHeader>
        )}

        {/* Step 1 — Slot & Quantity */}
        {step === 1 && (
          <div className="space-y-5">
            {/* Basket summary */}
            <div className="flex gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              {basket.image_url ? (
                <img src={basket.image_url} className="w-16 h-16 rounded-lg object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-emerald-100 flex items-center justify-center text-2xl">🛒</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{basket.name}</p>
                <p className="text-xs text-gray-500">{basket.store_name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-bold text-emerald-700">{basket.discounted_price.toLocaleString()} F</span>
                  <span className="text-xs line-through text-gray-400">{basket.original_price.toLocaleString()} F</span>
                </div>
              </div>
            </div>

            {/* Pickup date */}
            <div>
              <Label className="text-sm font-medium mb-2 flex items-center gap-1">
                <Clock className="w-4 h-4 text-emerald-500" /> Date de retrait
              </Label>
              <div className="p-3 bg-gray-50 rounded-lg text-sm font-medium text-gray-700">
                📅 {format(new Date(basket.pickup_date), 'EEEE dd MMMM yyyy', { locale: fr })}
              </div>
            </div>

            {/* Slot selection */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Créneau horaire</Label>
              <div className="grid grid-cols-2 gap-2">
                {(basket.pickup_slots || []).map(slot => (
                  <button
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                      selectedSlot === slot
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 hover:border-emerald-300'
                    }`}
                  >
                    ⏰ {slot}
                  </button>
                ))}
                {(!basket.pickup_slots || basket.pickup_slots.length === 0) && (
                  <p className="text-sm text-gray-400 col-span-2">Pas de créneau défini par le partenaire</p>
                )}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Quantité (max {remaining})</Label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-lg font-bold hover:bg-gray-50"
                >−</button>
                <span className="text-lg font-bold w-8 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => Math.min(remaining, q + 1))}
                  className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-lg font-bold hover:bg-gray-50"
                >+</button>
              </div>
            </div>

            {/* Address */}
            <div className="flex items-start gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <span>{basket.store_address || basket.store_name}</span>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <span className="font-medium">Total à payer</span>
              <div className="text-right">
                <span className="text-xl font-bold text-emerald-700">{totalAmount.toLocaleString()} F</span>
                <p className="text-xs text-emerald-600">🌿 Vous économisez {savings.toLocaleString()} F</p>
              </div>
            </div>

            <Button
              className="w-full bg-emerald-500 hover:bg-emerald-600"
              disabled={!selectedSlot && basket.pickup_slots?.length > 0}
              onClick={() => setStep(2)}
            >
              Continuer vers le paiement
            </Button>
          </div>
        )}

        {/* Step 2 — Payment */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <Label className="text-sm font-medium mb-3 flex items-center gap-1">
                <CreditCard className="w-4 h-4 text-emerald-500" /> Mode de paiement
              </Label>
              <div className="space-y-2">
                {PAYMENT_METHODS.map(pm => (
                  <button
                    key={pm.id}
                    onClick={() => setPaymentMethod(pm.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                      paymentMethod === pm.id ? pm.color + ' border-opacity-100' : 'border-gray-100 hover:border-gray-200'
                    } ${paymentMethod === pm.id ? 'border-2' : 'border'}`}
                  >
                    <span className="text-2xl">{pm.icon}</span>
                    <span className="font-medium">{pm.label}</span>
                    {paymentMethod === pm.id && <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-auto" />}
                  </button>
                ))}
              </div>
            </div>

            {(paymentMethod === 'orange_money' || paymentMethod === 'mtn_money') && (
              <div>
                <Label className="text-sm mb-1 block">Numéro de téléphone Mobile Money</Label>
                <Input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="6XX XX XX XX"
                />
                <p className="text-xs text-gray-400 mt-1">Vous recevrez une demande de confirmation sur ce numéro</p>
              </div>
            )}

            {/* Order recap */}
            <div className="p-4 bg-gray-50 rounded-xl space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Panier × {quantity}</span>
                <span>{totalAmount.toLocaleString()} F</span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>Économies</span>
                <span>-{savings.toLocaleString()} F</span>
              </div>
              {basket.co2_saved_kg && (
                <div className="flex justify-between text-green-600">
                  <span className="flex items-center gap-1"><Leaf className="w-3 h-3" /> CO₂ évité</span>
                  <span>{(basket.co2_saved_kg * quantity).toFixed(2)} kg</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-bold text-gray-900">
                <span>Total</span>
                <span>{totalAmount.toLocaleString()} F</span>
              </div>
              <div className="text-xs text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Retrait : {basket.pickup_date} · {selectedSlot}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Retour</Button>
              <Button
                className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                disabled={!paymentMethod || isPending}
                onClick={() => createReservation()}
              >
                {isPending ? 'Confirmation...' : '✅ Confirmer et payer'}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 — Success */}
        {step === 3 && (
          <div className="text-center py-6 space-y-4">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Réservation confirmée !</h2>
            <p className="text-gray-500 text-sm">
              Présentez votre code de confirmation au magasin lors du retrait.
            </p>
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <p className="text-xs text-gray-500 mb-1">Code de confirmation</p>
              <p className="text-3xl font-mono font-bold text-emerald-700 tracking-widest">
                {confirmationCode ?? '—'}
              </p>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p>📅 {format(new Date(basket.pickup_date), 'dd MMMM yyyy', { locale: fr })} · {selectedSlot}</p>
              <p>📍 {basket.store_name}</p>
              <p className="text-emerald-600">🌿 {((basket.co2_saved_kg || 0) * quantity).toFixed(2)} kg CO₂ évité</p>
            </div>
            <Button className="w-full bg-emerald-500 hover:bg-emerald-600" onClick={handleClose}>
              Fermer
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}