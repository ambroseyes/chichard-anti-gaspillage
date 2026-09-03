import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { api } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, Package, MapPin, Clock, QrCode } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import QRCodeGenerator from '@/components/delivery/QRCodeGenerator';
import { motion } from 'framer-motion';

export default function OrderConfirmation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('commande') ?? searchParams.get('id');

  // Le code de retrait n'est affiché qu'ici, au retour du paiement : le serveur
  // ne le conserve que sous forme de condensat et ne le renverra plus jamais.
  const confirmationCode = searchParams.get('code');
  const pickupToken = searchParams.get('jeton');

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => api.entities.Order.get(orderId),
    enabled: Boolean(orderId),
  });

  if (isLoading || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Commande confirmée !
          </h1>
          <p className="text-gray-600">
            Merci pour votre commande. Voici les détails de votre livraison.
          </p>
        </motion.div>

        {/* Order Details */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Détails de la commande</h2>
            <Badge>{order.status}</Badge>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex items-start gap-3">
              <Package className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Articles</p>
                <p className="font-medium">{order.items?.length || 0} article(s)</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Adresse de livraison</p>
                <p className="font-medium">{order.delivery_address}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Livraison estimée</p>
                <p className="font-medium">30-45 minutes</p>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 rounded-lg p-4">
            <p className="text-lg font-bold text-emerald-900">
              Total: {order.total_amount?.toLocaleString()} FCFA
            </p>
          </div>
        </Card>

        {/* QR Code Section */}
        {order.delivery_type === 'delivery' && (
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <QrCode className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold">Code de retrait</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Présentez ce code au livreur ou au magasin au moment de la remise.
            </p>
            <div className="flex justify-center">
              <QRCodeGenerator
                pickupToken={pickupToken}
                confirmationCode={confirmationCode}
                orderNumber={order.order_number}
              />
            </div>
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                Ce code est signé et vérifié par nos serveurs. Ne le communiquez qu'à la
                personne qui vous remet la commande.
              </p>
            </div>
          </Card>
        )}

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => navigate(createPageUrl('Orders'))}
          >
            Voir mes commandes
          </Button>
          <Button 
            className="flex-1 bg-emerald-500 hover:bg-emerald-600"
            onClick={() => navigate(createPageUrl('Home'))}
          >
            Retour à l'accueil
          </Button>
        </div>
      </div>
    </div>
  );
}