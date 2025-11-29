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
  Clock, Camera, FileSignature, AlertTriangle, User, Loader2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from 'sonner';

const statusConfig = {
  confirmed: { label: 'À récupérer', color: 'bg-blue-100 text-blue-700', icon: Package },
  ready: { label: 'En livraison', color: 'bg-orange-100 text-orange-700', icon: Truck },
  delivered: { label: 'Livré', color: 'bg-green-100 text-green-700', icon: CheckCircle },
};

export default function DriverDashboard() {
  const [user, setUser] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showProofModal, setShowProofModal] = useState(false);
  const [signature, setSignature] = useState('');
  const [proofPhoto, setProofPhoto] = useState(null);
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
    queryKey: ['driver-orders'],
    queryFn: async () => {
      const allOrders = await base44.entities.Order.filter(
        { delivery_type: 'delivery' },
        '-created_date',
        50
      );
      return allOrders.filter(o => ['confirmed', 'ready'].includes(o.status));
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status, proofData }) => {
      const updateData = { status };
      if (proofData) {
        updateData.delivery_proof = proofData;
        updateData.delivered_at = new Date().toISOString();
        updateData.delivered_by = user.email;
      }
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

  const pendingPickup = orders.filter(o => o.status === 'confirmed');
  const inDelivery = orders.filter(o => o.status === 'ready');

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Espace Livreur</h1>
              <p className="text-blue-100 text-sm">Bonjour, {user.full_name}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-4 text-center">
              <p className="text-3xl font-bold">{pendingPickup.length}</p>
              <p className="text-sm text-blue-100">À récupérer</p>
            </Card>
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-4 text-center">
              <p className="text-3xl font-bold">{inDelivery.length}</p>
              <p className="text-sm text-blue-100">En livraison</p>
            </Card>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
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

        {/* In Delivery */}
        {inDelivery.length > 0 && (
          <section>
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <Truck className="w-5 h-5 text-orange-500" />
              En livraison ({inDelivery.length})
            </h2>
            <div className="space-y-3">
              {inDelivery.map((order) => (
                <OrderCard 
                  key={order.id} 
                  order={order}
                  onComplete={() => {
                    setSelectedOrder(order);
                    setShowProofModal(true);
                  }}
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