import React from 'react';
import { api } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { TrendingUp, TrendingDown, RefreshCw, Package, AlertTriangle } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const movementIcons = {
  in: TrendingUp,
  out: TrendingDown,
  adjustment: RefreshCw,
  return: Package,
  waste: AlertTriangle
};

const movementColors = {
  in: 'text-green-600 bg-green-100',
  out: 'text-blue-600 bg-blue-100',
  adjustment: 'text-orange-600 bg-orange-100',
  return: 'text-purple-600 bg-purple-100',
  waste: 'text-red-600 bg-red-100'
};

export default function StockHistoryViewer({ productId }) {
  const { data: movements = [], isLoading } = useQuery({
    queryKey: ['stock-movements', productId],
    queryFn: () => api.entities.StockMovement.filter({ product_id: productId }, '-created_date', 50),
    enabled: !!productId
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    );
  }

  if (movements.length === 0) {
    return (
      <Card className="p-6 text-center text-gray-500">
        Aucun mouvement de stock enregistré
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold mb-3">Historique des mouvements de stock</h3>
      {movements.map((movement) => {
        const Icon = movementIcons[movement.movement_type] || Package;
        const colorClass = movementColors[movement.movement_type] || 'text-gray-600 bg-gray-100';
        
        return (
          <Card key={movement.id} className="p-4">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${colorClass}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <p className="font-medium capitalize">{movement.reason || movement.movement_type}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(movement.created_date), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                    </p>
                  </div>
                  <Badge variant="outline" className="font-mono">
                    {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Stock: {movement.previous_quantity} → {movement.new_quantity}</span>
                  {movement.reference && (
                    <span className="text-xs">Réf: {movement.reference}</span>
                  )}
                </div>
                {movement.notes && (
                  <p className="text-sm text-gray-500 mt-1">{movement.notes}</p>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}