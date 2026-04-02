import React, { useState, useEffect } from 'react';
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
import { BarChart3 } from 'lucide-react';

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

export default function DriverDashboard() {
  const [user, setUser] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showProofModal, setShowProofModal] = useState(false);
  const [signature, setSignature] = useState('');
  const [proofPhoto, setProofPhoto] = useState(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
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

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['driver-orders', user?.email],
    queryFn: async () => {
      // RBAC: only fetch orders assigned to this courier
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

  const pendingPickup = orders.filter(o => ['assigned', 'confirmed'].includes(o.status));
  const inPickedUp   = orders.filter(o => o.status === 'picked_up');
  const inDelivery   = orders.filter(o => o.status === 'on_the_way');

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
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => setShowMap(!showMap)}
            >
              <Map className="w-4 h-4 mr-2" />
              {showMap ? 'Masquer' : 'Carte'}
            </Button>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => setShowCustomizer(true)}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Personnaliser
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-6">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-3 text-center">
              <p className="text-2xl font-bold">{pendingPickup.length}</p>
              <p className="text-xs text-blue-100">À récupérer</p>
            </Card>
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-3 text-center">
              <p className="text-2xl font-bold">{inPickedUp.length + inDelivery.length}</p>
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

        {/* Interactive Live Map */}
        {visibleWidgets.includes('map') && showMap && orders.length > 0 && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold flex items-center gap-2">
                <Map className="w-5 h-5 text-blue-500" />
                Carte en temps réel
              </h2>
              <Badge className="bg-green-100 text-green-700">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                Live
              </Badge>
            </div>
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
            </h2>
            <div className="space-y-3">
              {pendingPickup.map((order) => (
                <OrderCard 
                  key={order.id} 
                  order={order}
                  onUpdateStatus={(status) => updateStatusMutation.mutate({ orderId: order.id, status })}
                />
              ))}
            </div>
          </section>
        )}

        {/* Picked up - en route */}
        {inPickedUp.length > 0 && (
          <section>
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <Truck className="w-5 h-5 text-yellow-500" />
              Récupérées ({inPickedUp.length})
            </h2>
            <div className="space-y-3">
              {inPickedUp.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onUpdateStatus={(status) => updateStatusMutation.mutate({ orderId: order.id, status })}
                />
              ))}
            </div>
          </section>
        )}

        {/* On the way */}
        {inDelivery.length > 0 && (
          <section>
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <Navigation className="w-5 h-5 text-orange-500" />
              En route ({inDelivery.length})
            </h2>
            <div className="space-y-3">
              {inDelivery.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
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

function OrderCard({ order, onUpdateStatus, onComplete }) {
  const status = statusConfig[order.status];
  const Icon = status?.icon || Package;

  const openNavigation = () => {
    const address = encodeURIComponent(order.delivery_address || '');
    window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold">{order.customer_name}</p>
          <p className="text-sm text-gray-500">
            {format(new Date(order.created_date), "d MMM à HH:mm", { locale: fr })}
          </p>
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

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={openNavigation} className="flex-1">
          <Navigation className="w-4 h-4 mr-1" />
          Itinéraire
        </Button>
        
        {order.status === 'confirmed' && onUpdateStatus && (
          <Button size="sm" onClick={() => onUpdateStatus('ready')} className="flex-1 bg-blue-500 hover:bg-blue-600">
            <Truck className="w-4 h-4 mr-1" />
            Récupéré
          </Button>
        )}
        
        {order.status === 'ready' && onComplete && (
          <Button size="sm" onClick={onComplete} className="flex-1 bg-green-500 hover:bg-green-600">
            <CheckCircle className="w-4 h-4 mr-1" />
            Livré
          </Button>
        )}
      </div>
    </Card>
  );
}