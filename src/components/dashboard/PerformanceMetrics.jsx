import React from 'react';
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function PerformanceMetrics({ metrics }) {
  if (!metrics || metrics.length === 0) return null;

  const getTrendIcon = (trend) => {
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getTrendColor = (trend) => {
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metrics.map((metric, idx) => (
        <Card key={idx} className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-start justify-between mb-2">
            <div className={`p-2 rounded-lg ${metric.bgColor || 'bg-gray-100'}`}>
              {metric.icon}
            </div>
            {metric.trend !== undefined && (
              <div className="flex items-center gap-1">
                {getTrendIcon(metric.trend)}
                <span className={`text-xs font-semibold ${getTrendColor(metric.trend)}`}>
                  {Math.abs(metric.trend)}%
                </span>
              </div>
            )}
          </div>
          <p className="text-2xl font-bold mb-1">{metric.value}</p>
          <p className="text-sm text-gray-600">{metric.label}</p>
          {metric.subtitle && (
            <p className="text-xs text-gray-500 mt-1">{metric.subtitle}</p>
          )}
        </Card>
      ))}
    </div>
  );
}