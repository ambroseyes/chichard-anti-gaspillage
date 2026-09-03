import React, { useMemo, useState } from 'react';
import { differenceInDays, format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { Leaf, TrendingUp, DollarSign, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const CATEGORY_LABELS = {
  fruits_legumes: 'Fruits & Légumes',
  produits_laitiers: 'Produits laitiers',
  viandes_poissons: 'Viandes & Poissons',
  boulangerie: 'Boulangerie',
  epicerie: 'Épicerie',
  boissons: 'Boissons',
  surgeles: 'Surgelés',
  hygiene: 'Hygiène',
  conserves: 'Conserves',
  condiments: 'Condiments',
};

const CATEGORY_COLORS = [
  '#10B981', '#3B82F6', '#F59E0B', '#EF4444',
  '#8B5CF6', '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#6B7280',
];

// Approx: 1kg saved = 2.5 kg CO2 avoided
const KG_PER_UNIT = 0.5; // average product weight in kg
const CO2_PER_KG = 2.5;

export default function FoodSavingsDashboard({ products }) {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedMonths] = useState(6);

  const months = useMemo(() =>
    Array.from({ length: selectedMonths }, (_, i) => subMonths(new Date(), selectedMonths - 1 - i)),
    [selectedMonths]
  );

  // Monthly savings data
  const monthlyData = useMemo(() => {
    return months.map(month => {
      const start = startOfMonth(month);
      const end = endOfMonth(month);

      const inRange = products.filter(p => {
        const created = new Date(p.created_date || Date.now());
        return isWithinInterval(created, { start, end });
      });

      const soldUnits = inRange.reduce((s, p) => s + (p.quantity_sold || 0), 0);
      const kgSaved = soldUnits * KG_PER_KG_PER_UNIT();
      const savings = inRange.reduce((s, p) => {
        const unitSaving = (p.original_price || 0) - (p.discounted_price || 0);
        return s + unitSaving * (p.quantity_sold || 0);
      }, 0);
      const co2 = kgSaved * CO2_PER_KG;

      return {
        month: format(month, 'MMM yy', { locale: fr }),
        kgSaved: Math.round(kgSaved * 10) / 10,
        economiesFCFA: Math.round(savings),
        co2: Math.round(co2 * 10) / 10,
        products: inRange.length,
      };
    });
  }, [products, months]);

  // Expiration trends by category
  const expirationByCategory = useMemo(() => {
    const map = {};
    products.forEach(p => {
      const cat = p.category || 'epicerie';
      const daysLeft = differenceInDays(new Date(p.expiration_date || Date.now()), new Date());
      if (!map[cat]) map[cat] = { soon: 0, ok: 0, expired: 0, total: 0 };
      map[cat].total++;
      if (daysLeft < 0) map[cat].expired++;
      else if (daysLeft <= 5) map[cat].soon++;
      else map[cat].ok++;
    });
    return Object.entries(map).map(([cat, v], i) => ({
      name: CATEGORY_LABELS[cat] || cat,
      ...v,
      fill: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    }));
  }, [products]);

  // Total KPIs
  const totals = useMemo(() => {
    const soldUnits = products.reduce((s, p) => s + (p.quantity_sold || 0), 0);
    const kgSaved = soldUnits * KG_PER_KG_PER_UNIT();
    const savings = products.reduce((s, p) => {
      const unitSaving = (p.original_price || 0) - (p.discounted_price || 0);
      return s + unitSaving * (p.quantity_sold || 0);
    }, 0);
    return { soldUnits, kgSaved: Math.round(kgSaved * 10) / 10, savings: Math.round(savings), co2: Math.round(kgSaved * CO2_PER_KG * 10) / 10 };
  }, [products]);

  function KG_PER_KG_PER_UNIT() { return KG_PER_UNIT; }

  const kpiCards = [
    { icon: Leaf, label: 'Nourriture sauvée', value: `${totals.kgSaved} kg`, sub: `${totals.soldUnits} unités vendues`, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { icon: DollarSign, label: 'Économies clients', value: `${totals.savings.toLocaleString()} F`, sub: 'vs prix original', color: 'text-blue-500', bg: 'bg-blue-50' },
    { icon: TrendingUp, label: 'CO₂ évité', value: `${totals.co2} kg`, sub: '≈ 2.5 kg CO₂/kg aliment', color: 'text-purple-500', bg: 'bg-purple-50' },
    { icon: AlertTriangle, label: 'Produits à risque', value: expirationByCategory.reduce((s, c) => s + c.soon, 0), sub: 'expirent dans ≤ 5 jours', color: 'text-orange-500', bg: 'bg-orange-50' },
  ];

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Leaf className="w-5 h-5 text-emerald-500" />
          <span className="font-semibold text-gray-800">Impact Anti-Gaspillage</span>
          <Badge className="bg-emerald-100 text-emerald-700">{totals.kgSaved} kg sauvés</Badge>
        </div>
        {collapsed ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
      </button>

      {!collapsed && (
        <div className="px-6 pb-6 space-y-6">
          {/* KPI grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {kpiCards.map(({ icon: KpiIcon, label, value, sub, color, bg }) => (
              <div key={label} className={`${bg} rounded-xl p-3`}>
                <KpiIcon className={`w-5 h-5 ${color} mb-1`} />
                <p className="text-xl font-bold text-gray-900">{value}</p>
                <p className="text-xs font-medium text-gray-600">{label}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          {/* Monthly food saved + savings */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Nourriture sauvée & économies / mois</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'kgSaved') return [`${value} kg`, 'Kg sauvés'];
                    if (name === 'economiesFCFA') return [`${value.toLocaleString()} F`, 'Économies'];
                    return [value, name];
                  }}
                />
                <Bar yAxisId="left" dataKey="kgSaved" fill="#10B981" radius={[4, 4, 0, 0]} name="kgSaved" />
                <Bar yAxisId="right" dataKey="economiesFCFA" fill="#3B82F6" radius={[4, 4, 0, 0]} name="economiesFCFA" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* CO2 trend line */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Tendance CO₂ évité (kg)</p>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v} kg CO₂`, 'Évité']} />
                <Line type="monotone" dataKey="co2" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3, fill: '#8B5CF6' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Expiration by category */}
          {expirationByCategory.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">Tendances péremption par catégorie</p>
              <div className="space-y-2">
                {expirationByCategory.sort((a, b) => b.soon - a.soon).map(cat => (
                  <div key={cat.name} className="flex items-center gap-3">
                    <div className="w-28 text-xs text-gray-600 truncate flex-shrink-0">{cat.name}</div>
                    <div className="flex-1 flex rounded-full overflow-hidden h-4">
                      {cat.expired > 0 && (
                        <div
                          className="bg-red-400 flex items-center justify-center text-[9px] text-white font-bold"
                          style={{ width: `${(cat.expired / cat.total) * 100}%` }}
                        >{cat.expired}</div>
                      )}
                      {cat.soon > 0 && (
                        <div
                          className="bg-orange-400 flex items-center justify-center text-[9px] text-white font-bold"
                          style={{ width: `${(cat.soon / cat.total) * 100}%` }}
                        >{cat.soon}</div>
                      )}
                      {cat.ok > 0 && (
                        <div
                          className="bg-emerald-400 flex items-center justify-center text-[9px] text-white font-bold"
                          style={{ width: `${(cat.ok / cat.total) * 100}%` }}
                        >{cat.ok}</div>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 w-8 text-right">{cat.total}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-red-400 inline-block"></span>Expiré</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-orange-400 inline-block"></span>≤5j</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-400 inline-block"></span>OK</span>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}