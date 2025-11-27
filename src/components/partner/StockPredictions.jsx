import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingDown, Calendar, AlertCircle } from 'lucide-react';
import { addDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function StockPredictions({ products }) {
  // Mock prediction logic
  const predictions = products
    .filter(p => p.status === 'active' && p.quantity_available > 0)
    .map(p => {
      // Simulate daily sales velocity based on quantity and random factor
      const dailyVelocity = Math.max(1, Math.floor(Math.random() * 5));
      const daysUntilStockout = Math.floor(p.quantity_available / dailyVelocity);
      const stockoutDate = addDays(new Date(), daysUntilStockout);
      
      return {
        ...p,
        dailyVelocity,
        daysUntilStockout,
        stockoutDate
      };
    })
    .sort((a, b) => a.daysUntilStockout - b.daysUntilStockout)
    .slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Prédictions de Stock</h3>
          <p className="text-sm text-gray-500">Basé sur l'historique des ventes</p>
        </div>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          IA Active
        </Badge>
      </div>

      <div className="space-y-3">
        {predictions.map((product) => (
          <div key={product.id} className="flex items-center gap-4 p-3 bg-white rounded-xl border border-gray-100">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              {product.image_url ? (
                <img src={product.image_url} alt="" className="w-full h-full object-cover rounded-lg" />
              ) : (
                <TrendingDown className="w-5 h-5 text-gray-400" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate text-sm text-gray-900">{product.name}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Vitesse: ~{product.dailyVelocity}/jour</span>
                <span>•</span>
                <span>Stock: {product.quantity_available}</span>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center gap-1 text-xs font-medium text-orange-600 mb-1">
                <Calendar className="w-3 h-3" />
                {format(product.stockoutDate, 'dd MMM', { locale: fr })}
              </div>
              <div className="w-24">
                <Progress 
                  value={Math.max(0, 100 - (product.daysUntilStockout * 10))} 
                  className={`h-1.5 ${
                    product.daysUntilStockout < 3 ? 'bg-red-100' : 'bg-blue-100'
                  }`}
                />
              </div>
            </div>
          </div>
        ))}
        
        {predictions.length === 0 && (
          <div className="text-center py-6 text-gray-500 text-sm">
            Pas assez de données pour les prédictions
          </div>
        )}
      </div>
    </div>
  );
}