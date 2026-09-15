import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Package, ShoppingBag, Store, Truck } from 'lucide-react';
import { api } from '@/api';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/lib/AuthContext';
import { formatXAF, formatDateTime } from '@/lib/format';
import { ORDER_STATUS, PAYMENT_STATUS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import Paginator from '@/components/catalog/Paginator';
import DeliveryChat from '@/components/delivery/DeliveryChat';

const PAR_PAGE = 10;
const CHAT_ACTIF = new Set(['confirmed', 'picked_up', 'on_the_way', 'ready']);

const ONGLETS = [
  { id: 'all', label: 'Toutes' },
  { id: 'pending', label: 'En attente' },
  { id: 'confirmed', label: 'Confirmées' },
  { id: 'ready', label: 'Prêtes' },
  { id: 'delivered', label: 'Remises' },
  { id: 'cancelled', label: 'Annulées' },
];

/**
 * Historique des commandes.
 *
 * Le filtre par statut et la pagination sont appliqués par le serveur. Filtrer
 * en JavaScript une liste déjà tronquée donnait un onglet « Remises » qui
 * n'affichait que les commandes remises figurant parmi les cinquante
 * dernières — les autres devenaient invisibles.
 */
export default function Orders() {
  const { user } = useAuth();
  const [statut, setStatut] = useState('all');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['orders', user?.email, statut, page],
    queryFn: () =>
      api.entities.Order.page({
        filter: {
          customer_email: user.email,
          ...(statut === 'all' ? {} : { status: statut }),
        },
        sort: '-created_date',
        limit: PAR_PAGE,
        offset: (page - 1) * PAR_PAGE,
      }),
    enabled: Boolean(user),
    placeholderData: (précédent) => précédent,
  });

  const commandes = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAR_PAGE));

  const changerOnglet = (id) => {
    setStatut(id);
    setPage(1);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 lg:px-6 py-6">
        <Breadcrumbs trail={[{ label: 'Mes commandes' }]} className="mb-4" />

        <div className="flex items-end justify-between gap-4 mb-5">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Mes commandes</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {isLoading ? 'Chargement…' : `${total} commande${total > 1 ? 's' : ''}`}
            </p>
          </div>
          <Button variant="outline" asChild className="shrink-0">
            <Link to={createPageUrl('Catalog')}>Nouvelle commande</Link>
          </Button>
        </div>

        <nav aria-label="Filtrer par statut" className="mb-5">
          <ul className="flex gap-1 overflow-x-auto scrollbar-hide bg-white border border-gray-200 rounded-lg p-1">
            {ONGLETS.map((onglet) => (
              <li key={onglet.id}>
                <button
                  type="button"
                  onClick={() => changerOnglet(onglet.id)}
                  aria-current={statut === onglet.id ? 'true' : undefined}
                  className={`px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition-colors ${
                    statut === onglet.id
                      ? 'bg-emerald-600 text-white font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {onglet.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        ) : commandes.length === 0 ? (
          <VideState statut={statut} />
        ) : (
          <>
            <ul className="space-y-3">
              {commandes.map((commande) => (
                <li key={commande.id}>
                  <CarteCommande commande={commande} utilisateur={user} />
                </li>
              ))}
            </ul>
            <Paginator page={page} pages={pages} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}

function CarteCommande({ commande, utilisateur }) {
  const statut = ORDER_STATUS[commande.status] ?? {
    label: commande.status,
    color: 'bg-gray-100 text-gray-700',
  };
  const paiement = PAYMENT_STATUS[commande.payment_status];
  const retrait = commande.delivery_type === 'pickup';
  const articles = commande.items ?? [];
  const restants = articles.length - 2;

  return (
    <article className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900">
            N° {commande.order_number ?? commande.id?.slice(-8)}
          </p>
          <p className="text-xs text-gray-500">{formatDateTime(commande.created_date)}</p>
        </div>
        <div className="flex items-center gap-2">
          {paiement && commande.payment_status !== 'paid' && (
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${paiement.color}`}>
              {paiement.label}
            </span>
          )}
          <span className={`px-2.5 py-1 rounded text-xs font-medium ${statut.color}`}>
            {statut.label}
          </span>
        </div>
      </header>

      <ul className="divide-y divide-gray-100 px-4">
        {articles.slice(0, 2).map((article, index) => (
          <li key={`${article.product_id ?? index}`} className="flex items-center gap-3 py-2.5">
            <span className="w-10 h-10 rounded-lg bg-gray-100 grid place-items-center shrink-0">
              🛒
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-medium text-gray-900 truncate">
                {article.product_name}
              </span>
              <span className="block text-xs text-gray-500">×{article.quantity}</span>
            </span>
            <span className="text-sm font-medium">
              {formatXAF((article.unit_price ?? 0) * (article.quantity ?? 1))}
            </span>
          </li>
        ))}
        {restants > 0 && (
          <li className="py-2 text-sm text-gray-500">
            et {restants} autre{restants > 1 ? 's' : ''} article{restants > 1 ? 's' : ''}
          </li>
        )}
      </ul>

      <footer className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-gray-100">
        <p className="flex items-center gap-1.5 text-sm text-gray-600">
          {retrait ? <Store className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
          {retrait ? `Retrait — ${commande.store_name ?? 'boutique'}` : 'Livraison à domicile'}
        </p>

        <div className="flex items-center gap-3 ml-auto">
          {CHAT_ACTIF.has(commande.status) && commande.driver_email && (
            <DeliveryChat order={commande} currentUser={utilisateur} />
          )}
          <div className="text-right">
            <p className="font-bold text-gray-900">{formatXAF(commande.total_amount ?? 0)}</p>
            {commande.total_savings > 0 && (
              <p className="text-xs text-emerald-600">
                {formatXAF(commande.total_savings)} économisés
              </p>
            )}
          </div>
          {!retrait && CHAT_ACTIF.has(commande.status) && (
            <Button variant="outline" size="sm" asChild>
              <Link to={createPageUrl('DeliveryTracking')}>
                Suivre
                <ChevronRight className="w-4 h-4 ml-0.5" />
              </Link>
            </Button>
          )}
        </div>
      </footer>
    </article>
  );
}

function VideState({ statut }) {
  const filtré = statut !== 'all';
  return (
    <div className="bg-white border border-gray-200 rounded-xl py-16 px-6 text-center">
      <span className="w-14 h-14 rounded-full bg-gray-100 grid place-items-center mx-auto mb-4">
        <Package className="w-7 h-7 text-gray-400" />
      </span>
      <h2 className="font-semibold text-gray-900 mb-1">
        {filtré ? 'Aucune commande dans cet état' : 'Aucune commande pour le moment'}
      </h2>
      <p className="text-sm text-gray-500 mb-5">
        {filtré
          ? 'Essayez un autre onglet.'
          : 'Vos achats anti-gaspillage apparaîtront ici.'}
      </p>
      <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
        <Link to={createPageUrl('Catalog')}>
          <ShoppingBag className="w-4 h-4 mr-2" />
          Découvrir les offres
        </Link>
      </Button>
    </div>
  );
}
