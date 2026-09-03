import React, { useEffect, useState } from 'react';
import { api } from '@/api';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function VerifyPartner() {
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const storeId = urlParams.get('store_id');

        if (!token || !storeId) {
          setStatus('error');
          setMessage('Lien de vérification invalide');
          return;
        }

        // Update store status to pending
        await api.entities.Store.update(storeId, {
          status: 'pending',
          email_verified: true
        });

        // Notify all admins
        const adminUsers = await api.entities.User.filter({ role: 'admin' });
        const store = await api.entities.Store.filter({ id: storeId });
        
        if (store && store.length > 0) {
          for (const admin of adminUsers) {
            await api.entities.Notification.create({
              user_email: admin.email,
              title: 'Nouveau partenaire vérifié',
              message: `${store[0].name} a vérifié son email et attend votre validation`,
              type: 'system',
              action_url: '/AdminPartners'
            });
          }
        }

        setStatus('success');
        setMessage('Email vérifié avec succès ! Votre demande est en cours de traitement.');
      } catch (error) {
        setStatus('error');
        setMessage('Une erreur est survenue lors de la vérification');
      }
    };

    verifyEmail();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-emerald-500 mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-bold mb-2">Vérification en cours...</h2>
            <p className="text-gray-500">Veuillez patienter</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-emerald-600">Email vérifié !</h2>
            <p className="text-gray-500 mb-6">{message}</p>
            <p className="text-sm text-gray-600 mb-6">
              Vous recevrez une notification dès que votre compte sera validé par notre équipe (sous 24h).
            </p>
            <Button 
              onClick={() => navigate(createPageUrl('Home'))}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              Retour à l'accueil
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-red-600">Erreur de vérification</h2>
            <p className="text-gray-500 mb-6">{message}</p>
            <Button 
              onClick={() => navigate(createPageUrl('BecomePartner'))}
              variant="outline"
            >
              Réessayer
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}