import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon, User, Bell, Shield, Heart,
  Store, Truck, CreditCard, HelpCircle, ChevronRight
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserPreferencesForm from '@/components/forms/UserPreferencesForm';
import StoreForm from '@/components/forms/StoreForm';

export default function Settings() {
  const [user, setUser] = useState(null);
  const [store, setStore] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        
        if (userData.store_id) {
          const stores = await base44.entities.Store.filter({ id: userData.store_id });
          if (stores.length > 0) setStore(stores[0]);
        }
      } catch (e) {
        base44.auth.redirectToLogin();
      }
    };
    loadData();
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-6 h-6 text-gray-600" />
            <h1 className="text-xl font-bold">Paramètres</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <Tabs defaultValue="preferences">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="preferences" className="flex-1">
              <Heart className="w-4 h-4 mr-2" />
              Préférences
            </TabsTrigger>
            {user.is_partner && (
              <TabsTrigger value="store" className="flex-1">
                <Store className="w-4 h-4 mr-2" />
                Magasin
              </TabsTrigger>
            )}
            <TabsTrigger value="notifications" className="flex-1">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preferences">
            <UserPreferencesForm user={user} onSuccess={() => window.location.reload()} />
          </TabsContent>

          {user.is_partner && (
            <TabsContent value="store">
              <StoreForm store={store} onSuccess={() => window.location.reload()} />
            </TabsContent>
          )}

          <TabsContent value="notifications">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Notifications push</h3>
              <div className="space-y-4">
                {[
                  { id: 'deals', label: 'Nouvelles offres', desc: 'Produits à prix réduit près de vous' },
                  { id: 'orders', label: 'Commandes', desc: 'Mises à jour de vos commandes' },
                  { id: 'challenges', label: 'Défis', desc: 'Nouveaux défis et récompenses' },
                  { id: 'community', label: 'Communauté', desc: 'Interactions et messages' },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-gray-300" />
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}