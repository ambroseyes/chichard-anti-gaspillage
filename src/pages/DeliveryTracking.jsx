import React, { useState, useEffect } from 'react';
import { api } from '@/api';
import { useQuery } from '@tanstack/react-query';
import {
  Truck, MapPin, Clock, Package, CheckCircle, Phone,
  Navigation, Camera, Store
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const deliverySteps = [
  { id: 'confirmed', label: 'Commande confirmée', icon: CheckCircle },
  { id: 'preparing', label: 'Préparation', icon: Package },
  { id: 'picked', label: 'Récupérée par le livreur', icon: Store },
  { id: 'on_way', label: 'En route', icon: Truck },
  { id: 'delivered', label: 'Livrée', icon: CheckCircle }
];

export default function DeliveryTracking() {
  const [user, setUser] = useState(null);
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('order');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await api.auth.me();
        setUser(userData);
      } catch {
        // Visiteur non connecté : la page reste consultable en anonyme.
      }
    };
    loadUser();
  }, []);

  const { data: order } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const orders = await api.entities.Order.filter({ id: orderId });
      return orders[0];
    },
    enabled: !!orderId,
  });

  // Mock current step (in real app, this would come from the order status)
  const currentStepIndex = 3; // "En route"
  const estimatedTime = '15 min';
  const deliveryProgress = 65;

  // Mock driver info
  const driver = {
    name: 'Jean-Pierre M.',
    phone: '+237 6XX XX XX XX',
    rating: 4.8,
    deliveries: 234
  };

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Commande non trouvée</h2>
          <p className="text-gray-500">Vérifiez le numéro de commande</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Map placeholder */}
      <div className="h-64 bg-gradient-to-br from-blue-100 to-indigo-100 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2 animate-pulse">
              <Truck className="w-8 h-8 text-white" />
            </div>
            <p className="text-blue-800 font-medium">Suivi en temps réel</p>
          </div>
        </div>
        
        {/* ETA overlay */}
        <div className="absolute top-4 left-4 right-4">
          <Card className="p-3 bg-white/90 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Clock className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Arrivée estimée</p>
                  <p className="font-bold text-gray-900">{estimatedTime}</p>
                </div>
              </div>
              <Badge className="bg-blue-100 text-blue-700">En route</Badge>
            </div>
          </Card>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Progress */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Progression de la livraison</h3>
            <span className="text-sm text-gray-500">{deliveryProgress}%</span>
          </div>
          <Progress value={deliveryProgress} className="h-2 mb-6" />
          
          <div className="relative">
            {deliverySteps.map((step, idx) => {
              const isCompleted = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              const StepIcon = step.icon;
              
              return (
                <div key={step.id} className="flex gap-4 pb-6 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isCompleted ? 'bg-emerald-500 text-white' :
                      isCurrent ? 'bg-blue-500 text-white animate-pulse' :
                      'bg-gray-200 text-gray-400'
                    }`}>
                      <StepIcon className="w-5 h-5" />
                    </div>
                    {idx < deliverySteps.length - 1 && (
                      <div className={`w-0.5 h-full mt-2 ${
                        isCompleted ? 'bg-emerald-500' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                  <div className="flex-1 pt-2">
                    <p className={`font-medium ${
                      isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      {step.label}
                    </p>
                    {isCurrent && (
                      <p className="text-sm text-blue-600 mt-1">En cours...</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Driver info */}
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Votre livreur</h3>
          <div className="flex items-center gap-4">
            <Avatar className="w-14 h-14">
              <AvatarFallback className="bg-blue-100 text-blue-600 text-lg">
                {driver.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{driver.name}</p>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>⭐ {driver.rating}</span>
                <span>•</span>
                <span>{driver.deliveries} livraisons</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="icon" variant="outline">
                <Phone className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="outline">
                <Navigation className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Order details */}
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Détails de la commande</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">{order.delivery_address || 'Adresse non spécifiée'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Package className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">{order.items?.length || 0} articles</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Store className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">{order.store_name || 'Magasin'}</span>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between">
              <span className="text-gray-600">Total</span>
              <span className="font-bold text-gray-900">{order.total_amount?.toLocaleString()} FCFA</span>
            </div>
          </div>
        </Card>

        {/* Proof of delivery section (for driver) */}
        <Card className="p-5 bg-gray-50 border-dashed">
          <div className="text-center">
            <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              Une photo de livraison sera ajoutée ici une fois le colis remis
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}