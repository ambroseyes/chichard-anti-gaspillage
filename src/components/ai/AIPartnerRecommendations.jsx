import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Store, MapPin, Star, Sparkles, Loader2, ChevronRight } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AIPartnerRecommendations({ user }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  const { data: stores = [] } = useQuery({
    queryKey: ['stores'],
    queryFn: () => base44.entities.Store.filter({ is_partner: true, status: 'verified' }),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['user-orders', user?.email],
    queryFn: () => base44.entities.Order.filter({ customer_email: user?.email }, '-created_date', 20),
    enabled: !!user,
  });

  useEffect(() => {
    const generateRecommendations = async () => {
      if (!stores.length) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      
      const userCity = user?.city || 'Douala';
      const purchasedStores = orders.map(o => o.store_name).filter(Boolean);
      const favoriteStores = user?.favorite_stores || [];

      const prompt = `Tu es un système de recommandation de magasins pour CHICHARD au Cameroun.

CONTEXTE UTILISATEUR:
- Ville: ${userCity}
- Magasins fréquentés: ${purchasedStores.slice(0, 5).join(', ') || 'Aucun'}
- Favoris: ${favoriteStores.join(', ') || 'Aucun'}

MAGASINS DISPONIBLES:
${stores.slice(0, 15).map(s => `- ${s.name} (${s.city}, note: ${s.rating || 4.5}/5, ${s.total_products_saved || 0} produits sauvés)`).join('\n')}

Recommande les 4 meilleurs magasins. Retourne un JSON:
{
  "store_names": ["nom1", "nom2", ...],
  "reasons": {
    "nom1": "raison courte",
    "nom2": "raison courte"
  }
}`;

      try {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: "object",
            properties: {
              store_names: { type: "array", items: { type: "string" } },
              reasons: { type: "object" }
            }
          }
        });

        const recommendedStores = stores
          .filter(s => result.store_names?.some(name => 
            s.name.toLowerCase().includes(name.toLowerCase())
          ))
          .map(s => ({
            ...s,
            aiReason: result.reasons?.[s.name] || 'Recommandé pour vous'
          }))
          .slice(0, 4);

        setRecommendations(recommendedStores.length > 0 ? recommendedStores : stores.slice(0, 4));
      } catch (e) {
        setRecommendations(stores.slice(0, 4));
      }
      
      setLoading(false);
    };

    generateRecommendations();
  }, [stores, orders, user]);

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