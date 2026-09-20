import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Clock,
  LayoutDashboard,
  Leaf,
  Package,
  ShoppingBag,
  Store,
  Truck,
  Users,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '@/api';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/lib/AuthContext';
import { formatXAF, formatNumber, formatShortDate } from '@/lib/format';
import { ORDER_STATUS } from '@/lib/constants';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const PÉRIODES = [
  { jours: 7, label: '7 jours' },
  { jours: 30, label: '30 jours' },
  { jours: 90, label: '90 jours' },
];

/**
 * Tableau de bord administrateur.
 *
 * Tous les chiffres viennent des agrégats calculés en base. L'écran les
 * recomposait auparavant en JavaScript à partir de listes plafonnées : il
 * annonçait « revenus totaux » sur la somme des cent dernières commandes, et
 * comptait les magasins, produits et utilisateurs sur les cinquante premiers.
 * Aucun de ces chiffres n'était juste, et rien ne le signalait.
 */
export default function AdminDashboard() {
  const { user } = useAuth();
  const [jours, setJours] = useState(30);

  const { data: vue, isLoading } = useQuery({
    queryKey: ['backoffice-overview', jours],
    queryFn: () => api.backoffice.overview(jours),
    enabled: Boolean(user),
    placeholderData: (précédent) => précédent,
  });

  /* Produits à écouler sous trois jours : le moteur du catalogue sait déjà les
     compter, avec le même périmètre que ce que voient les clients. */
  const { data: urgents } = useQuery({
    queryKey: ['admin-urgents'],
    queryFn: () => api.catalog.search({ expires: '3days', per_page: 1, facets: 0 }),
    enabled: Boolean(user),
    select: (page) => page.page.total,
  });

  const { data: dernièresCommandes = [] } = useQuery({
    queryKey: ['admin-recent-orders'],
    // Cinq lignes, demandées explicitement : c'est une liste d'activité
    // récente, pas un inventaire.
    queryFn: () => api.entities.Order.list('-created_date', 5),
    enabled: Boolean(user),
  });

  const parStatut = (liste, statut) => liste?.find((l) => l.status === statut)?.count ?? 0;
  const somme = (liste) => (liste ?? []).reduce((total, l) => total + l.count, 0);

  const magasinsVérifiés = parStatut(vue?.stores_by_status, 'verified');
  const magasinsEnAttente = parStatut(vue?.stores_by_status, 'pending');
  const commandesLivrées = parStatut(vue?.orders_by_status, 'delivered');
  const commandesEnAttente = parStatut(vue?.orders_by_status, 'pending');

  const graphique = (vue?.daily ?? []).map((jour) => ({
    date: formatShortDate(jour.date),
    commandes: jour.orders,
    revenus: Math.round(jour.revenue / 1000),
  }));

  const raccourcis = [
    { label: 'Gérer les partenaires', icon: Store, href: 'AdminPartners', color: 'bg-blue-500' },
    {
      label: 'Valider les magasins',
      icon: CheckCircle,
      href: 'AdminPartners',
      badge: magasinsEnAttente,
      color: 'bg-orange-500',
    },
    {
      label: 'Produits urgents',
      icon: AlertTriangle,
      href: 'StockGuardian',
      badge: urgents,
      color: 'bg-red-500',
    },
    { label: 'Gestion livraisons', icon: Truck, href: 'DeliveryOptimization', color: 'bg-purple-500' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="p-3 bg-white/20 rounded-xl">
              <LayoutDashboard className="w-6 h-6" />
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold">Tableau de bord administrateur</h1>
              <p className="text-indigo-100">Vue d'ensemble de la plateforme Chichard</p>
            </div>

            <div className="ml-auto flex gap-1 bg-white/10 rounded-lg p-1">
              {PÉRIODES.map((période) => (
                <button
                  key={période.jours}
                  type="button"
                  onClick={() => setJours(période.jours)}
                  aria-pressed={jours === période.jours}
                  className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                    jours === période.jours ? 'bg-white text-indigo-700 font-medium' : 'text-white/80'
                  }`}
                >
                  {période.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Chiffre
              icon={ShoppingBag}
              valeur={isLoading ? null : formatNumber(vue?.orders ?? 0)}
              label={`Commandes sur ${jours} jours`}
              évolution={vue?.orders_change_pct}
            />
            <Chiffre
              icon={BarChart3}
              valeur={isLoading ? null : formatXAF(vue?.revenue ?? 0)}
              label="Chiffre d'affaires"
              évolution={vue?.revenue_change_pct}
            />
            <Chiffre
              icon={Users}
              valeur={isLoading ? null : formatNumber(vue?.users_total ?? 0)}
              label="Comptes inscrits"
            />
            <Chiffre
              icon={Package}
              valeur={isLoading ? null : formatNumber(somme(vue?.products_by_status))}
              label="Produits au catalogue"
            />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 space-y-6">
        <div className="grid md:grid-cols-4 gap-4">
          {raccourcis.map((raccourci) => (
            <Link key={raccourci.label} to={createPageUrl(raccourci.href)}>
              <Card className={`p-4 hover:shadow-lg transition-all ${raccourci.color} text-white h-full`}>
                <div className="flex items-center justify-between mb-2">
                  <raccourci.icon className="w-6 h-6" />
                  {raccourci.badge > 0 && (
                    <Badge className="bg-white text-gray-900">{raccourci.badge}</Badge>
                  )}
                </div>
                <p className="font-semibold">{raccourci.label}</p>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="font-bold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-500" />
              Commandes et revenus sur {jours} jours
            </h2>
            {isLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : graphique.length === 0 ? (
              <p className="text-sm text-gray-500 py-16 text-center">
                Aucune commande sur la période.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={graphique}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="commandes" fill="#6366f1" name="Commandes" />
                  <Bar dataKey="revenus" fill="#10b981" name="Revenus (milliers FCFA)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="font-bold mb-4">Métriques clés</h2>
            <div className="space-y-3">
              <Métrique
                icon={CheckCircle}
                ton="blue"
                label="Commandes remises"
                valeur={formatNumber(commandesLivrées)}
                appoint={
                  vue?.orders ? `${Math.round((commandesLivrées / vue.orders) * 100)} %` : null
                }
              />
              <Métrique
                icon={Clock}
                ton="orange"
                label="Commandes en attente"
                valeur={formatNumber(commandesEnAttente)}
              />
              <Métrique
                icon={Store}
                ton="purple"
                label="Magasins vérifiés"
                valeur={formatNumber(magasinsVérifiés)}
                appoint={magasinsEnAttente ? `${magasinsEnAttente} en attente` : null}
              />
              <Métrique
                icon={Leaf}
                ton="emerald"
                label="Économies générées pour les clients"
                valeur={formatXAF(vue?.savings_generated ?? 0)}
                appoint={vue?.co2_saved_kg ? `${Math.round(vue.co2_saved_kg)} kg de CO₂` : null}
              />
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="font-bold mb-4">Dernières commandes</h2>
          {dernièresCommandes.length === 0 ? (
            <p className="text-sm text-gray-500">Aucune commande pour le moment.</p>
          ) : (
            <ul className="space-y-2">
              {dernièresCommandes.map((commande) => {
                const statut = ORDER_STATUS[commande.status] ?? {
                  label: commande.status,
                  color: 'bg-gray-100 text-gray-700',
                };
                return (
                  <li
                    key={commande.id}
                    className="flex items-center justify-between gap-3 p-3 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <ShoppingBag className="w-5 h-5 text-gray-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{commande.customer_name}</p>
                        <p className="text-sm text-gray-500">
                          {commande.items?.length ?? 0} article
                          {(commande.items?.length ?? 0) > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-gray-900">{formatXAF(commande.total_amount)}</p>
                      <span className={`inline-block px-2 py-0.5 rounded text-xs ${statut.color}`}>
                        {statut.label}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function Chiffre({ icon: Icon, valeur, label, évolution }) {
  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-4">
      <div className="flex items-center gap-3">
        <Icon className="w-8 h-8 shrink-0" />
        <div className="min-w-0">
          {valeur === null ? (
            <Skeleton className="h-7 w-20 bg-white/30" />
          ) : (
            <p className="text-xl font-bold truncate">{valeur}</p>
          )}
          <p className="text-sm text-indigo-100">{label}</p>
          {typeof évolution === 'number' && (
            <p className={`text-xs ${évolution >= 0 ? 'text-emerald-200' : 'text-red-200'}`}>
              {évolution >= 0 ? '+' : ''}
              {Math.round(évolution)} % vs période précédente
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

function Métrique({ icon: Icon, ton, label, valeur, appoint }) {
  const tons = {
    blue: 'bg-blue-50 text-blue-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  };
  const [fond, texte] = tons[ton].split(' ');

  return (
    <div className={`flex items-center justify-between gap-3 p-3 rounded-lg ${fond}`}>
      <div className="flex items-center gap-3 min-w-0">
        <Icon className={`w-7 h-7 shrink-0 ${texte}`} />
        <div className="min-w-0">
          <p className="text-sm text-gray-600">{label}</p>
          <p className={`text-lg font-bold ${texte}`}>{valeur}</p>
        </div>
      </div>
      {appoint && <Badge variant="outline" className="shrink-0">{appoint}</Badge>}
    </div>
  );
}
