import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Banknote,
  Check,
  CreditCard,
  Loader2,
  Lock,
  Pencil,
  Phone,
  ShieldCheck,
  Store,
  Truck,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/lib/AuthContext';
import { formatXAF } from '@/lib/format';
import { useAppConfig } from '@/hooks/useAppConfig';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Breadcrumbs from '@/components/layout/Breadcrumbs';

const STEPS = [
  { id: 1, label: 'Livraison' },
  { id: 2, label: 'Paiement' },
  { id: 3, label: 'Validation' },
];

/**
 * Tunnel de commande.
 *
 * Une étape à la fois à gauche, le récapitulatif toujours visible à droite.
 * Les montants affichés sont ceux que le serveur a calculés — l'écran ne
 * refait aucune addition de son côté, donc il ne peut pas annoncer un total
 * différent de celui qui sera prélevé.
 */
export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const appConfig = useAppConfig();
  const queryClient = useQueryClient();
  const { items: cartItems, isLoading: cartLoading } = useCart();

  const [step, setStep] = useState(1);
  const [deliveryType, setDeliveryType] = useState('pickup');
  const [paymentMethod, setPaymentMethod] = useState('orange_money');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [couponCode, setCouponCode] = useState('');

  useEffect(() => {
    if (!user) return;
    setPhone((value) => value || user.phone || '');
    setAddress((value) => value || user.address || '');
  }, [user]);

  /**
   * Le devis est calculé par le serveur, avec les prix du catalogue, le coupon
   * et les frais de livraison. C'est exactement le montant qui sera facturé.
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

  if (cartLoading) return <CheckoutSkeleton />;

  if (!user || cartItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Votre panier est vide</h1>
        <p className="text-sm text-gray-500 mb-6">Ajoutez des articles avant de passer commande.</p>
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
          <Link to={createPageUrl('Catalog')}>Parcourir le catalogue</Link>
        </Button>
      </div>
    );
  }

  const deliveryLabel =
    deliveryType === 'pickup' ? 'Retrait en boutique' : `Livraison — ${address || 'adresse à compléter'}`;
  const paymentLabel = PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.label ?? paymentMethod;

  /** Chaque étape vérifie ce qu'elle a collecté avant de laisser passer. */
  const validateStep = () => {
    if (step === 1) {
      if (!phone.trim()) {
        toast.error('Renseignez votre numéro de téléphone');
        return false;
      }
      if (deliveryType === 'delivery' && !address.trim()) {
        toast.error('Renseignez votre adresse de livraison');
        return false;
      }
    }
    return true;
  };

  const next = () => {
    if (!validateStep()) return;
    setStep((current) => Math.min(STEPS.length, current + 1));
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-5">
        <Breadcrumbs
          trail={[{ label: 'Panier', to: createPageUrl('Cart') }, { label: 'Commande' }]}
          className="mb-4"
        />

        <h1 className="text-xl lg:text-2xl font-bold text-gray-900 mb-1">Finaliser la commande</h1>
        <p className="flex items-center gap-1.5 text-sm text-gray-500 mb-6">
          <Lock className="w-3.5 h-3.5" /> Paiement sécurisé — vos coordonnées ne sont pas partagées
          avec la boutique.
        </p>

        <Stepper current={step} onGoTo={setStep} />

        <div className="grid lg:grid-cols-[minmax(0,1fr)_22rem] gap-6 mt-6">
          <div className="space-y-4">
            {/* Étape 1 — livraison et contact */}
            <StepCard
              number={1}
              title="Livraison et contact"
              active={step === 1}
              done={step > 1}
              summary={`${deliveryLabel} · ${phone}`}
              onEdit={() => setStep(1)}
            >
              <fieldset className="space-y-3" aria-labelledby="titre-etape-1">
                <ChoiceCard
                  name="recuperation"
                  checked={deliveryType === 'pickup'}
                  onSelect={() => setDeliveryType('pickup')}
                  icon={Store}
                  title="Retrait en boutique"
                  detail="Gratuit — prêt sous 1 h, code de retrait envoyé par SMS"
                  price="Gratuit"
                />

                <ChoiceCard
                  name="recuperation"
                  checked={deliveryType === 'delivery'}
                  onSelect={() => setDeliveryType('delivery')}
                  icon={Truck}
                  title="Livraison à domicile"
                  detail="Sous 24 h à Yaoundé et Douala"
                  price={
                    appConfig?.free_delivery_threshold &&
                    quote?.subtotal >= appConfig.free_delivery_threshold
                      ? 'Offerte'
                      : formatXAF(appConfig?.delivery_fee ?? 0)
                  }
                />
              </fieldset>

              {deliveryType === 'delivery' && (
                <div className="mt-4">
                  <Label htmlFor="adresse">Adresse de livraison</Label>
                  <Textarea
                    id="adresse"
                    placeholder="Quartier, rue, point de repère…"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    className="mt-1.5"
                  />
                </div>
              )}

              <div className="mt-4">
                <Label htmlFor="telephone">Numéro de téléphone</Label>
                <div className="relative mt-1.5">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="telephone"
                    type="tel"
                    placeholder="6XX XX XX XX"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="pl-9"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                  Sert à confirmer le paiement mobile et à vous prévenir quand la commande est prête.
                </p>
              </div>
            </StepCard>

            {/* Étape 2 — paiement */}
            <StepCard
              number={2}
              title="Moyen de paiement"
              active={step === 2}
              done={step > 2}
              summary={paymentLabel}
              onEdit={() => setStep(2)}
            >
              <fieldset className="space-y-3" aria-labelledby="titre-etape-2">
                {PAYMENT_METHODS.filter(
                  (method) => method.id !== 'cash' || deliveryType === 'delivery',
                ).map((method) => (
                  <ChoiceCard
                    key={method.id}
                    name="paiement"
                    checked={paymentMethod === method.id}
                    onSelect={() => setPaymentMethod(method.id)}
                    icon={method.icon}
                    iconClassName={method.iconClassName}
                    title={method.label}
                    detail={method.detail}
                  />
                ))}
              </fieldset>
            </StepCard>

            {/* Étape 3 — relecture */}
            <StepCard
              number={3}
              title="Vérifier et confirmer"
              active={step === 3}
              done={false}
              summary=""
              onEdit={() => setStep(3)}
            >
              <ul className="divide-y divide-gray-100">
                {cartItems.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 py-3">
                    {item.product_image ? (
                      <img
                        src={item.product_image}
                        alt=""
                        className="w-12 h-12 rounded-lg object-cover bg-gray-100"
                      />
                    ) : (
                      <span className="w-12 h-12 rounded-lg bg-gray-100 grid place-items-center">🛒</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.product_name}</p>
                      <p className="text-xs text-gray-500">
                        {item.store_name} · ×{item.quantity}
                      </p>
                    </div>
                    <span className="text-sm font-semibold">
                      {formatXAF((item.unit_price || 0) * (item.quantity || 1))}
                    </span>
                  </li>
                ))}
              </ul>

              <dl className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm">
                <Line label="Récupération">{deliveryLabel}</Line>
                <Line label="Paiement">{paymentLabel}</Line>
                <Line label="Téléphone">{phone}</Line>
              </dl>
            </StepCard>
          </div>

          {/* Récapitulatif permanent */}
          <aside className="lg:sticky lg:top-40 lg:self-start space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Récapitulatif</h2>

              <dl className="space-y-2 text-sm">
                <Money label="Sous-total" value={quote?.subtotal ?? 0} />
                {quote?.discount > 0 && (
                  <Money
                    label={`Code ${quote.coupon_applied}`}
                    value={-quote.discount}
                    tone="emerald"
                  />
                )}
                <Money
                  label="Livraison"
                  value={quote?.deliveryFee ?? 0}
                  zeroLabel={deliveryType === 'pickup' ? 'Retrait gratuit' : 'Offerte'}
                />
              </dl>

              <div className="flex items-baseline justify-between mt-4 pt-4 border-t border-gray-100">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="text-xl font-bold text-gray-900">
                  {quoting ? '…' : formatXAF(quote?.total ?? 0)}
                </span>
              </div>

              {/* Comparaison au prix d'origine, pas une ligne de déduction :
                  mêlée aux autres, elle laissait croire à un total plus bas. */}
              {quote?.savings > 0 && (
                <p className="mt-3 text-sm text-emerald-700 bg-emerald-50 rounded-md px-3 py-2">
                  Vous économisez <strong>{formatXAF(quote.savings)}</strong> par rapport au prix
                  d'origine de ces articles.
                </p>
              )}

              <div className="mt-4 pt-4 border-t border-gray-100">
                <Label htmlFor="coupon" className="text-xs text-gray-500">
                  Code promo
                </Label>
                <Input
                  id="coupon"
                  value={couponCode}
                  onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                  placeholder="ECO-XXXXXX"
                  className="mt-1.5 uppercase h-9"
                />
                {quote?.couponError && (
                  <p className="text-xs text-red-600 mt-1.5">{quote.couponError}</p>
                )}
                {quote?.coupon_applied && !quote.couponError && (
                  <p className="text-xs text-emerald-600 mt-1.5">
                    Code {quote.coupon_applied} appliqué.
                  </p>
                )}
              </div>

              {step < STEPS.length ? (
                <Button onClick={next} className="w-full h-12 mt-4 bg-emerald-600 hover:bg-emerald-700">
                  Continuer
                </Button>
              ) : (
                <Button
                  onClick={() => checkout.mutate()}
                  disabled={checkout.isPending || quoting}
                  className="w-full h-12 mt-4 bg-emerald-600 hover:bg-emerald-700 text-base"
                >
                  {checkout.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Traitement…
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      Confirmer — {formatXAF(quote?.total ?? 0)}
                    </>
                  )}
                </Button>
              )}

              <p className="flex items-start gap-1.5 text-xs text-gray-500 mt-3">
                <ShieldCheck className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-600" />
                Le stock est réservé au moment de la confirmation. Si un article vient d'être vendu,
                la commande est refusée et rien n'est débité.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

const PAYMENT_METHODS = [
  {
    id: 'orange_money',
    label: 'Orange Money',
    detail: 'Validation par code sur votre téléphone',
    icon: Phone,
    iconClassName: 'bg-orange-500 text-white',
  },
  {
    id: 'mtn_money',
    label: 'MTN Mobile Money',
    detail: 'Validation par code sur votre téléphone',
    icon: Phone,
    iconClassName: 'bg-yellow-400 text-yellow-900',
  },
  {
    id: 'card',
    label: 'Carte bancaire',
    detail: 'Visa ou Mastercard',
    icon: CreditCard,
    iconClassName: 'bg-gray-800 text-white',
  },
  {
    id: 'cash',
    label: 'Paiement à la livraison',
    detail: 'En espèces, au moment de la remise',
    icon: Banknote,
    iconClassName: 'bg-gray-100 text-gray-600',
  },
];

function Stepper({ current, onGoTo }) {
  return (
    <ol className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 p-3">
      {STEPS.map((item, index) => {
        const done = current > item.id;
        const active = current === item.id;
        return (
          <li key={item.id} className="flex items-center gap-2 flex-1 min-w-0">
            <button
              type="button"
              onClick={() => done && onGoTo(item.id)}
              disabled={!done}
              aria-current={active ? 'step' : undefined}
              className={`flex items-center gap-2 min-w-0 ${done ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <span
                className={`w-7 h-7 rounded-full grid place-items-center text-sm font-semibold shrink-0 ${
                  done
                    ? 'bg-emerald-600 text-white'
                    : active
                      ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-600'
                      : 'bg-gray-100 text-gray-400'
                }`}
              >
                {done ? <Check className="w-4 h-4" /> : item.id}
              </span>
              <span
                className={`text-sm truncate ${active ? 'font-semibold text-gray-900' : 'text-gray-500'}`}
              >
                {item.label}
              </span>
            </button>
            {index < STEPS.length - 1 && (
              <span className="flex-1 h-px bg-gray-200 min-w-4" aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** Étape repliée une fois franchie : ce qui a été choisi reste lisible d'un coup d'œil. */
function StepCard({ number, title, active, done, summary, onEdit, children }) {
  return (
    <section
      className={`bg-white rounded-xl border ${active ? 'border-emerald-300' : 'border-gray-200'}`}
    >
      <header className="flex items-center gap-3 px-5 py-4">
        <span
          className={`w-7 h-7 rounded-full grid place-items-center text-sm font-semibold shrink-0 ${
            done ? 'bg-emerald-600 text-white' : active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'
          }`}
        >
          {done ? <Check className="w-4 h-4" /> : number}
        </span>
        <h2
          id={`titre-etape-${number}`}
          className={`font-semibold ${active || done ? 'text-gray-900' : 'text-gray-400'}`}
        >
          {title}
        </h2>
        {done && (
          <button
            type="button"
            onClick={onEdit}
            className="ml-auto flex items-center gap-1 text-sm text-emerald-700 hover:underline"
          >
            <Pencil className="w-3.5 h-3.5" />
            Modifier
          </button>
        )}
      </header>

      {active && <div className="px-5 pb-5">{children}</div>}
      {done && summary && <p className="px-5 pb-4 -mt-2 text-sm text-gray-500 truncate">{summary}</p>}
    </section>
  );
}

function ChoiceCard({ name, checked, onSelect, icon: Icon, iconClassName, title, detail, price }) {
  return (
    <label
      className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
        checked ? 'border-emerald-500 bg-emerald-50/60' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onSelect}
        className="w-4 h-4 accent-emerald-600"
      />
      <span
        className={`w-10 h-10 rounded-lg grid place-items-center shrink-0 ${
          iconClassName ?? 'bg-gray-100 text-gray-600'
        }`}
      >
        <Icon className="w-5 h-5" aria-hidden="true" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-medium text-gray-900">{title}</span>
        <span className="block text-xs text-gray-500">{detail}</span>
      </span>
      {price && <span className="text-sm font-semibold text-gray-900 shrink-0">{price}</span>}
    </label>
  );
}

function Line({ label, children }) {
  return (
    <div className="flex gap-3">
      <dt className="w-32 shrink-0 text-gray-500">{label}</dt>
      <dd className="text-gray-900 min-w-0 truncate">{children}</dd>
    </div>
  );
}

function Money({ label, value, tone, zeroLabel }) {
  return (
    <div className="flex justify-between">
      <dt className={tone === 'emerald' ? 'text-emerald-600' : 'text-gray-600'}>{label}</dt>
      <dd className={tone === 'emerald' ? 'text-emerald-600 font-medium' : 'text-gray-900'}>
        {value === 0 && zeroLabel ? zeroLabel : `${value < 0 ? '−' : ''}${formatXAF(Math.abs(value))}`}
      </dd>
    </div>
  );
}

function CheckoutSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-6 py-10">
      <div className="h-8 w-56 bg-gray-200 rounded animate-pulse mb-6" />
      <div className="grid lg:grid-cols-[minmax(0,1fr)_22rem] gap-6">
        <div className="h-80 bg-white rounded-xl border border-gray-200 animate-pulse" />
        <div className="h-64 bg-white rounded-xl border border-gray-200 animate-pulse" />
      </div>
    </div>
  );
}
