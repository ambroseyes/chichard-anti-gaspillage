import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Sparkles, ChevronRight, Loader2 } from 'lucide-react';
import { Card } from "@/components/ui/card";
import ProductCard from '@/components/ui/ProductCard';

export default function AIProductRecommendations({ user, onAddToCart }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState('');

  const { data: orders = [] } = useQuery({
    queryKey: ['user-orders', user?.email],
    queryFn: () => base44.entities.Order.filter({ customer_email: user?.email }, '-created_date', 10),
    enabled: !!user,
  });

  const { data: products = [] } = useQuery({
    queryKey: ['all-products'],
    queryFn: () => base44.entities.Product.filter({ status: 'active' }, '-created_date', 100),
  });

  useEffect(() => {
    const generateRecommendations = async () => {
      if (!products.length) return;
      
      setLoading(true);
      
      // Build user context
      const purchaseHistory = orders.flatMap(o => o.items?.map(i => i.product_name) || []);
      const preferences = user?.dietary_preferences || [];
      const allergens = user?.allergens || [];
      
      const prompt = `Tu es un système de recommandation pour CHICHARD, une app anti-gaspillage au Cameroun.

HISTORIQUE UTILISATEUR:
- Achats précédents: ${purchaseHistory.slice(0, 10).join(', ') || 'Nouvel utilisateur'}
- Préférences: ${preferences.join(', ') || 'Non spécifiées'}
- Allergènes à éviter: ${allergens.join(', ') || 'Aucun'}

PRODUITS DISPONIBLES:
${products.slice(0, 30).map(p => `- ${p.name} (${p.category}, ${p.discounted_price} FCFA, expire dans ${Math.ceil((new Date(p.expiration_date) - new Date()) / 86400000)}j)`).join('\n')}

Recommande les 6 meilleurs produits pour cet utilisateur. Retourne un JSON avec:
- product_names: tableau des noms exacts des produits recommandés
- reason: courte explication personnalisée (max 50 mots)`;

      try {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: "object",
            properties: {
              product_names: { type: "array", items: { type: "string" } },
              reason: { type: "string" }
            }
          }
        });

        const recommendedProducts = products.filter(p => 
          result.product_names?.some(name => 
            p.name.toLowerCase().includes(name.toLowerCase()) || 
            name.toLowerCase().includes(p.name.toLowerCase())
          )
        ).slice(0, 6);

        setRecommendations(recommendedProducts.length > 0 ? recommendedProducts : products.slice(0, 6));
        setReason(result.reason || 'Sélection personnalisée selon vos goûts');
      } catch (e) {
        // Fallback to popular products
        setRecommendations(products.slice(0, 6));
        setReason('Produits populaires du moment');
      }
      
      setLoading(false);
    };

    generateRecommendations();
  }, [products, orders, user]);

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