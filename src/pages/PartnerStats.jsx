import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Award, Leaf, Package, TrendingUp } from 'lucide-react';
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '@/api';
import { useAuth } from '@/lib/AuthContext';
import { formatXAF, formatNumber, formatShortDate } from '@/lib/format';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const PÉRIODES = [
  { jours: 7, label: '7 jours' },
  { jours: 30, label: '30 jours' },
  { jours: 90, label: '90 jours' },
];

const COULEURS = ['#10b981', '#6366f1', '#f97316', '#eab308', '#06b6d4', '#ec4899', '#8b5cf6'];

/**
 * Statistiques du partenaire.
 *
 * Tout vient de l'agrégat calculé en base pour ses magasins. L'écran
 * additionnait auparavant les cinq cents dernières commandes en les appelant
 * « revenus », reconstruisait la répartition par rayon à partir d'une page de
 * produits, et traçait une courbe de trente jours codée à zéro : elle
 * affichait une ligne plate quelles que soient les ventes.
 */
export default function PartnerStats() {
  const { user } = useAuth();
  const [jours, setJours] = useState(30);

  const { data: vue, isLoading } = useQuery({
    queryKey: ['partner-dashboard', jours],
    queryFn: () => api.partner.dashboard(jours),
    enabled: Boolean(user),
    placeholderData: (précédent) => précédent,
  });

  const courbe = (vue?.daily ?? []).map((jour) => ({
    date: formatShortDate(jour.date),
    commandes: jour.commandes,
    revenus: jour.ventes,
  }));

  const rayons = (vue?.products_by_category ?? [])
    .filter((rayon) => rayon.units_sold > 0)
    .slice(0, 7)
    .map((rayon) => ({ name: rayon.label, value: rayon.units_sold }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Statistiques</h1>
            <p className="text-gray-500">Les chiffres de vos magasins sur la période choisie</p>
          </div>

          <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1">
            {PÉRIODES.map((période) => (
              <button
                key={période.jours}
                type="button"
                onClick={() => setJours(période.jours)}
                aria-pressed={jours === période.jours}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  jours === période.jours
                    ? 'bg-emerald-600 text-white font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {période.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Indicateur
            icon={Package}
            ton="text-emerald-600"
            label="Unités vendues"
            valeur={isLoading ? null : formatNumber(vue?.units_sold ?? 0)}
            appoint={`${formatNumber(vue?.units_in_stock ?? 0)} encore en stock`}
          />
          <Indicateur
            icon={TrendingUp}
            ton="text-indigo-600"
            label={`Chiffre d'affaires sur ${jours} j`}
            valeur={isLoading ? null : formatXAF(vue?.revenue ?? 0)}
            appoint={`${formatNumber(vue?.orders ?? 0)} commande${(vue?.orders ?? 0) > 1 ? 's' : ''}`}
          />
          <Indicateur
            icon={Leaf}
            ton="text-teal-600"
            label="Économies offertes aux clients"
            valeur={isLoading ? null : formatXAF(vue?.savings_generated ?? 0)}
            appoint={vue?.co2_saved_kg ? `${Math.round(vue.co2_saved_kg)} kg de CO₂ évités` : null}
          />
          <Indicateur
            icon={Award}
            ton="text-amber-600"
            label="Références en vente"
            valeur={isLoading ? null : formatNumber(vue?.active_products ?? 0)}
            appoint={
              vue?.sold_out_products ? `${formatNumber(vue.sold_out_products)} épuisées` : null
            }
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="font-bold mb-4">Ventes sur {jours} jours</h2>
            {isLoading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : courbe.length === 0 ? (
              <p className="text-sm text-gray-500 py-20 text-center">
                Aucune commande sur la période.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={courbe}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(valeur, nom) => (nom === 'revenus' ? formatXAF(valeur) : valeur)} />
                  <Legend />
                  <Line type="monotone" dataKey="commandes" stroke="#6366f1" name="Commandes" />
                  <Line type="monotone" dataKey="revenus" stroke="#10b981" name="Revenus" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="font-bold mb-4">Unités vendues par rayon</h2>
            {isLoading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : rayons.length === 0 ? (
              <p className="text-sm text-gray-500 py-20 text-center">
                Aucune vente enregistrée pour l'instant.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={rayons} dataKey="value" nameKey="name" outerRadius={90} label>
                    {rayons.map((rayon, index) => (
                      <Cell key={rayon.name} fill={COULEURS[index % COULEURS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="font-bold mb-4">Vos meilleures ventes</h2>
          {(vue?.top_products ?? []).length === 0 ? (
            <p className="text-sm text-gray-500">Pas encore de ventes à classer.</p>
          ) : (
            <ol className="space-y-2">
              {vue.top_products.map((produit, index) => (
                <li
                  key={produit.id}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg"
                >
                  <span className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-700 grid place-items-center text-sm font-semibold shrink-0">
                    {index + 1}
                  </span>
                  <span className="flex-1 min-w-0 font-medium truncate">{produit.name}</span>
                  <span className="text-sm text-gray-500 shrink-0">
                    {formatNumber(produit.quantity_sold ?? 0)} vendues
                  </span>
                  <span className="font-semibold shrink-0">
                    {formatXAF(produit.discounted_price)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </div>
  );
}

function Indicateur({ icon: Icon, ton, label, valeur, appoint }) {
  return (
    <Card className="p-4">
      <Icon className={`w-7 h-7 mb-2 ${ton}`} />
      {valeur === null ? (
        <Skeleton className="h-8 w-24" />
      ) : (
        <p className="text-xl font-bold text-gray-900 truncate">{valeur}</p>
      )}
      <p className="text-sm text-gray-600">{label}</p>
      {appoint && <p className="text-xs text-gray-400 mt-0.5">{appoint}</p>}
    </Card>
  );
}
