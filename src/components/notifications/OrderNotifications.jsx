import React, { useEffect } from 'react';
import { api } from '@/api';
import { toast } from 'sonner';
import { Package, Truck, CheckCircle, Clock } from 'lucide-react';

export default function OrderNotifications({ userEmail, onOrderUpdate }) {
  useEffect(() => {
    if (!userEmail) return;

    // Subscribe to order updates
    const unsubscribe = api.subscribe('Order', (event) => {
      // Only show notifications for this user's orders
      if (event.data.customer_email !== userEmail) return;

      const order = event.data;
      
      // Show notification based on order status
      switch (order.status) {
        case 'confirmed':
          toast.success(
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-blue-500" />
              <div>
                <p className="font-semibold">Commande confirmée</p>
                <p className="text-sm text-gray-600">
                  Votre commande #{order.id.slice(0, 8)} est confirmée
                </p>
              </div>
            </div>,
            { duration: 5000 }
          );
          break;

        case 'ready':
          if (order.delivery_type === 'pickup') {
            toast.info(
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="font-semibold">Commande prête !</p>
                  <p className="text-sm text-gray-600">
                    Vous pouvez venir retirer votre commande au magasin
                  </p>
                </div>
              </div>,
              { duration: 6000 }
            );
          } else {
            toast.info(
              <div className="flex items-center gap-3">
                <Truck className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="font-semibold">En cours de livraison</p>
                  <p className="text-sm text-gray-600">
                    Votre commande est en route !
                  </p>
                </div>
              </div>,
              { duration: 6000 }
            );
          }
          break;

        case 'delivered':
          toast.success(
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="font-semibold">Commande livrée !</p>
                <p className="text-sm text-gray-600">
                  Merci pour votre commande. Bon appétit ! 🎉
                </p>
              </div>
            </div>,
            { duration: 6000 }
          );
          break;

        case 'cancelled':
          toast.error(
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-red-600 text-sm">✕</span>
              </div>
              <div>
                <p className="font-semibold">Commande annulée</p>
                <p className="text-sm text-gray-600">
                  Votre commande a été annulée. Contactez-nous pour plus d'infos.
                </p>
              </div>
            </div>,
            { duration: 6000 }
          );
          break;
      }

      // Trigger callback
      if (onOrderUpdate) {
        onOrderUpdate(order);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [userEmail, onOrderUpdate]);

  // Subscribe to pickup requests for store notifications
  useEffect(() => {
    if (!userEmail) return;

    const unsubscribe = api.subscribe('PickupRequest', (event) => {
      if (event.data.customer_email !== userEmail) return;

      const pickup = event.data;

      if (event.type === 'create' && pickup.status === 'confirmed') {
        toast.success(
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-green-500" />
            <div>
              <p className="font-semibold">Retrait confirmé !</p>
              <p className="text-sm text-gray-600">
                Créneau: {pickup.pickup_time_slot}
              </p>
              <p className="text-xs font-mono text-gray-500 mt-1">
                Code: {pickup.confirmation_code}
              </p>
            </div>
          </div>,
          { duration: 8000 }
        );
      }

      if (event.type === 'update' && pickup.status === 'ready') {
        toast.info(
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-blue-500" />
            <div>
              <p className="font-semibold">Votre commande est prête !</p>
              <p className="text-sm text-gray-600">
                Rendez-vous au magasin avec votre code
              </p>
            </div>
          </div>,
          { duration: 8000 }
        );

        // Browser notification (if permitted)
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('CHICHARD - Commande prête', {
            body: `Votre commande est prête au retrait. Code: ${pickup.confirmation_code}`,
            icon: '/logo.png',
            badge: '/logo.png'
          });
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [userEmail]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return null; // This component only handles notifications
}