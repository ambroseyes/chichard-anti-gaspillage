import React from 'react';
import { api } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Sparkles, Loader2 } from 'lucide-react';
import { Card } from "@/components/ui/card";
import ProductCard from '@/components/ui/ProductCard';

export default function AIProductRecommendations({ user, onAddToCart }) {
  // Le profil, l'historique et le catalogue sont assemblés côté serveur :
  // le navigateur n'envoie ni prompt ni données d'autres utilisateurs.
  const { data: products = [] } = useQuery({
    queryKey: ['products', 'active'],
    queryFn: () => api.entities.Product.filter({ status: 'active' }, '-expiration_date', 60),
  });

  const {
    data: suggestion,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['ai-product-recommendations', user?.email],
    queryFn: () => api.ai.productRecommendations(6),
    enabled: Boolean(user) && products.length > 0,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

  const byId = new Map(products.map((p) => [p.id, p]));
  const recommendations = isError
    ? products.slice(0, 6)
    : (suggestion?.recommendations ?? [])
        .map((r) => byId.get(r.product_id))
        .filter(Boolean)
        .slice(0, 6);

  const reason = isError
    ? 'Produits les plus urgents du moment'
    : (suggestion?.recommendations?.[0]?.reason ?? 'Sélection personnalisée');

  const loading = isLoading && !isError;

  if (loading) {
    return (
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
          <span className="text-purple-700">Génération des recommandations IA...</span>
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Pour vous</h3>
            <p className="text-xs text-gray-500">{reason}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {recommendations.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>
    </motion.div>
  );
}