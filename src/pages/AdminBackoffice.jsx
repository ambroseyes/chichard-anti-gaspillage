import React, { useState, useEffect } from 'react';
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
  AreaChart, Area, BarChart, Bar, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { goToLogin } from '@/lib/navigation';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'];

const KPICard = ({ title, value, unit, change, icon: KPIIcon, color, delay = 0 }) => {
  const isPositive = change >= 0;
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Card className="p-5 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2.5 rounded-lg ${color}`}>
            <KPIIcon className="w-5 h-5 text-white" />
          </div>
          <div className={`flex items-center gap-1 text-xs font-semibold ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
            {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(change)}%
          </div>
        </div>
        <p className="text-2xl font-bold text-gray-900">{value} <span className="text-sm font-normal text-gray-400">{unit}</span></p>
        <p className="text-sm text-gray-500 mt-1">{title}</p>
      </Card>
    </motion.div>
  );
};

export default function AdminBackoffice() {
  const [user, setUser] = useState(null);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    api.auth.me().then(setUser).catch(() => goToLogin());
  }, []);

  const { data: orders = [] } = useQuery({
    queryKey: ['bo-orders'],
    queryFn: () => api.entities.Order.list('-created_date', 200)
  });

  const { data: products = [] } = useQuery({
    queryKey: ['bo-products'],
    queryFn: () => api.entities.Product.list('-created_date', 100)
  });

  const { data: stores = [] } = useQuery({
    queryKey: ['bo-stores'],
    queryFn: () => api.entities.Store.list()
  });

  const { data: users = [] } = useQuery({
    queryKey: ['bo-users'],
    queryFn: () => api.entities.User.list()
  });

  // KPI calculations
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const confirmedOrders = orders.filter(o => o.status !== 'cancelled');
  const conversionRate = orders.length > 0 ? ((confirmedOrders.length / orders.length) * 100).toFixed(1) : 0;
  const activeProducts = products.filter(p => p.status === 'active').length;
  const verifiedStores = stores.filter(s => s.status === 'verified').length;

  // Trend data (last N days)
  const trendDays = parseInt(period);
  const trendData = [...Array(Math.min(trendDays, 30))].map((_, i) => {
    const date = subDays(new Date(), trendDays - 1 - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayOrders = orders.filter(o => o.created_date?.startsWith(dateStr));
    return {
      date: format(date, 'dd MMM', { locale: fr }),
      commandes: dayOrders.length,
      revenue: Math.round(dayOrders.reduce((s, o) => s + (o.total_amount || 0), 0) / 1000)
    };
  });

  // Category distribution
  const categoryData = Object.entries(
    products.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + (p.quantity_sold || 0);
      return acc;
    }, {})
  ).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value })).slice(0, 6);

  // Recent orders
  const recentOrders = orders.slice(0, 8);

  // Order status distribution
  const statusData = [
    { name: 'Confirmées', value: orders.filter(o => o.status === 'confirmed').length, color: '#10b981' },
    { name: 'En attente', value: orders.filter(o => o.status === 'pending').length, color: '#f59e0b' },
    { name: 'Livrées', value: orders.filter(o => o.status === 'delivered').length, color: '#6366f1' },
    { name: 'Annulées', value: orders.filter(o => o.status === 'cancelled').length, color: '#ef4444' },
  ].filter(d => d.value > 0);

  return (
    <BackofficeLayout currentPage="Tableau de bord">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Tableau de bord</h1>
            <p className="text-sm text-gray-500">Vue temps réel • {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}</p>
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
          <KPICard title="Revenus totaux" value={(totalRevenue / 1000).toFixed(0)} unit="k FCFA" change={12.4} icon={DollarSign} color="bg-indigo-500" delay={0} />
          <KPICard title="Commandes" value={orders.length} unit="total" change={8.2} icon={ShoppingCart} color="bg-purple-500" delay={0.05} />
          <KPICard title="Taux de conversion" value={conversionRate} unit="%" change={-2.1} icon={TrendingUp} color="bg-pink-500" delay={0.1} />
          <KPICard title="Magasins actifs" value={verifiedStores} unit={`/ ${stores.length}`} icon={Activity} color="bg-emerald-500" delay={0.15} />
        </div>

        {/* Secondary KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard title="Produits actifs" value={activeProducts} unit="produits" change={5.6} icon={Package} color="bg-blue-500" delay={0.2} />
          <KPICard title="Utilisateurs" value={users.length} unit="inscrits" change={14.8} icon={Users} color="bg-orange-500" delay={0.25} />
          <KPICard title="Commandes livrées" value={orders.filter(o => o.status === 'delivered').length} unit="" change={19.2} icon={Zap} color="bg-teal-500" delay={0.3} />
          <KPICard title="Alertes actives" value={products.filter(p => p.urgency_level === 'critical').length} unit="critiques" change={-4.3} icon={AlertTriangle} color="bg-red-500" delay={0.35} />
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
            <h3 className="font-semibold text-gray-900 mb-4">Ventes par catégorie</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" name="Qté vendue" radius={[0, 4, 4, 0]}>
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
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
                    <p className="text-sm font-bold">{(order.total_amount || 0).toLocaleString()} F</p>
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
                {stores.slice(0, 8).map((store) => (
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