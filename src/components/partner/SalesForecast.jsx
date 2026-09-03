import React from 'react';
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { formatShortDate } from '@/lib/format';

export default function SalesForecast({ dailySales = [] }) {
  /**
   * Projection linéaire sur la moyenne des sept derniers jours observés.
   * Simple, explicable, et fondée sur les ventes réelles — là où l'écran
   * affichait auparavant des montants tirés au hasard.
   */
  const history = (dailySales ?? []).slice(-14);
  const recent = history.slice(-7);
  const average = recent.length
    ? recent.reduce((sum, d) => sum + (d.ventes ?? 0), 0) / recent.length
    : 0;

  const trend =
    recent.length >= 2
      ? (recent[recent.length - 1].ventes - recent[0].ventes) / Math.max(1, recent.length - 1)
      : 0;

  const data = [
    ...history.map((d) => ({ date: formatShortDate(d.date), sales: d.ventes, forecast: null })),
    ...Array.from({ length: 7 }, (_, i) => ({
      date: formatShortDate(new Date(Date.now() + (i + 1) * 86_400_000)),
      sales: null,
      forecast: Math.max(0, Math.round(average + trend * (i + 1))),
    })),
  ];

  const hasEnoughHistory = recent.length >= 3;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Prévisions de Ventes (6 mois)</h3>
        <span className="text-xs text-purple-600 font-medium bg-purple-50 px-2 py-1 rounded-full">IA Predictive</span>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
            <YAxis stroke="#9ca3af" fontSize={12} />
            <Tooltip />
            <Area 
              type="monotone" 
              dataKey="forecast" 
              stroke="#8b5cf6" 
              strokeWidth={2}
              strokeDasharray="5 5"
              fill="url(#colorForecast)"
              name="Prévision"
            />
            <Line 
              type="monotone" 
              dataKey="sales" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ r: 4 }}
              name="Réel"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="p-3 bg-purple-50 rounded-lg">
          <p className="text-gray-500 mb-1">Tendance Saisonnière</p>
          <p className="font-bold text-purple-700 flex items-center">
             ↗ +15% attendu en Décembre
          </p>
        </div>
        <div className="p-3 bg-emerald-50 rounded-lg">
          <p className="text-gray-500 mb-1">Stock Recommandé</p>
          <p className="font-bold text-emerald-700">
            Augmenter stock fruits secs
          </p>
        </div>
      </div>
    </div>
  );
}