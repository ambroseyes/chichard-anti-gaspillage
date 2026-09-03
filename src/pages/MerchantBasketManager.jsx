import React, { useState, useEffect } from 'react';
import { api } from '@/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ShoppingBag, Plus, Package, TrendingUp, Users, Clock, RefreshCw
} from 'lucide-react';
import BasketEditorModal from '@/components/merchant/BasketEditorModal';
import BasketRowCard from '@/components/merchant/BasketRowCard';
import ReservationsList from '@/components/merchant/ReservationsList';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { goToLogin } from '@/lib/navigation';

export default function MerchantBasketManager() {
  const [user, setUser] = useState(null);
  const [editingBasket, setEditingBasket] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    api.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: baskets = [], isLoading, refetch } = useQuery({
    queryKey: ['merchant-baskets', user?.email],
    queryFn: () => api.entities.ClickCollectBasket.filter(
      { store_id: user.email },
      '-created_date',
      100
    ),
    enabled: !!user?.email,
    refetchInterval: 30000,
  });

  const { data: reservations = [] } = useQuery({
    queryKey: ['merchant-reservations', user?.email],
    queryFn: () => api.entities.ClickCollectReservation.filter(
      { store_id: user.email },
      '-created_date',
      100
    ),
    enabled: !!user?.email,
    refetchInterval: 15000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.entities.ClickCollectBasket.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-baskets'] });
      toast.success('Panier supprimé');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }) => api.entities.ClickCollectBasket.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-baskets'] });
      toast.success('Statut mis à jour');
    },
  });

  // KPIs
  const activeBaskets = baskets.filter(b => b.status === 'active');
  const soldOutBaskets = baskets.filter(b => b.status === 'sold_out');
  const todayReservations = reservations.filter(r => {
    const today = new Date().toISOString().split('T')[0];
    return r.pickup_date === today || r.created_date?.startsWith(today);
  });
  const totalRevenue = reservations
    .filter(r => r.status !== 'cancelled')
    .reduce((sum, r) => sum + (r.total_amount || 0), 0);
  const pendingPickups = reservations.filter(r => ['reserved', 'confirmed', 'ready'].includes(r.status));

  const handleEdit = (basket) => {
    setEditingBasket(basket);
    setShowEditor(true);
  };

  const handleNew = () => {
    setEditingBasket(null);
    setShowEditor(true);
  };

  const handleEditorClose = () => {
    setShowEditor(false);
    setEditingBasket(null);
    queryClient.invalidateQueries({ queryKey: ['merchant-baskets'] });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 text-center max-w-sm">
          <ShoppingBag className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Espace commerçant</h2>
          <p className="text-gray-500 mb-4">Connectez-vous pour gérer vos paniers</p>
          <Button onClick={() => goToLogin()}
            className="bg-emerald-500 hover:bg-emerald-600">
            Se connecter
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">Gestion Paniers</h1>
              <p className="text-xs text-gray-500">Mise à jour en temps réel</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-1" /> Actualiser
            </Button>
            <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600" onClick={handleNew}>
              <Plus className="w-4 h-4 mr-1" /> Nouveau panier
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPICard
            label="Paniers actifs"
            value={activeBaskets.length}
            icon={<Package className="w-5 h-5 text-emerald-600" />}
            bg="bg-emerald-50"
          />
          <KPICard
            label="Réservations aujourd'hui"
            value={todayReservations.length}
            icon={<Users className="w-5 h-5 text-blue-600" />}
            bg="bg-blue-50"
          />
          <KPICard
            label="Retraits en attente"
            value={pendingPickups.length}
            icon={<Clock className="w-5 h-5 text-amber-600" />}
            bg="bg-amber-50"
            alert={pendingPickups.length > 0}
          />
          <KPICard
            label="Revenus totaux"
            value={`${totalRevenue.toLocaleString()} F`}
            icon={<TrendingUp className="w-5 h-5 text-purple-600" />}
            bg="bg-purple-50"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="baskets">
          <TabsList className="bg-white shadow-sm w-full">
            <TabsTrigger value="baskets" className="flex-1">
              🧺 Mes paniers ({baskets.length})
            </TabsTrigger>
            <TabsTrigger value="reservations" className="flex-1">
              📋 Réservations ({reservations.length})
            </TabsTrigger>
          </TabsList>

          {/* BASKETS TAB */}
          <TabsContent value="baskets" className="mt-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : baskets.length === 0 ? (
              <Card className="py-16 text-center">
                <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 font-medium">Aucun panier créé</p>
                <p className="text-sm text-gray-400 mb-4">Créez votre premier panier anti-gaspi</p>
                <Button onClick={handleNew} className="bg-emerald-500 hover:bg-emerald-600">
                  <Plus className="w-4 h-4 mr-1" /> Créer un panier
                </Button>
              </Card>
            ) : (
              <div className="space-y-3">
                {baskets.map(basket => (
                  <BasketRowCard
                    key={basket.id}
                    basket={basket}
                    reservations={reservations.filter(r => r.basket_id === basket.id)}
                    onEdit={() => handleEdit(basket)}
                    onDelete={() => deleteMutation.mutate(basket.id)}
                    onToggleStatus={(status) => toggleStatusMutation.mutate({ id: basket.id, status })}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* RESERVATIONS TAB */}
          <TabsContent value="reservations" className="mt-4">
            <ReservationsList reservations={reservations} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Editor Modal */}
      <BasketEditorModal
        open={showEditor}
        basket={editingBasket}
        user={user}
        onClose={handleEditorClose}
      />
    </div>
  );
}

function KPICard({ label, value, icon, bg, alert }) {
  return (
    <Card className={`p-4 ${alert ? 'border-amber-300 ring-1 ring-amber-200' : ''}`}>
      <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-2`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      {alert && <div className="w-2 h-2 bg-amber-400 rounded-full absolute top-3 right-3 animate-pulse" />}
    </Card>
  );
}