import React, { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, PieChart, Pie, Cell
} from 'recharts';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, LineChart as LineIcon, PieChart as PieIcon, TrendingUp } from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdvancedChart({ data, title, type = 'line', dataKeys = [], period = '7d', onPeriodChange }) {
  const [chartType, setChartType] = useState(type);
  const [selectedPeriod, setSelectedPeriod] = useState(period);
  const [selectedMetric, setSelectedMetric] = useState(dataKeys[0] || '');

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload) return null;

    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="font-semibold mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600">{entry.name}:</span>
            <span className="font-semibold">{entry.value?.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (chartType) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {dataKeys.map((key, idx) => (
              <Bar key={key} dataKey={key} fill={COLORS[idx % COLORS.length]} radius={[8, 8, 0, 0]} />
            ))}
          </BarChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <defs>
              {dataKeys.map((key, idx) => (
                <linearGradient key={key} id={`color${idx}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS[idx % COLORS.length]} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={COLORS[idx % COLORS.length]} stopOpacity={0}/>
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {dataKeys.map((key, idx) => (
              <Area 
                key={key} 
                type="monotone" 
                dataKey={key} 
                stroke={COLORS[idx % COLORS.length]}
                fill={`url(#color${idx})`}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        );

      case 'pie':
        const pieData = data.map((item, idx) => ({
          name: item.name || item.date,
          value: item[dataKeys[0]] || 0
        }));
        return (
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        );

      default: // line
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {dataKeys.map((key, idx) => (
              <Line 
                key={key} 
                type="monotone" 
                dataKey={key} 
                stroke={COLORS[idx % COLORS.length]}
                strokeWidth={3}
                dot={{ fill: COLORS[idx % COLORS.length], r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {['7d', '30d', '90d'].map((p) => (
              <Button
                key={p}
                size="sm"
                variant={selectedPeriod === p ? 'default' : 'ghost'}
                onClick={() => {
                  setSelectedPeriod(p);
                  onPeriodChange?.(p);
                }}
                className="h-7 px-3"
              >
                {p}
              </Button>
            ))}
          </div>

          {/* Chart type selector */}
          <div className="flex gap-1 border rounded-lg p-1">
            {[
              { type: 'line', icon: LineIcon },
              { type: 'bar', icon: BarChart3 },
              { type: 'area', icon: TrendingUp }
            ].map(({ type: t, icon: Icon }) => (
              <button
                key={t}
                onClick={() => setChartType(t)}
                className={`p-1.5 rounded transition-colors ${
                  chartType === t 
                    ? 'bg-emerald-100 text-emerald-600' 
                    : 'hover:bg-gray-100 text-gray-400'
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        {renderChart()}
      </ResponsiveContainer>

      {/* Stats summary with trends */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t">
        {dataKeys.slice(0, 3).map((key, idx) => {
          const total = data.reduce((sum, item) => sum + (item[key] || 0), 0);
          const avg = total / data.length;
          
          // Calculate trend
          const mid = Math.floor(data.length / 2);
          const firstHalf = data.slice(0, mid).reduce((sum, item) => sum + (item[key] || 0), 0) / mid;
          const secondHalf = data.slice(mid).reduce((sum, item) => sum + (item[key] || 0), 0) / (data.length - mid);
          const trend = ((secondHalf - firstHalf) / firstHalf * 100) || 0;
          const isPositive = trend > 0;
          
          return (
            <button 
              key={key} 
              onClick={() => setSelectedMetric(key)}
              className={`text-center p-2 rounded-lg transition-all ${
                selectedMetric === key ? 'bg-emerald-50 border border-emerald-200' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                <p className="text-xs text-gray-600 capitalize">{key}</p>
              </div>
              <p className="text-lg font-bold">{avg.toFixed(0)}</p>
              <div className="flex items-center justify-center gap-1 text-xs">
                <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
                  {isPositive ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}