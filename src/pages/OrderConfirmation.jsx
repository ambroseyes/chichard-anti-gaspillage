import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Clock,
  MapPin,
  Package,
  Printer,
  ShieldCheck,
  Store,
  Truck,
} from 'lucide-react';
import { api } from '@/api';
import { createPageUrl } from '@/utils';
import { formatXAF, formatDateTime } from '@/lib/format';
import { ORDER_STATUS, PAYMENT_STATUS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import QRCodeGenerator from '@/components/delivery/QRCodeGenerator';

/**
 * Confirmation de commande.
 *
 * C'est le seul écran où le code de retrait apparaît : le serveur n'en garde
 * qu'un condensat et ne le renverra jamais. Il est donc affiché quel que soit
 * le mode de récupération, mis en évidence, et accompagné de la consigne de
 * le conserver.
 */
export default function OrderConfirmation() {
  const [params] = useSearchParams();
  const orderId = params.get('commande') ?? params.get('id');
  const confirmationCode = params.get('code');
  const pickupToken = params.get('jeton');

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => api.entities.Order.get(orderId),
    enabled: Boolean(orderId),
  });

  if (isLoading) return <ConfirmationSkeleton />;
  if (!order) return <Introuvable />;

  const retrait = order.delivery_type === 'pickup';
  const statut = ORDER_STATUS[order.status] ?? { label: order.status, color: 'bg-gray-100 text-gray-700' };
  const paiement = PAYMENT_STATUS[order.payment_status];

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 lg:px-6 py-6">
        <Breadcrumbs
          trail={[{ label: 'Mes commandes', to: createPageUrl('Orders') }, { label: 'Confirmation' }]}
          className="mb-5 print:hidden"
        />

        <header className="text-center mb-6">
          <span className="w-14 h-14 rounded-full bg-emerald-100 grid place-items-center mx-auto mb-3">
            <Check className="w-8 h-8 text-emerald-600" />
          </span>
          <h1 className="text-2xl font-bold text-gray-900">Commande enregistrée</h1>
          <p className="text-gray-500 mt-1">
            Commande n° <strong className="text-gray-900">{order.order_number ?? order.id}</strong> ·
            passée le {formatDateTime(order.created_date)}
          </p>
        </header>

        {/* Code de retrait — la partie à ne pas perdre */}
        {confirmationCode && (
          <section className="bg-white rounded-xl border-2 border-emerald-500 overflow-hidden mb-5">
            <div className="bg-emerald-50 px-5 py-3 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-700" aria-hidden="true" />
              <h2 className="font-semibold text-emerald-900">
                {retrait ? 'Votre code de retrait' : 'Votre code de remise'}
              </h2>
            </div>

            <div className="p-5">
              <p className="flex items-start gap-2 text-sm text-amber-800 bg-amber-50 rounded-lg px-3 py-2 mb-4">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                <span>
                  Ce code n'est affiché qu'ici et ne pourra pas être retrouvé. Notez-le ou
                  imprimez cette page avant de la quitter.
                </span>
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold tracking-[0.2em] text-gray-900 tabular-nums">
                    {confirmationCode}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    À dicter à {retrait ? 'la boutique' : 'votre livreur'}
                  </p>
                </div>

                {pickupToken && (
                  <div className="sm:ml-auto">
                    <QRCodeGenerator
                      pickupToken={pickupToken}
                      confirmationCode={confirmationCode}
                      orderNumber={order.order_number}
                      showCode={false}
                    />
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-500 mt-4">
                Le code est signé par nos serveurs et vérifié à la remise. Ne le communiquez
                qu'à la personne qui vous remet la commande.
              </p>

              <Button
                variant="outline"
                onClick={() => window.print()}
                className="mt-4 print:hidden"
              >
                <Printer className="w-4 h-4 mr-2" />
                Imprimer cette page
              </Button>
            </div>
          </section>
        )}

        {/* Récapitulatif */}
        <section className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Votre commande</h2>
            <span className={`px-2.5 py-1 rounded text-xs font-medium ${statut.color}`}>
              {statut.label}
            </span>
          </div>

          <ul className="divide-y divide-gray-100 mb-4">
            {(order.items ?? []).map((item, index) => (
              <li key={`${item.product_id ?? index}`} className="flex items-center gap-3 py-2.5">
                <span className="w-10 h-10 rounded-lg bg-gray-100 grid place-items-center shrink-0">
                  🛒
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-gray-900 truncate">
                    {item.product_name}
                  </span>
                  <span className="block text-xs text-gray-500">×{item.quantity}</span>
                </span>
                <span className="text-sm font-semibold">
                  {formatXAF((item.unit_price ?? 0) * (item.quantity ?? 1))}
                </span>
              </li>
            ))}
          </ul>

          <dl className="space-y-1.5 text-sm border-t border-gray-100 pt-3">
            <Ligne label="Sous-total">{formatXAF(order.subtotal_amount ?? 0)}</Ligne>
            {order.discount_amount > 0 && (
              <Ligne label={`Code ${order.coupon_code ?? 'promo'}`}>
                −{formatXAF(order.discount_amount)}
              </Ligne>
            )}
            <Ligne label="Livraison">
              {order.delivery_fee > 0 ? formatXAF(order.delivery_fee) : 'Gratuite'}
            </Ligne>
            <div className="flex justify-between pt-2 border-t border-gray-100 text-base font-bold">
              <dt>Total</dt>
              <dd>{formatXAF(order.total_amount ?? 0)}</dd>
            </div>
          </dl>

          {order.total_savings > 0 && (
            <p className="mt-3 text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
              Vous avez économisé <strong>{formatXAF(order.total_savings)}</strong> et évité à ces
              produits de finir à la poubelle.
            </p>
          )}
        </section>

        {/* Ce qui se passe ensuite */}
        <section className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
          <h2 className="font-semibold text-gray-900 mb-4">Et maintenant ?</h2>

          <ul className="space-y-4">
            <Étape
              icon={retrait ? Store : Truck}
              titre={retrait ? 'Retrait en boutique' : 'Livraison à domicile'}
            >
              {retrait ? (
                <>
                  Présentez-vous chez <strong>{order.store_name}</strong> avec votre code.
                  La commande est préparée sous une heure.
                </>
              ) : (
                <>
                  Livraison à <strong>{order.delivery_address}</strong>, sous 24 h. Le livreur
                  vous demandera votre code à la remise.
                </>
              )}
            </Étape>

            {paiement && (
              <Étape icon={Package} titre={`Paiement — ${paiement.label}`}>
                {order.payment_status === 'paid'
                  ? 'Le règlement a bien été encaissé.'
                  : 'Validez le paiement sur votre téléphone pour que la commande soit préparée.'}
              </Étape>
            )}

            <Étape icon={Clock} titre="Suivi">
              L'avancement est visible à tout moment depuis{' '}
              <Link to={createPageUrl('Orders')} className="text-emerald-700 hover:underline">
                vos commandes
              </Link>
              .
            </Étape>
          </ul>
        </section>

        <div className="flex flex-col sm:flex-row gap-3 print:hidden">
          <Button variant="outline" asChild className="flex-1">
            <Link to={createPageUrl('Orders')}>
              Suivre ma commande
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
          <Button asChild className="flex-1 bg-emerald-600 hover:bg-emerald-700">
            <Link to={createPageUrl('Catalog')}>Continuer mes achats</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function Ligne({ label, children }) {
  return (
    <div className="flex justify-between">
      <dt className="text-gray-600">{label}</dt>
      <dd className="text-gray-900">{children}</dd>
    </div>
  );
}

function Étape({ icon: Icon, titre, children }) {
  return (
    <li className="flex gap-3">
      <span className="w-9 h-9 rounded-lg bg-emerald-50 grid place-items-center shrink-0">
        <Icon className="w-4.5 h-4.5 text-emerald-600" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-gray-900">{titre}</span>
        <span className="block text-sm text-gray-600">{children}</span>
      </span>
    </li>
  );
}

function ConfirmationSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-5">
      <Skeleton className="h-20 w-full rounded-xl" />
      <Skeleton className="h-52 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  );
}

function Introuvable() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <div className="w-14 h-14 rounded-full bg-gray-100 grid place-items-center mx-auto mb-4">
        <MapPin className="w-7 h-7 text-gray-400" />
      </div>
      <h1 className="text-xl font-semibold text-gray-900 mb-2">Commande introuvable</h1>
      <p className="text-sm text-gray-500 mb-6">
        Le lien est peut-être incomplet. Vos commandes restent accessibles depuis votre compte.
      </p>
      <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
        <Link to={createPageUrl('Orders')}>Voir mes commandes</Link>
      </Button>
    </div>
  );
}
