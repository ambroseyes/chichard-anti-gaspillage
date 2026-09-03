import React, { useState } from 'react';
import { api } from '@/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck, Package, MapPin, Clock, CheckCircle, Store, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import QRCode from 'qrcode';
import RouteOptimizer from '@/components/logistics/RouteOptimizer';
import TimeSlotManager from '@/components/logistics/TimeSlotManager';
import { useAuth } from '@/lib/AuthContext';

export default function DeliveryManagement() {
  const { user } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deliveryType, setDeliveryType] = useState('delivery');
  const queryClient = useQueryClient();

  const { data: orders = [] } = useQuery({
    queryKey: ['pending-orders'],
    queryFn: () => api.entities.Order.filter({ status: 'pending' }, '-created_date'),
    enabled: !!user
  });

  const { data: pickupRequests = [] } = useQuery({
    queryKey: ['pickup-requests'],
    queryFn: () => api.entities.PickupRequest.filter({}, '-created_date'),
    enabled: !!user
  });

  const { data: deliveryRoutes = [] } = useQuery({
    queryKey: ['delivery-routes'],
    queryFn: () => api.entities.DeliveryRoute.list('-created_date'),
    enabled: !!user
  });

  const createPickupMutation = useMutation({
    mutationFn: async (orderData) => {
      // Le code de retrait est celui émis à la commande, côté serveur : on ne
      // fabrique pas un second code, qui divergerait de celui du client.
      const qrCodeUrl = await QRCode.toDataURL(
        JSON.stringify({ order_id: orderData.order_id, type: 'pickup' }),
      );

      return api.entities.PickupRequest.create({
        ...orderData,
        qr_code_url: qrCodeUrl,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pickup-requests'] });
      toast.success('Retrait confirmé');
    }
  });

  const updatePickupStatusMutation = useMutation({
    mutationFn: ({ id, status }) => api.entities.PickupRequest.update(id, { 
      status,
      ...(status === 'picked_up' ? { picked_up_at: new Date().toISOString() } : {}),
      ...(status === 'ready' ? { ready_at: new Date().toISOString() } : {})
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pickup-requests'] });
      toast.success('Statut mis à jour');
    }
  });

  const assignDeliveryMutation = useMutation({
    mutationFn: async ({ orderIds, driverEmail }) => {
      const selectedOrders = orders.filter(o => orderIds.includes(o.id));
      
      // Create delivery route
      const stops = selectedOrders.map((order, idx) => ({
        order_id: order.id,
        address: order.delivery_address,
        sequence: idx + 1,
        completed: false
      }));

      return api.entities.DeliveryRoute.create({
        driver_email: driverEmail,
        driver_name: 'Livreur', // TODO: Get from user
        route_name: `Route ${new Date().toLocaleDateString()}`,
        order_ids: orderIds,
        stops,
        status: 'planned',
        total_distance_km: 0, // TODO: Calculate
        estimated_duration_minutes: selectedOrders.length * 15
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-routes'] });
      queryClient.invalidateQueries({ queryKey: ['pending-orders'] });
      toast.success('Livraison assignée');
    }
  });

  const timeSlots = [
    '09:00 - 11:00',
    '11:00 - 13:00',
    '13:00 - 15:00',
    '15:00 - 17:00',
    '17:00 - 19:00'
  ];

  const pickupStatusConfig = {
    requested: { label: 'Demandé', color: 'bg-blue-100 text-blue-700' },
    confirmed: { label: 'Confirmé', color: 'bg-green-100 text-green-700' },
    ready: { label: 'Prêt', color: 'bg-purple-100 text-purple-700' },
    picked_up: { label: 'Retiré', color: 'bg-gray-100 text-gray-700' },
    cancelled: { label: 'Annulé', color: 'bg-red-100 text-red-700' }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-emerald-100 rounded-xl">
            <Truck className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Gestion des livraisons</h1>
            <p className="text-gray-500">Gérez les livraisons et retraits en magasin</p>
          </div>
        </div>

        <Tabs defaultValue="delivery" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="delivery">
              <Truck className="w-4 h-4 mr-2" />
              Livraisons
            </TabsTrigger>
            <TabsTrigger value="pickup">
              <Store className="w-4 h-4 mr-2" />
              Retraits
            </TabsTrigger>
            <TabsTrigger value="routes">
              <MapPin className="w-4 h-4 mr-2" />
              Itinéraires
            </TabsTrigger>
          </TabsList>

          {/* Delivery Tab */}
          <TabsContent value="delivery" className="space-y-4">
            {/* Route Optimizer */}
            <RouteOptimizer
              orders={orders.filter(o => o.delivery_type === 'delivery')}
              onRouteCreated={(route, recommendations) => {
                api.entities.DeliveryRoute.create(route).then(() => {
                  queryClient.invalidateQueries({ queryKey: ['delivery-routes'] });
                  if (recommendations?.length > 0) {
                    toast.info(
                      <div>
                        <p className="font-semibold mb-1">Recommandations:</p>
                        <ul className="text-sm space-y-1">
                          {recommendations.slice(0, 3).map((r, i) => (
                            <li key={i}>• {r}</li>
                          ))}
                        </ul>
                      </div>,
                      { duration: 8000 }
                    );
                  }
                });
              }}
            />

            <Card className="p-6">
              <h3 className="font-bold mb-4">Commandes en attente de livraison</h3>
              
              {orders.filter(o => o.delivery_type === 'delivery').length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Aucune livraison en attente
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.filter(o => o.delivery_type === 'delivery').map((order) => (
                    <Card key={order.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-semibold">{order.customer_name}</p>
                            <Badge className="bg-blue-100 text-blue-700">
                              <Package className="w-3 h-3 mr-1" />
                              {order.items?.length} article(s)
                            </Badge>
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              {order.delivery_address}
                            </p>
                            <p className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              {format(new Date(order.created_date), 'dd/MM/yyyy HH:mm')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-emerald-600">
                            {order.total_amount?.toLocaleString()} F
                          </p>
                          <Button 
                            size="sm" 
                            className="mt-2"
                            onClick={() => assignDeliveryMutation.mutate({ 
                              orderIds: [order.id], 
                              driverEmail: user.email 
                            })}
                          >
                            <Truck className="w-4 h-4 mr-1" />
                            Assigner
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Pickup Tab */}
          <TabsContent value="pickup" className="space-y-4">
            {/* Time Slot Manager */}
            {orders.filter(o => o.delivery_type === 'pickup').length === 0 && (
              <Card className="p-6 bg-blue-50">
                <TimeSlotManager
                  storeId={user?.store_id}
                  onSlotSelected={(slotData) => {
                    console.log('Slot selected:', slotData);
                  }}
                />
              </Card>
            )}

            <Card className="p-6">
              <h3 className="font-bold mb-4">Demandes de retrait en magasin</h3>
              
              {orders.filter(o => o.delivery_type === 'pickup').length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-3">Nouvelles commandes</h4>
                  <div className="space-y-3">
                    {orders.filter(o => o.delivery_type === 'pickup').map((order) => (
                      <Card key={order.id} className="p-4 bg-blue-50">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold">{order.customer_name}</p>
                            <p className="text-sm text-gray-600">{order.store_name}</p>
                            <Badge className="mt-2">Nouvelle commande</Badge>
                          </div>
                          <div className="space-y-2">
                            <Select onValueChange={(timeSlot) => {
                              createPickupMutation.mutate({
                                order_id: order.id,
                                customer_email: order.customer_email,
                                customer_name: order.customer_name,
                                store_id: order.store_id,
                                store_name: order.store_name,
                                items: order.items,
                                total_amount: order.total_amount,
                                pickup_time_slot: timeSlot,
                                pickup_date: new Date().toISOString().split('T')[0]
                              });
                            }}>
                              <SelectTrigger className="w-48">
                                <SelectValue placeholder="Choisir un créneau" />
                              </SelectTrigger>
                              <SelectContent>
                                {timeSlots.map((slot) => (
                                  <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              <h4 className="font-semibold mb-3">Retraits planifiés</h4>
              {pickupRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Aucun retrait planifié
                </div>
              ) : (
                <div className="space-y-3">
                  {pickupRequests.map((pickup) => {
                    const status = pickupStatusConfig[pickup.status];
                    
                    return (
                      <Card key={pickup.id} className="p-4">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <p className="font-semibold">{pickup.customer_name}</p>
                              <Badge className={status.color}>{status.label}</Badge>
                            </div>
                            <div className="space-y-1 text-sm text-gray-600">
                              <p className="flex items-center gap-2">
                                <Store className="w-4 h-4" />
                                {pickup.store_name}
                              </p>
                              <p className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {format(new Date(pickup.pickup_date), 'dd/MM/yyyy')} • {pickup.pickup_time_slot}
                              </p>
                              <p className="font-mono text-lg font-bold text-emerald-600 mt-2">
                                Code: {pickup.confirmation_code}
                              </p>
                            </div>
                          </div>
                          <div className="text-center">
                            {pickup.qr_code_url && (
                              <img src={pickup.qr_code_url} alt="QR Code" className="w-24 h-24 mb-2" />
                            )}
                            <p className="text-sm font-bold">{pickup.total_amount?.toLocaleString()} F</p>
                          </div>
                        </div>

                        {pickup.status !== 'picked_up' && pickup.status !== 'cancelled' && (
                          <div className="flex gap-2 pt-3 border-t">
                            {pickup.status === 'confirmed' && (
                              <Button
                                size="sm"
                                onClick={() => updatePickupStatusMutation.mutate({ id: pickup.id, status: 'ready' })}
                                className="bg-purple-500"
                              >
                                Marquer prêt
                              </Button>
                            )}
                            {pickup.status === 'ready' && (
                              <Button
                                size="sm"
                                onClick={() => updatePickupStatusMutation.mutate({ id: pickup.id, status: 'picked_up' })}
                                className="bg-green-500"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Confirmer retrait
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updatePickupStatusMutation.mutate({ id: pickup.id, status: 'cancelled' })}
                              className="text-red-500"
                            >
                              Annuler
                            </Button>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Routes Tab */}
          <TabsContent value="routes" className="space-y-4">
            <Card className="p-6">
              <h3 className="font-bold mb-4">Itinéraires de livraison</h3>
              
              {deliveryRoutes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Aucun itinéraire créé
                </div>
              ) : (
                <div className="space-y-3">
                  {deliveryRoutes.map((route) => (
                    <Card key={route.id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold">{route.route_name}</p>
                          <p className="text-sm text-gray-500">Livreur: {route.driver_name}</p>
                        </div>
                        <Badge className={
                          route.status === 'completed' ? 'bg-green-100 text-green-700' :
                          route.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }>
                          {route.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                        <div>
                          <p className="text-gray-500">Arrêts</p>
                          <p className="font-semibold">{route.order_ids?.length}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Distance</p>
                          <p className="font-semibold">{route.total_distance_km} km</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Durée estimée</p>
                          <p className="font-semibold">{route.estimated_duration_minutes} min</p>
                        </div>
                      </div>

                      {route.stops && (
                        <div className="space-y-2 pt-3 border-t">
                          {route.stops.map((stop, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                stop.completed ? 'bg-green-500 text-white' : 'bg-gray-200'
                              }`}>
                                {stop.completed ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                              </div>
                              <span className={stop.completed ? 'line-through text-gray-400' : ''}>
                                {stop.address}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}