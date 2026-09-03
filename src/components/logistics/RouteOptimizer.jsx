import React, { useState } from 'react';
import { api } from '@/api';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, MapPin, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function RouteOptimizer({ orders, onRouteCreated }) {
  const [optimizing, setOptimizing] = useState(false);

  const optimizeRoute = async () => {
    if (!orders || orders.length === 0) {
      toast.error('Aucune commande à optimiser');
      return;
    }

    setOptimizing(true);

    try {
      // Use AI to optimize the route
      const ordersData = orders.map(o => ({
        id: o.id,
        address: o.delivery_address,
        customer: o.customer_name,
        items_count: o.items?.length || 0,
        priority: calculatePriority(o)
      }));

      const response = await api.ai.routeOptimization(ordersData.map((o) => o.id));

      const optimizedRoute = response;

      // Create route entity
      const route = {
        driver_email: 'auto-assigned',
        route_name: `Route optimisée - ${new Date().toLocaleDateString()}`,
        order_ids: optimizedRoute.optimized_sequence.map(s => s.order_id),
        stops: optimizedRoute.optimized_sequence.map(s => {
          const order = orders.find(o => o.id === s.order_id);
          return {
            order_id: s.order_id,
            address: order.delivery_address,
            sequence: s.sequence,
            estimated_time: `${s.estimated_time_minutes} min`,
            completed: false
          };
        }),
        total_distance_km: optimizedRoute.total_distance_km,
        estimated_duration_minutes: optimizedRoute.total_duration_minutes,
        optimization_score: optimizedRoute.optimization_score,
        status: 'planned'
      };

      onRouteCreated(route, optimizedRoute.recommendations);
      toast.success(`Itinéraire optimisé ! Score: ${optimizedRoute.optimization_score}/100`);

    } catch (error) {
      console.error('Optimization error:', error);
      toast.error('Erreur lors de l\'optimisation');
    }

    setOptimizing(false);
  };

  const calculatePriority = (order) => {
    let priority = 3; // Default

    // Increase priority for older orders
    const hoursSinceOrder = (new Date() - new Date(order.created_date)) / (1000 * 60 * 60);
    if (hoursSinceOrder > 2) priority += 1;
    if (hoursSinceOrder > 4) priority += 1;

    // High value orders get priority
    if (order.total_amount > 20000) priority += 1;

    return Math.min(priority, 5);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 rounded-lg">
            <Zap className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="font-bold">Optimisation IA des tournées</h3>
            <p className="text-sm text-gray-500">
              {orders?.length || 0} commande(s) à optimiser
            </p>
          </div>
        </div>
        <Button
          onClick={optimizeRoute}
          disabled={optimizing || !orders || orders.length === 0}
          className="bg-purple-500 hover:bg-purple-600"
        >
          {optimizing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Optimisation...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Optimiser l'itinéraire
            </>
          )}
        </Button>
      </div>

      {orders && orders.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Commandes à traiter:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {orders.slice(0, 6).map((order) => (
              <div key={order.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-xs truncate">{order.customer_name}</span>
              </div>
            ))}
            {orders.length > 6 && (
              <div className="flex items-center justify-center p-2 bg-gray-50 rounded">
                <span className="text-xs text-gray-500">+{orders.length - 6} autres</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-purple-50 rounded-lg">
        <p className="text-xs text-purple-800">
          💡 L'IA analyse les adresses, priorités et charge pour créer l'itinéraire optimal
        </p>
      </div>
    </Card>
  );
}