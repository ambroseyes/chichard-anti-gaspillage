import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Search, ShoppingBag, Clock, MapPin, Leaf, CheckCircle2, Package } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import BasketCard from '@/components/clickcollect/BasketCard';
import ReservationModal from '@/components/clickcollect/ReservationModal';
import BasketReviewModal from '@/components/clickcollect/BasketReviewModal';
import StoreRatingBadge from '@/components/clickcollect/StoreRatingBadge';
import { toast } from 'sonner';

export default function ClickCollect() {
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedBasket, setSelectedBasket] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [lastReservation, setLastReservation] = useState(null);
  const [reviewReservation, setReviewReservation] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: baskets = [], isLoading } = useQuery({
    queryKey: ['cc-baskets'],
    queryFn: () => base44.entities.ClickCollectBasket.filter({ status: 'active' }, '-created_date', 50),
  });

  const { data: myReservations = [] } = useQuery({
    queryKey: ['my-reservations', user?.email],
    queryFn: () => base44.entities.ClickCollectReservation.filter(
      { customer_email: user.email },
      '-created_date',
      20
    ),
    enabled: !!user?.email,
  });

  const { data: myReviews = [] } = useQuery({
    queryKey: ['my-basket-reviews', user?.email],
    queryFn: () => base44.entities.BasketReview.filter({ customer_email: user.email }),
    enabled: !!user?.email,
  });

  const filtered = baskets.filter(b =>
    !search ||
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.store_name.toLowerCase().includes(search.toLowerCase())
  );

  const surpriseBaskets = filtered.filter(b => b.basket_type === 'surprise_basket');
  const specificBaskets = filtered.filter(b => b.basket_type === 'specific_products');

  const handleReserve = (basket) => {
    if (!user) {
      toast.error('Connectez-vous pour réserver');
      base44.auth.redirectToLogin(window.location.pathname);
      return;
    }
    setSelectedBasket(basket);
    setShowModal(true);
  };

  const handleReservationSuccess = (data) => {
    setLastReservation(data);
    toast.success(`Réservation confirmée ! Code: ${data.confirmation_code || data.code}`);
  };

  const statusConfig = {
    reserved: { label: 'Réservée', color: 'bg-blue-100 text-blue-700' },
    confirmed: { label: 'Confirmée', color: 'bg-emerald-100 text-emerald-700' },
    ready: { label: 'Prête !', color: 'bg-green-100 text-green-700' },
    collected: { label: 'Retirée', color: 'bg-gray-100 text-gray-600' },
    cancelled: { label: 'Annulée', color: 'bg-red-100 text-red-700' },
    no_show: { label: 'Non présenté', color: 'bg-orange-100 text-orange-700' },
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Hero */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white px-4 py-10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 mb-4 text-sm font-medium">
            <ShoppingBag className="w-4 h-4" /> Click & Collect Anti-Gaspi
          </div>
          <h1 className="text-3xl font-bold mb-2">Réservez votre panier du soir</h1>
          <p className="text-white/80 max-w-xl mx-auto text-sm">
            Pré-réservez des paniers surprise ou des produits spécifiques en fin de journée, payez en ligne et récupérez-les en magasin.
          </p>
          <div className="mt-6 flex gap-4 justify-center text-sm">
            <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> Créneau garanti</div>
            <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Paiement sécurisé</div>
            <div className="flex items-center gap-1.5"><Leaf className="w-4 h-4" /> 0 gaspillage</div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-6">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <Input
            className="pl-9"
            placeholder="Rechercher un panier ou un magasin..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <Tabs defaultValue="all">
          <TabsList className="w-full mb-6 bg-white shadow-sm">
            <TabsTrigger value="all" className="flex-1">Tous ({filtered.length})</TabsTrigger>
            <TabsTrigger value="surprise" className="flex-1">🎁 Surprise ({surpriseBaskets.length})</TabsTrigger>
            <TabsTrigger value="specific" className="flex-1">📦 Produits ({specificBaskets.length})</TabsTrigger>
            {user && <TabsTrigger value="my" className="flex-1">Mes réservations</TabsTrigger>}
          </TabsList>

          {/* All baskets */}
          {['all', 'surprise', 'specific'].map(tab => (
            <TabsContent key={tab} value={tab}>
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-64 bg-gray-200 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <>
                  {(tab === 'all' ? filtered : tab === 'surprise' ? surpriseBaskets : specificBaskets).length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                      <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">Aucun panier disponible</p>
                      <p className="text-sm mt-1">Revenez en fin de journée pour trouver les meilleures offres</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(tab === 'all' ? filtered : tab === 'surprise' ? surpriseBaskets : specificBaskets).map(basket => (
                        <BasketCard key={basket.id} basket={basket} onReserve={handleReserve} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          ))}

          {/* My reservations */}
          {user && (
            <TabsContent value="my">
              {myReservations.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Aucune réservation</p>
                  <p className="text-sm mt-1">Vos réservations Click & Collect apparaîtront ici</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myReservations.map(r => {
                    const cfg = statusConfig[r.status] || statusConfig.reserved;
                    return (
                      <Card key={r.id} className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-gray-900">{r.basket_name}</p>
                            <p className="text-xs text-gray-500">{r.store_name}</p>
                          </div>
                          <Badge className={cfg.color}>{cfg.label}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            {r.pickup_date} · {r.pickup_slot}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            {r.store_address || r.store_name}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-emerald-700">{r.total_amount?.toLocaleString()} F</span>
                            <span className="text-xs text-emerald-600">(-{r.savings_amount?.toLocaleString()} F économisés)</span>
                          </div>
                          {r.confirmation_code && (
                            <div className="text-right">
                              <p className="text-xs text-gray-400">Code</p>
                              <p className="font-mono font-bold text-sm text-emerald-700">{r.confirmation_code}</p>
                            </div>
                          )}
                        </div>
                        {r.co2_saved_kg > 0 && (
                          <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                            <Leaf className="w-3 h-3" /> {r.co2_saved_kg} kg CO₂ évité
                          </p>
                        )}
                        {r.status === 'collected' && !myReviews.find(rv => rv.reservation_id === r.id) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-3 w-full border-amber-300 text-amber-700 hover:bg-amber-50"
                            onClick={() => setReviewReservation(r)}
                          >
                            ⭐ Noter ce panier
                          </Button>
                        )}
                        {myReviews.find(rv => rv.reservation_id === r.id) && (
                          <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                            ✅ Vous avez noté ce panier · {myReviews.find(rv => rv.reservation_id === r.id).rating_overall}/5
                          </p>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>

      <ReservationModal
        basket={selectedBasket}
        user={user}
        open={showModal}
        onClose={() => { setShowModal(false); setSelectedBasket(null); }}
        onSuccess={handleReservationSuccess}
      />
      <BasketReviewModal
        reservation={reviewReservation}
        user={user}
        open={!!reviewReservation}
        onClose={() => setReviewReservation(null)}
      />
    </div>
  );
}