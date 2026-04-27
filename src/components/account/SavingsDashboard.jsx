import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';
import { TrendingUp, Leaf, ShoppingBag } from 'lucide-react';
import { format, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';

const CustomTooltipSavings = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {p.value?.toLocaleString()} {p.name === 'CO₂ évité' ? 'kg' : 'FCFA'}
        </p>
      ))}
    </div>
  );
};

export default function SavingsDashboard({ orders, user }) {
  // Build monthly data from orders (last 6 months)
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(now, 5 - i);
    return {
      label: format(d, 'MMM', { locale: fr }),
      year: d.getFullYear(),
      month: d.getMonth(),
      savings: 0,
      co2: 0,
      orders: 0,
    };
  });

  orders.forEach(order => {
    const d = new Date(order.created_date);
    const bucket = months.find(m => m.year === d.getFullYear() && m.month === d.getMonth());
    if (bucket) {
      bucket.savings += order.total_savings || 0;
      bucket.co2 += (order.items?.length || 0) * 0.5;
      bucket.orders += 1;
    }
  });

  const chartData = months.map(m => ({
    name: m.label,
    'Économies': Math.round(m.savings),
    'CO₂ évité': parseFloat(m.co2.toFixed(1)),
    'Commandes': m.orders,
  }));

  const totalSavings = user?.total_savings || orders.reduce((s, o) => s + (o.total_savings || 0), 0);
  const totalCO2 = user?.waste_avoided_kg || orders.length * 0.5;
  const totalOrders = user?.total_orders || orders.length;

  const kpis = [
    { label: 'Économies totales', value: `${Math.round(totalSavings).toLocaleString()} FCFA`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'CO₂ évité', value: `${totalCO2.toFixed(1)} kg`, icon: Leaf, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'Commandes', value: totalOrders, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card className="p-4 flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${kpi.bg}`}>
                  <Icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{kpi.label}</p>
                  <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Savings chart */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Économies mensuelles</h3>
          <Badge className="bg-emerald-100 text-emerald-700">6 derniers mois</Badge>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltipSavings />} />
            <Area
              type="monotone"
              dataKey="Économies"
              stroke="#10b981"
              strokeWidth={2.5}
              fill="url(#savingsGrad)"
              dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* CO2 + orders chart */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Impact environnemental & activité</h3>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltipSavings />} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            <Bar dataKey="CO₂ évité" fill="#14b8a6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Commandes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}