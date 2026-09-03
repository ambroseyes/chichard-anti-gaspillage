import React, { useState } from 'react';
import { api } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BackofficeLayout from '@/components/backoffice/BackofficeLayout';
import {
  TrendingUp, Users, Package, DollarSign, AlertTriangle,
  Activity, ShoppingCart, ArrowUpRight, ArrowDownRight, Zap
} from 'lucide-react';
import {
  AreaChart, Area, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { formatShortDate, formatXAF } from '@/lib/format';
import { motion } from 'framer-motion';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'];

const KPICard = ({ title, value, unit, change, icon: KPIIcon, color, delay = 0 }) => {
  // Une variation n'est affichée que si le serveur a pu la calculer : sans
  // période de référence, la carte n'affiche pas de pourcentage.
  const hasChange = typeof change === 'number' && Number.isFinite(change);
  const isPositive = change >= 0;
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Card className="p-5 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2.5 rounded-lg ${color}`}>
            <KPIIcon className="w-5 h-5 text-white" />
          </div>
          {hasChange && (
            <div className={`flex items-center gap-1 text-xs font-semibold ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
              {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(change).toFixed(1)} %
            </div>
          )}
        </div>
        <p className="text-2xl font-bold text-gray-900">{value} <span className="text-sm font-normal text-gray-400">{unit}</span></p>
        <p className="text-sm text-gray-500 mt-1">{title}</p>
      </Card>
    </motion.div>
  );
};

export default function AdminBackoffice() {
  const [period, setPeriod] = useState('30');

  /**
   * Un seul appel agrégé, calculé en base sur la période choisie. L'écran ne
   * télécharge plus les commandes, produits, magasins et comptes pour faire
   * des additions dans le navigateur.
   */
  const { data: overview, isLoading } = useQuery({
    queryKey: ['bo-overview', period],
    queryFn: () => api.backoffice.overview(Number(period)),
    placeholderData: (previous) => previous,
  });

  const totalRevenue = overview?.revenue ?? 0;
  const revenueChange = overview?.revenue_change_pct ?? 0;
  const ordersCount = overview?.orders ?? 0;
  const ordersChange = overview?.orders_change_pct ?? 0;
  const conversionRate = overview?.orders
    ? (
        ((overview.orders_by_status?.find((s) => s.status !== 'cancelled')?.count ?? overview.orders) /
          overview.orders) *
        100
      ).toFixed(1)
    : '0';
  const activeProducts =
    overview?.products_by_status?.find((s) => s.status === 'active')?.count ?? 0;
  const verifiedStores = overview?.stores_by_status?.find((s) => s.status === 'verified')?.count ?? 0;
  const usersCount = overview?.users_total ?? 0;

  const trendData = (overview?.daily ?? []).map((d) => ({
    date: formatShortDate(d.date),
    commandes: d.orders,
    revenus: d.revenue,
  }));

  // Répartition par statut, telle que comptée par le serveur.
  const STATUS_COLORS = {
    confirmed: '#10b981',
    pending: '#f59e0b',
    ready: '#3b82f6',
    delivered: '#6366f1',
    cancelled: '#ef4444',
  };
  const STATUS_LABELS = {
    confirmed: 'Confirmées',
    pending: 'En attente',
    ready: 'Prêtes',
    delivered: 'Livrées',
    cancelled: 'Annulées',
  };

  const statusData = (overview?.orders_by_status ?? [])
    .filter((s) => s.count > 0)
    .map((s) => ({
      name: STATUS_LABELS[s.status] ?? s.status,
      value: s.count,
      color: STATUS_COLORS[s.status] ?? '#94a3b8',
    }));

  const storesTotal = (overview?.stores_by_status ?? []).reduce((sum, s) => sum + s.count, 0);

  // Deux listes courtes, servies paginées : le tableau de bord ne rapatrie plus
  // la totalité des commandes et des magasins pour les recompter ici.
  const { data: recentOrdersPage } = useQuery({
    queryKey: ['bo-recent-orders'],
    queryFn: () => api.backoffice.transactions({ limit: 8 }),
  });
  const recentOrders = recentOrdersPage?.data ?? [];

  const { data: topStores = [] } = useQuery({
    queryKey: ['bo-top-stores'],
    queryFn: () => api.entities.Store.list('-total_products_saved', 8),
  });

  return (
    <BackofficeLayout currentPage="Tableau de bord">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Tableau de bord</h1>
            <p className="text-sm text-gray-500">Période : {period} derniers jours</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Données en temps réel
            </div>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-36 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 derniers jours</SelectItem>
                <SelectItem value="14">14 derniers jours</SelectItem>
                <SelectItem value="30">30 derniers jours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard title="Revenus" value={formatXAF(totalRevenue)} change={revenueChange} icon={DollarSign} color="bg-indigo-500" delay={0} />
          <KPICard title="Commandes" value={ordersCount} unit="sur la période" change={ordersChange} icon={ShoppingCart} color="bg-purple-500" delay={0.05} />
          <KPICard title="Panier moyen" value={formatXAF(overview?.average_order_value ?? 0)} icon={TrendingUp} color="bg-pink-500" delay={0.1} />
          <KPICard title="Magasins vérifiés" value={verifiedStores} unit={`sur ${storesTotal}`} icon={Activity} color="bg-emerald-500" delay={0.15} />
        </div>

        {/* Secondary KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard title="Produits actifs" value={activeProducts} unit="produits" icon={Package} color="bg-blue-500" delay={0.2} />
          <KPICard title="Utilisateurs" value={usersCount} unit="inscrits" icon={Users} color="bg-orange-500" delay={0.25} />
          <KPICard title="Commandes livrées" value={overview?.orders_by_status?.find((s) => s.status === 'delivered')?.count ?? 0} icon={Zap} color="bg-teal-500" delay={0.3} />
          <KPICard title="Économies générées" value={formatXAF(overview?.savings_generated ?? 0)} icon={AlertTriangle} color="bg-red-500" delay={0.35} />
        </div>

        {/* Charts Row 1 */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-5 md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Évolution des ventes</h3>
              <Badge variant="outline" className="text-xs">{period} jours</Badge>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#colorRevenue)" strokeWidth={2} name="Revenus (k FCFA)" />
                <Line type="monotone" dataKey="commandes" stroke="#ec4899" strokeWidth={2} name="Commandes" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Statut des commandes</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-1.5">
              {statusData.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: s.color }} />
                    <span className="text-gray-600">{s.name}</span>
                  </div>
                  <span className="font-semibold">{s.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Impact sur la période</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                <p className="text-xs text-emerald-700">CO₂ évité</p>
                <p className="text-2xl font-bold text-emerald-800 mt-1">
                  {(overview?.co2_saved_kg ?? 0).toFixed(1)} kg
                </p>
              </div>
              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100">
                <p className="text-xs text-indigo-700">Économies clients</p>
                <p className="text-2xl font-bold text-indigo-800 mt-1">
                  {formatXAF(overview?.savings_generated ?? 0)}
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {statusData.map((entry) => (
                <div key={entry.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-gray-600">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: entry.color }} />
                    {entry.name}
                  </span>
                  <span className="font-medium text-gray-900">{entry.value}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Commandes récentes</h3>
              <Badge variant="outline" className="text-xs">Live</Badge>
            </div>
            <div className="space-y-2 overflow-y-auto max-h-56">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{order.customer_name || 'Client'}</p>
                    <p className="text-xs text-gray-400">{order.store_name} • {order.delivery_type}</p>
                  </div>
                  <div className="text-right ml-2">
                    <p className="text-sm font-bold">{formatXAF(order.total_amount)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                      order.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>{order.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Store performance table */}
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Performance des magasins</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-gray-500 font-medium">Magasin</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Statut</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Produits sauvés</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Revenus récupérés</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Note</th>
                </tr>
              </thead>
              <tbody>
                {topStores.map((store) => (
                  <tr key={store.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 font-medium">{store.name}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        store.status === 'verified' ? 'bg-emerald-100 text-emerald-700' :
                        store.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>{store.status}</span>
                    </td>
                    <td className="py-3 text-right">{store.total_products_saved || 0}</td>
                    <td className="py-3 text-right font-medium">
                      {((store.total_revenue_recovered || 0) / 1000).toFixed(0)}k F
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-amber-500">★</span>
                        <span>{(store.rating || 0).toFixed(1)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </BackofficeLayout>
  );
}