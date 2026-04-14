import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Truck, Package, MapPin, Phone, Navigation, CheckCircle,
  Clock, Camera, FileSignature, AlertTriangle, User, Loader2,
  QrCode, Map
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from 'sonner';
import LiveDeliveryMap from '@/components/delivery/LiveDeliveryMap';
import EnhancedQRScanner from '@/components/delivery/EnhancedQRScanner';
import DeliveryNotifications from '@/components/delivery/DeliveryNotifications';
import WidgetCustomizer from '@/components/dashboard/WidgetCustomizer';
import SmartAlert from '@/components/dashboard/SmartAlert';
import { BarChart3, RefreshCw, Gauge } from 'lucide-react';
import DeliveryChat from '@/components/delivery/DeliveryChat';
import MultiBulkScanner from '@/components/delivery/MultiBulkScanner';
import GoogleDirectionsMap from '@/components/delivery/GoogleDirectionsMap';

const STATUS_FLOW = {
  assigned:    { next: 'picked_up',   label: 'Récupérer',    btnClass: 'bg-blue-500 hover:bg-blue-600' },
  confirmed:   { next: 'picked_up',   label: 'Récupérer',    btnClass: 'bg-blue-500 hover:bg-blue-600' },
  picked_up:   { next: 'on_the_way',  label: 'En route',     btnClass: 'bg-orange-500 hover:bg-orange-600' },
  on_the_way:  { next: 'delivered',   label: 'Livré ✓',      btnClass: 'bg-green-500 hover:bg-green-600' },
};

const statusConfig = {
  assigned:    { label: 'Assignée',    color: 'bg-indigo-100 text-indigo-700',  icon: Package },
  confirmed:   { label: 'À récupérer', color: 'bg-blue-100 text-blue-700',     icon: Package },
  picked_up:   { label: 'Récupérée',  color: 'bg-yellow-100 text-yellow-700', icon: Truck },
  on_the_way:  { label: 'En route',   color: 'bg-orange-100 text-orange-700', icon: Navigation },
  delivered:   { label: 'Livré',      color: 'bg-green-100 text-green-700',   icon: CheckCircle },
  failed:      { label: 'Échec',      color: 'bg-red-100 text-red-700',       icon: AlertTriangle },
  cancelled:   { label: 'Annulée',    color: 'bg-gray-100 text-gray-500',     icon: AlertTriangle },
};

// Haversine distance in meters
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getOrderCoords(order) {
  return {
    lat: order.delivery_lat || 0,
    lng: order.delivery_lng || 0,
  };
}

// Nearest Neighbor heuristic starting from courier position
function nearestNeighborSort(origin, stops) {
  if (!origin || !stops.length) return stops;
  const remaining = [...stops];
  const sorted = [];
  let current = origin;
  while (remaining.length > 0) {
    let minDist = Infinity, minIdx = 0;
    remaining.forEach((s, i) => {
      const c = getOrderCoords(s);
      const d = haversine(current.lat, current.lng, c.lat, c.lng);
      if (d < minDist) { minDist = d; minIdx = i; }
    });
    sorted.push(remaining.splice(minIdx, 1)[0]);
    const c = getOrderCoords(sorted[sorted.length - 1]);
    current = c;
  }
  return sorted;
}

// 2-opt local search improvement
function twoOpt(origin, route) {
  if (route.length < 3) return route;
  let improved = true;
  let best = [...route];
  const dist = (a, b) => {
    const ca = getOrderCoords(a), cb = getOrderCoords(b);
    return haversine(ca.lat, ca.lng, cb.lat, cb.lng);
  };
  const totalDist = (r) => {
    let d = haversine(origin.lat, origin.lng, getOrderCoords(r[0]).lat, getOrderCoords(r[0]).lng);
    for (let i = 0; i < r.length - 1; i++) d += dist(r[i], r[i + 1]);
    return d;
  };
  while (improved) {
    improved = false;
    for (let i = 0; i < best.length - 1; i++) {
      for (let j = i + 1; j < best.length; j++) {
        const candidate = [...best.slice(0, i), ...best.slice(i, j + 1).reverse(), ...best.slice(j + 1)];
        if (totalDist(candidate) < totalDist(best)) {
          best = candidate;
          improved = true;
        }
      }
    }
  }
  return best;
}

function optimizeRoute(origin, stops) {
  if (!origin || !stops.length) return stops;
  const nn = nearestNeighborSort(origin, stops);
  return twoOpt(origin, nn);
}

function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export default function DriverDashboard() {
  const [user, setUser] = useState(null);
  const [courierPos, setCourierPos] = useState(null);
  const lastOptimizeTime = useRef(0);
  const lastOptimizePos = useRef(null);
  const [optimizedPickup, setOptimizedPickup] = useState([]);
  const [optimizedDelivery, setOptimizedDelivery] = useState([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showProofModal, setShowProofModal] = useState(false);
  const [signature, setSignature] = useState('');
  const [proofPhoto, setProofPhoto] = useState(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [showBulkScanner, setShowBulkScanner] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        if (!userData.is_delivery_driver) {
          navigate(createPageUrl('Home'));
        }
      } catch (e) {
        base44.auth.redirectToLogin();
      }
    };
    loadUser();
  }, []);

  // GPS live tracking
  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      pos => {
        const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCourierPos(prev => {
          // Throttle: only update if moved >250m or >60s
          if (prev) {
            const moved = haversine(prev.lat, prev.lng, newPos.lat, newPos.lng);
            const elapsed = Date.now() - lastOptimizeTime.current;
            if (moved < 250 && elapsed < 60000) return prev;
          }
          return newPos;
        });
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Throttled route optimization
  const runOptimization = useCallback((pos, orderList) => {
    const now = Date.now();
    if (now - lastOptimizeTime.current < 30000) return; // throttle 30s
    lastOptimizeTime.current = now;
    lastOptimizePos.current = pos;
    setIsOptimizing(true);
    setTimeout(() => {
      const pickups = orderList.filter(o => ['assigned', 'confirmed'].includes(o.status));
      const deliveries = orderList.filter(o => ['picked_up', 'on_the_way'].includes(o.status));
      setOptimizedPickup(optimizeRoute(pos, pickups));
      setOptimizedDelivery(optimizeRoute(pos, deliveries));
      setIsOptimizing(false);
    }, 0);
  }, []);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['driver-orders', user?.email],
    queryFn: async () => {
      const allOrders = await base44.entities.Order.filter(
        { driver_email: user.email },
        '-created_date',
        100
      );
      return allOrders.filter(o => ['assigned', 'confirmed', 'picked_up', 'on_the_way'].includes(o.status));
    },
    enabled: !!user,
    refetchInterval: 15000,
  });

  // Trigger optimization when orders or position change
  useEffect(() => {
    if (orders.length && courierPos) {
      runOptimization(courierPos, orders);
    } else if (orders.length) {
      setOptimizedPickup(orders.filter(o => ['assigned', 'confirmed'].includes(o.status)));
      setOptimizedDelivery(orders.filter(o => ['picked_up', 'on_the_way'].includes(o.status)));
    }
  }, [orders, courierPos, runOptimization]);

  const { data: deliveredToday = [] } = useQuery({
    queryKey: ['driver-delivered-today', user?.email],
    queryFn: async () => {
      const all = await base44.entities.Order.filter({ driver_email: user.email, status: 'delivered' }, '-created_date', 50);
      const today = new Date().toDateString();
      return all.filter(o => new Date(o.updated_date || o.created_date).toDateString() === today);
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const { data: preferences } = useQuery({
    queryKey: ['dashboard-preferences', user?.email],
    queryFn: async () => {
      const prefs = await base44.entities.DashboardPreference.filter({ 
        user_email: user.email, 
        dashboard_type: 'driver' 
      });
      return prefs[0];
    },
    enabled: !!user
  });

  const savePrefsMutation = useMutation({
    mutationFn: async (data) => {
      if (preferences?.id) {
        return base44.entities.DashboardPreference.update(preferences.id, data);
      }
      return base44.entities.DashboardPreference.create({
        user_email: user.email,
        dashboard_type: 'driver',
        ...data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-preferences'] });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status, proofData, failReason }) => {
      const updateData = { status, status_updated_at: new Date().toISOString(), status_updated_by: user.email };
      if (proofData) {
        updateData.delivery_proof = proofData;
        updateData.delivered_at = new Date().toISOString();
        updateData.delivered_by = user.email;
      }
      if (failReason) updateData.fail_reason = failReason;
      await base44.entities.Order.update(orderId, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-orders'] });
      toast.success('Statut mis à jour');
      setShowProofModal(false);
      setSelectedOrder(null);
    }
  });

  const handleDeliveryProof = async () => {
    let photo_url = null;
    if (proofPhoto) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: proofPhoto });
      photo_url = file_url;
    }

    updateStatusMutation.mutate({
      orderId: selectedOrder.id,
      status: 'delivered',
      proofData: {
        signature: signature,
        photo_url,
        timestamp: new Date().toISOString()
      }
    });
  };

  const handleQRSuccess = (code) => {
    setShowQRScanner(false);
    setShowProofModal(true);
  };

  const handleNewOrder = (order) => {
    queryClient.invalidateQueries({ queryKey: ['driver-orders'] });
  };

  const handleRouteOptimize = (route) => {
    toast.success(`Route optimisée: ${route.length} arrêts`);
  };

  const handleManualOptimize = () => {
    lastOptimizeTime.current = 0; // force reset throttle
    if (courierPos) runOptimization(courierPos, orders);
    toast.success('Tournée recalculée ✓');
  };

  // Generate smart alerts for drivers
  useEffect(() => {
    if (!orders.length || !preferences) return;

    const newAlerts = [];
    const config = preferences.alerts_config || {};

    // Urgent deliveries
    const urgentOrders = orders.filter(o => {
      const orderTime = new Date(o.created_date);
      const now = new Date();
      const minutesPassed = (now - orderTime) / (1000 * 60);
      return minutesPassed >= (config.urgent_delivery_minutes || 30);
    });

    if (urgentOrders.length > 0) {
      newAlerts.push({
        id: 'urgent_orders',
        type: 'urgent_delivery',
        priority: 'critical',
        title: 'Livraisons urgentes',
        message: `${urgentOrders.length} commande(s) en attente depuis plus de ${config.urgent_delivery_minutes || 30} min`,
        action: {
          label: 'Voir',
          onClick: () => setSelectedOrder(urgentOrders[0])
        }
      });
    }

    // High volume
    if (orders.length >= 10) {
      newAlerts.push({
        id: 'high_volume',
        type: 'high_demand',
        priority: 'medium',
        title: 'Forte demande',
        message: `${orders.length} commandes en attente. Optimisez votre itinéraire!`,
        action: {
          label: 'Optimiser',
          onClick: () => setShowMap(true)
        }
      });
    }

    // Daily target progress
    const targetDeliveries = config.daily_delivery_target || 20;
    const todayDelivered = 0; // TODO: calculate from delivered orders today
    if (todayDelivered >= targetDeliveries) {
      newAlerts.push({
        id: 'target_reached',
        type: 'target_reached',
        priority: 'low',
        title: '🎉 Objectif atteint!',
        message: `Vous avez livré ${todayDelivered} commandes aujourd'hui (objectif: ${targetDeliveries})`
      });
    }

    setAlerts(newAlerts);
  }, [orders, preferences]);

  const visibleWidgets = preferences?.visible_widgets || ['stats', 'map', 'orders', 'earnings'];

  const pendingPickup = optimizedPickup.length > 0 ? optimizedPickup : orders.filter(o => ['assigned', 'confirmed'].includes(o.status));
  const inDelivery = optimizedDelivery.length > 0 ? optimizedDelivery : orders.filter(o => ['picked_up', 'on_the_way'].includes(o.status));

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DeliveryNotifications userEmail={user?.email} onNewOrder={handleNewOrder} />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Espace Livreur</h1>
                <p className="text-blue-100 text-sm">Bonjour, {user.full_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {courierPos && (
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse" />
                  GPS actif
                </span>
              )}
              <Button variant="secondary" size="sm" onClick={handleManualOptimize} disabled={isOptimizing}>
                {isOptimizing ? <Gauge className="w-4 h-4 animate-spin mr-1" /> : <RefreshCw className="w-4 h-4 mr-1" />}
                Recalculer
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setShowMap(!showMap)}>
                <Map className="w-4 h-4 mr-2" />
                {showMap ? 'Masquer' : 'Carte'}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setShowBulkScanner(true)}>
                <QrCode className="w-4 h-4 mr-2" />
                Scan multiple
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setShowCustomizer(true)}>
                <BarChart3 className="w-4 h-4 mr-2" />
                Personnaliser
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-6">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-3 text-center">
              <p className="text-2xl font-bold">{pendingPickup.length}</p>
              <p className="text-xs text-blue-100">À récupérer</p>
            </Card>
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-3 text-center">
              <p className="text-2xl font-bold">{inDelivery.length}</p>
              <p className="text-xs text-blue-100">En route</p>
            </Card>
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-3 text-center">
              <p className="text-2xl font-bold">{deliveredToday.length}</p>
              <p className="text-xs text-blue-100">Livrées auj.</p>
            </Card>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Smart Alerts */}
        {visibleWidgets.includes('stats') && alerts.length > 0 && (
          <SmartAlert alerts={alerts} onDismiss={(id) => setAlerts(alerts.filter(a => a.id !== id))} />
        )}

        {/* Interactive Live Map + Google Directions */}
        {visibleWidgets.includes('map') && showMap && orders.length > 0 && (
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2">
                <Map className="w-5 h-5 text-blue-500" />
                Carte en temps réel
              </h2>
              <Badge className="bg-green-100 text-green-700">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                Live
              </Badge>
            </div>
            <GoogleDirectionsMap orders={orders} courierPos={courierPos} />
            <LiveDeliveryMap 
              orders={orders} 
              onRouteOptimize={handleRouteOptimize}
            />
          </Card>
        )}

        {/* Pending Pickup */}
        {pendingPickup.length > 0 && (
          <section>
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-500" />
              À récupérer ({pendingPickup.length})
              {courierPos && <span className="text-xs text-gray-400 font-normal">(trié par distance)</span>}
            </h2>
            <div className="space-y-3">
              {pendingPickup.map((order, idx) => (
                <OrderCard 
                  key={order.id}
                  order={order}
                  index={idx + 1}
                  courierPos={courierPos}
                  currentUser={user}
                  onUpdateStatus={(status) => updateStatusMutation.mutate({ orderId: order.id, status })}
                />
              ))}
            </div>
          </section>
        )}

        {/* En route */}
        {inDelivery.length > 0 && (
          <section>
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <Navigation className="w-5 h-5 text-orange-500" />
              En route ({inDelivery.length})
              {courierPos && <span className="text-xs text-gray-400 font-normal">(trié par distance)</span>}
            </h2>
            <div className="space-y-3">
              {inDelivery.map((order, idx) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  index={idx + 1}
                  courierPos={courierPos}
                  currentUser={user}
                  onComplete={() => {
                    setSelectedOrder(order);
                    setShowQRScanner(true);
                  }}
                  onUpdateStatus={(status) => updateStatusMutation.mutate({ orderId: order.id, status })}
                />
              ))}
            </div>
          </section>
        )}

        {orders.length === 0 && !isLoading && (
          <Card className="p-8 text-center">
            <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">Aucune livraison en cours</h3>
            <p className="text-gray-500">Les nouvelles commandes apparaîtront ici</p>
          </Card>
        )}
      </div>

      {/* Enhanced QR Scanner */}
      {selectedOrder && (
        <EnhancedQRScanner
          open={showQRScanner}
          onClose={() => setShowQRScanner(false)}
          order={selectedOrder}
          onSuccess={handleQRSuccess}
        />
      )}

      {/* Proof of Delivery Modal */}
      <Dialog open={showProofModal} onOpenChange={setShowProofModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Preuve de livraison</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Nom du réceptionnaire</label>
              <Input
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="Nom de la personne qui reçoit"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Photo (optionnel)</label>
              <Input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => setProofPhoto(e.target.files[0])}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowProofModal(false)} className="flex-1">
                Annuler
              </Button>
              <Button 
                onClick={handleDeliveryProof}
                disabled={!signature || updateStatusMutation.isPending}
                className="flex-1 bg-green-500 hover:bg-green-600"
              >
                {updateStatusMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Confirmer livraison
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Multi Scanner */}
      <MultiBulkScanner
        open={showBulkScanner}
        onClose={() => setShowBulkScanner(false)}
        availableOrders={inDelivery}
        driverEmail={user?.email}
        onSuccess={(delivered) => {
          queryClient.invalidateQueries({ queryKey: ['driver-orders'] });
          queryClient.invalidateQueries({ queryKey: ['driver-delivered-today'] });
        }}
      />

      {/* Widget Customizer */}
      <WidgetCustomizer
        open={showCustomizer}
        onClose={() => setShowCustomizer(false)}
        dashboardType="driver"
        preferences={preferences}
        onSave={(data) => savePrefsMutation.mutate(data)}
      />
    </div>
  );
}

function OrderCard({ order, onUpdateStatus, onComplete, courierPos, index, currentUser }) {
  const status = statusConfig[order.status];
  const Icon = status?.icon || Package;
  const flow = STATUS_FLOW[order.status];

  const distanceM = courierPos && (order.delivery_lat || order.delivery_lng)
    ? haversine(courierPos.lat, courierPos.lng, order.delivery_lat || 0, order.delivery_lng || 0)
    : null;

  const openNavigation = () => {
    if (order.delivery_lat && order.delivery_lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${order.delivery_lat},${order.delivery_lng}`, '_blank');
    } else {
      const address = encodeURIComponent(order.delivery_address || '');
      window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {index && <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full text-xs flex items-center justify-center font-bold">{index}</span>}
          <div>
            <p className="font-semibold">{order.customer_name}</p>
            <p className="text-sm text-gray-500">
              {format(new Date(order.created_date), "d MMM à HH:mm", { locale: fr })}
              {distanceM != null && <span className="ml-2 text-blue-500">· {formatDistance(distanceM)}</span>}
            </p>
          </div>
        </div>
        <Badge className={status.color}>
          <Icon className="w-3 h-3 mr-1" />
          {status.label}
        </Badge>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
          <span className="text-gray-600">{order.delivery_address || 'Non spécifiée'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Phone className="w-4 h-4 text-gray-400" />
          <a href={`tel:${order.customer_phone}`} className="text-blue-600">
            {order.customer_phone || 'N/A'}
          </a>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <p className="text-sm font-medium mb-1">{order.items?.length || 0} article(s)</p>
        <p className="text-lg font-bold text-emerald-600">{order.total_amount?.toLocaleString()} FCFA</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={openNavigation} className="flex-1">
          <Navigation className="w-4 h-4 mr-1" />
          Itinéraire
        </Button>

        <DeliveryChat order={order} currentUser={currentUser || { email: order.driver_email }} />

        {flow && onUpdateStatus && order.status !== 'on_the_way' && (
          <Button size="sm"
            onClick={() => onUpdateStatus(flow.next)}
            className={`flex-1 ${flow.btnClass}`}>
            <Truck className="w-4 h-4 mr-1" />
            {flow.label}
          </Button>
        )}

        {order.status === 'on_the_way' && onComplete && (
          <Button size="sm" onClick={onComplete} className="flex-1 bg-green-500 hover:bg-green-600">
            <CheckCircle className="w-4 h-4 mr-1" />
            Livré
          </Button>
        )}
      </div>
    </Card>
  );
}