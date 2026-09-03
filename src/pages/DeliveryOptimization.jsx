import React, { useState, useEffect } from 'react';
import { api } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Truck, MapPin, Clock, Route, Package,
  Navigation, Phone, CheckCircle,
  Zap
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import { goToLogin } from '@/lib/navigation';

export default function DeliveryOptimization() {
  const [user, setUser] = useState(null);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await api.auth.me();
        setUser(userData);
      } catch (e) {
        goToLogin();
      }
    };
    loadUser();
  }, []);

  const { data: orders = [] } = useQuery({
    queryKey: ['delivery-orders'],
    queryFn: () => api.entities.Order.filter({ status: 'ready', delivery_type: 'delivery' }),
  });

  const optimizeRoute = async () => {
    setIsOptimizing(true);
    
    // Simulate AI optimization
    const result = await api.ai.routeOptimization(orders.map((o) => o.id));

    setOptimizedRoute(result);
    setIsOptimizing(false);
    toast.success('Tournée optimisée par IA !');
  };

  const updateDeliveryStatus = async (orderId, status) => {
    await api.entities.Order.update(orderId, { status });
    toast.success(status === 'delivered' ? 'Livraison confirmée !' : 'Statut mis à jour');
  };

  // Group orders by zone (mock zones based on address)
  const groupedOrders = orders.reduce((acc, order) => {
    const zone = order.delivery_address?.includes('Akwa') ? 'Akwa' :
                 order.delivery_address?.includes('Bonapriso') ? 'Bonapriso' :
                 order.delivery_address?.includes('Bonanjo') ? 'Bonanjo' : 'Autres';
    if (!acc[zone]) acc[zone] = [];
    acc[zone].push(order);
    return acc;
  }, {});

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Truck className="w-7 h-7" />
                Optimisation Livraisons
              </h1>
              <p className="text-blue-100">IA de tournées intelligentes</p>
            </div>
            <div className="flex gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-center">
                <p className="text-2xl font-bold">{orders.length}</p>
                <p className="text-xs text-blue-100">À livrer</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-center">
                <p className="text-2xl font-bold">{Object.keys(groupedOrders).length}</p>
                <p className="text-xs text-blue-100">Zones</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* AI Optimization Card */}
        <Card className="p-6 bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 rounded-xl">
                <Zap className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Optimisation IA des tournées</h3>
                <p className="text-sm text-gray-500">Regroupement par zone + calcul route optimale</p>
              </div>
            </div>
            <Button
              onClick={optimizeRoute}
              disabled={isOptimizing || orders.length === 0}
              className="bg-indigo-500 hover:bg-indigo-600"
            >
              {isOptimizing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Optimisation...
                </>
              ) : (
                <>
                  <Route className="w-4 h-4 mr-2" />
                  Optimiser la tournée
                </>
              )}
            </Button>
          </div>

          {optimizedRoute && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid md:grid-cols-4 gap-4 mt-4"
            >
              <div className="bg-white rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-indigo-600">{optimizedRoute.total_distance_km || 12}km</p>
                <p className="text-xs text-gray-500">Distance totale</p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-indigo-600">{optimizedRoute.total_time_minutes || 45}min</p>
                <p className="text-xs text-gray-500">Temps estimé</p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-indigo-600">{optimizedRoute.zones_count || 3}</p>
                <p className="text-xs text-gray-500">Zones regroupées</p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-emerald-600">{optimizedRoute.efficiency_score || 87}%</p>
                <p className="text-xs text-gray-500">Score efficacité</p>
              </div>
            </motion.div>
          )}
        </Card>

        {/* Orders by Zone */}
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">Toutes ({orders.length})</TabsTrigger>
            {Object.entries(groupedOrders).map(([zone, zoneOrders]) => (
              <TabsTrigger key={zone} value={zone}>
                {zone} ({zoneOrders.length})
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <div className="space-y-4">
              {orders.map((order, idx) => (
                <DeliveryCard 
                  key={order.id} 
                  order={order} 
                  index={idx + 1}
                  onUpdateStatus={updateDeliveryStatus}
                />
              ))}
              {orders.length === 0 && (
                <Card className="p-12 text-center">
                  <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Aucune livraison en attente</h3>
                  <p className="text-gray-500">Les nouvelles commandes apparaîtront ici</p>
                </Card>
              )}
            </div>
          </TabsContent>

          {Object.entries(groupedOrders).map(([zone, zoneOrders]) => (
            <TabsContent key={zone} value={zone} className="mt-4">
              <div className="space-y-4">
                {zoneOrders.map((order, idx) => (
                  <DeliveryCard 
                    key={order.id} 
                    order={order} 
                    index={idx + 1}
                    onUpdateStatus={updateDeliveryStatus}
                  />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}

function DeliveryCard({ order, index, onUpdateStatus }) {
  const [showProof, setShowProof] = useState(false);

  return (
    <Card className="p-4">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
          {index}
        </div>
        
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="font-semibold text-gray-900">{order.customer_name}</h4>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {order.delivery_address || 'Adresse non spécifiée'}
              </p>
            </div>
            <Badge className="bg-blue-100 text-blue-700">
              #{order.id?.slice(-6)}
            </Badge>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
            <span className="flex items-center gap-1">
              <Package className="w-4 h-4" />
              {order.items?.length || 0} articles
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              ~15 min
            </span>
            <span className="font-medium text-gray-900">
              {order.total_amount?.toLocaleString()} FCFA
            </span>
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1">
              <Phone className="w-4 h-4 mr-1" />
              Appeler
            </Button>
            <Button size="sm" variant="outline" className="flex-1">
              <Navigation className="w-4 h-4 mr-1" />
              Itinéraire
            </Button>
            <Button 
              size="sm" 
              className="flex-1 bg-emerald-500 hover:bg-emerald-600"
              onClick={() => onUpdateStatus(order.id, 'delivered')}
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Livré
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}