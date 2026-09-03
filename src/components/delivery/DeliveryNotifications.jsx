import { useEffect } from 'react';
import { api } from '@/api';
import { toast } from 'sonner';
import { Package, Truck, CheckCircle } from 'lucide-react';

export default function DeliveryNotifications({ userEmail, onNewOrder }) {
  useEffect(() => {
    if (!userEmail) return;

    // Subscribe to order changes
    const unsubscribe = api.subscribe('Order', (event) => {
      const order = event.data;
      
      // Notifier seulement les livraisons
      if (order.delivery_type !== 'delivery') return;

      if (event.type === 'create' && order.status === 'confirmed') {
        // Nouvelle commande
        toast.success('Nouvelle commande de livraison !', {
          description: `${order.customer_name} - ${order.delivery_address}`,
          icon: <Package className="w-5 h-5" />,
          duration: 5000,
        });
        onNewOrder?.(order);
        
        // Notification sonore
        playNotificationSound();
      } else if (event.type === 'update') {
        // Changement de statut
        if (order.status === 'ready') {
          toast.info('Commande prête pour livraison', {
            description: order.customer_name,
            icon: <Truck className="w-5 h-5" />,
          });
        } else if (order.status === 'delivered') {
          toast.success('Livraison confirmée !', {
            icon: <CheckCircle className="w-5 h-5" />,
          });
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [userEmail]);

  const playNotificationSound = () => {
    // Jouer un son de notification (si le navigateur le permet)
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2U1vLNeysFKHnH8N2PRwrUXrPp66hVFApGn+DyvmwhBT2U1vLNeysFKHnH8N2PRwrUXrPp66hVFApGn+DyvmwhBT2U1vLNeysFKHnH8N2PRwrUXrPp66hVFApGn+DyvmwhBT2U1vLNeysFKHnH8N2PRwrUXrPp66hVFApGn+DyvmwhBT2U1vLNeysFKHnH8N2PRwrUXrPp66hVFApGn+DyvmwhBT2U1vLNeysFKHnH8N2PRwrUXrPp66hVFApGn+DyvmwhBT2U1vLNeysFKHnH8N2PRwrUXrPp66hVFApGn+DyvmwhBT2U1vLNeysFKHnH8N2PRwrUXrPp66hVFApGn+DyvmwhBT2U1vLNeysFKHnH8N2PRwrUXrPp66hVFApGn+DyvmwhBT2U1vLNeysFKHnH8N2PRwrUXrPp66hVFApGn+DyvmwhBT2U1vLNeysFKHnH8N2PRwrUXrPp66hVFApGn+DyvmwhBT2U1vLNeysFKHnH8N2PRwrUXrPp66hVFApGn+DyvmwhBT2U1vLNeysFKHnH8N2PRwrUXrPp66hVFApGn+DyvmwhBT2U1vLNeysFKHnH8N2PRwrUXrPp66hVFApGn+DyvmwhBT2U1vLNeysFKHnH8N2PRwrUXrPp66hVFApGn+DyvmwhBT2U1vLNeysFKHnH8N2PRwrUXrPp66hVFApGn+DyvmwhBT2U1vLNeysFKHnH8N2PRwrUXrPp66hVFApGn+DyvmwhBT2U1vLNeysFKHnH8N2PRwrUXrPp66hVFApGn+DyvmwhBT2U1vLNeysFKHnH8N2PRwrUXrPp66hVFApGn+DyvmwhBT2U1vLNeysFKHnH8N2PRwrUXrPp66hVFApGn+DyvmwhBT2U1vLNeysFKHnH8N2PRwrUXrPp66hVFApGn+Dyvm==');
    audio.play().catch(() => {});
  };

  return null; // Ce composant ne rend rien visuellement
}