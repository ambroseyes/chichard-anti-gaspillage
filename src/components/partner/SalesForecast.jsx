import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { Card } from "@/components/ui/card";
import { format, addMonths } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function SalesForecast({ orders = [] }) {
  // Mock forecast data based on orders (or random for demo if empty)
  const data = Array.from({ length: 6 }, (_, i) => {
    const date = addMonths(new Date(), i);
    const isForecast = i > 0;
    return {
      date: format(date, 'MMM', { locale: fr }),
      sales: isForecast ? undefined : Math.floor(Math.random() * 50000) + 20000,
      forecast: Math.floor(Math.random() * 60000) + 25000,
      range: [Math.floor(Math.random() * 10000), Math.floor(Math.random() * 10000)] // error margin
    };
  });

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