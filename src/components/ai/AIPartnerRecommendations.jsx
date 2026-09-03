import React from 'react';
import { api } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Store, MapPin, Star, Sparkles, Loader2 } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * Classe les magasins partenaires par pertinence : même ville que
 * l'utilisateur, magasins déjà fréquentés, favoris, puis note et volume de
 * produits sauvés. Un score explicite, lisible et reproductible — là où un
 * modèle de langage coûterait un appel réseau pour un tri.
 */
function scoreStore(store, { city, visited, favorites }) {
  let score = 0;
  const reasons = [];

  if (favorites.includes(store.id)) {
    score += 50;
    reasons.push('Dans vos favoris');
  }
  if (visited.includes(store.name)) {
    score += 30;
    reasons.push('Vous y avez déjà commandé');
  }
  if (city && store.city?.toLowerCase() === city.toLowerCase()) {
    score += 25;
    reasons.push(`À ${store.city}`);
  }
  score += (store.rating ?? 0) * 4;
  score += Math.min(20, (store.total_products_saved ?? 0) / 50);

  if (!reasons.length && store.rating >= 4) reasons.push(`Noté ${store.rating}/5`);
  if (!reasons.length && store.total_products_saved > 0) {
    reasons.push(`${store.total_products_saved} produits sauvés`);
  }

  return { score, reason: reasons[0] ?? 'Partenaire vérifié' };
}

export default function AIPartnerRecommendations({ user }) {
  const { data: stores = [], isLoading } = useQuery({
    queryKey: ['stores', 'verified'],
    queryFn: () => api.entities.Store.filter({ is_partner: true, status: 'verified' }, '-rating', 50),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['orders', 'mine', user?.email],
    queryFn: () => api.entities.Order.filter({ customer_email: user?.email }, '-created_date', 20),
    enabled: Boolean(user),
  });

  const context = {
    city: user?.city ?? '',
    visited: orders.map((o) => o.store_name).filter(Boolean),
    favorites: user?.favorite_stores ?? [],
  };

  const recommendations = stores
    .map((store) => ({ ...store, ...scoreStore(store, context) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((store) => ({ ...store, aiReason: store.reason }));

  const loading = isLoading;

  if (loading) {
    return (
      <Card className="p-6 bg-gradient-to-r from-teal-50 to-emerald-50 border-teal-200">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
          <span className="text-teal-700">Recherche des meilleurs partenaires...</span>
        </div>
      </Card>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-lg">
          <Store className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Partenaires recommandés</h3>
          <p className="text-xs text-gray-500">Selon vos habitudes</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {recommendations.map((store) => (
          <Card key={store.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3 mb-3">
              {store.logo_url ? (
                <img src={store.logo_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
              ) : (
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Store className="w-6 h-6 text-emerald-600" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 truncate">{store.name}</h4>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {store.city}
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-sm font-medium">{store.rating || 4.5}</span>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                {store.total_products_saved || 0} sauvés
              </Badge>
            </div>

            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-500" />
              {store.aiReason || 'Recommandé pour vous'}
            </p>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}