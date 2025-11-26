import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Package, Sparkles, TrendingUp, Plus, Check, Loader2,
  ShoppingBag, Zap
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function BundleSuggestions({ products, user }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    generateSuggestions();
  }, [products]);

  const generateSuggestions = async () => {
    if (products.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Analyze products for bundling potential
    const urgentProducts = products.filter(p => {
      const daysLeft = Math.ceil((new Date(p.expiration_date) - new Date()) / 86400000);
      return daysLeft <= 5 && p.status === 'active';
    });

    const slowMoving = products.filter(p => {
      const daysListed = Math.ceil((new Date() - new Date(p.created_date)) / 86400000) || 1;
      const velocity = (p.quantity_sold || 0) / daysListed;
      return velocity < 0.5 && p.status === 'active';
    });

    // Group by complementary categories
    const categoryPairs = {
      'boulangerie': ['produits_laitiers', 'boissons'],
      'fruits_legumes': ['epicerie', 'viandes_poissons'],
      'produits_laitiers': ['boulangerie', 'fruits_legumes'],
      'viandes_poissons': ['fruits_legumes', 'epicerie'],
    };

    const bundles = [];

    // Create bundles from urgent + complementary
    for (const urgent of urgentProducts.slice(0, 3)) {
      const complements = categoryPairs[urgent.category] || [];
      const partner = products.find(p => 
        p.id !== urgent.id && 
        complements.includes(p.category) &&
        p.status === 'active'
      );

      if (partner) {
        const originalTotal = urgent.original_price + partner.original_price;
        const bundlePrice = Math.round((urgent.discounted_price + partner.discounted_price) * 0.9);
        const savings = originalTotal - bundlePrice;

        bundles.push({
          id: `${urgent.id}-${partner.id}`,
          products: [urgent, partner],
          bundlePrice,
          originalTotal,
          savings,
          savingsPercent: Math.round((savings / originalTotal) * 100),
          reason: 'Produits complémentaires',
          urgency: urgent.expiration_date
        });
      }
    }

    // Create bundles from slow moving items
    if (slowMoving.length >= 2) {
      const [p1, p2] = slowMoving.slice(0, 2);
      const originalTotal = p1.original_price + p2.original_price;
      const bundlePrice = Math.round((p1.discounted_price + p2.discounted_price) * 0.85);
      
      bundles.push({
        id: `slow-${p1.id}-${p2.id}`,
        products: [p1, p2],
        bundlePrice,
        originalTotal,
        savings: originalTotal - bundlePrice,
        savingsPercent: Math.round(((originalTotal - bundlePrice) / originalTotal) * 100),
        reason: 'Accélérer les ventes',
        urgency: null
      });
    }

    setSuggestions(bundles.slice(0, 4));
    setLoading(false);
  };

  const createBundleMutation = useMutation({
    mutationFn: async (bundle) => {
      await base44.entities.Product.create({
        name: `Pack ${bundle.products.map(p => p.name).join(' + ')}`,
        description: `Bundle exclusif: ${bundle.products.map(p => p.name).join(' et ')}`,
        original_price: bundle.originalTotal,
        discounted_price: bundle.bundlePrice,
        category: bundle.products[0].category,
        expiration_date: bundle.products.reduce((min, p) => 
          p.expiration_date < min ? p.expiration_date : min, 
          bundle.products[0].expiration_date
        ),
        quantity_available: Math.min(...bundle.products.map(p => p.quantity_available)),
        store_name: user.store_name || user.full_name,
        store_id: user.store_id,
        status: 'active',
        is_bundle: true,
        bundle_products: bundle.products.map(p => p.id)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-products'] });
      toast.success('Bundle créé avec succès !');
    }
  });

  if (loading) {
    return (
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
          <span className="text-purple-700">Analyse des bundles potentiels...</span>
        </div>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-purple-500" />
        <h3 className="font-semibold">Suggestions de Bundles IA</h3>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {suggestions.map((bundle, idx) => (
          <motion.div
            key={bundle.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="p-4 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
              <div className="flex items-start justify-between mb-3">
                <Badge className="bg-purple-100 text-purple-700">
                  <Zap className="w-3 h-3 mr-1" />
                  {bundle.reason}
                </Badge>
                <Badge className="bg-emerald-100 text-emerald-700">
                  -{bundle.savingsPercent}%
                </Badge>
              </div>

              <div className="space-y-2 mb-4">
                {bundle.products.map((product) => (
                  <div key={product.id} className="flex items-center gap-2 text-sm">
                    <Package className="w-4 h-4 text-gray-400" />
                    <span className="flex-1 truncate">{product.name}</span>
                    <span className="text-gray-500 line-through">{product.original_price} F</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                <div>
                  <p className="text-xs text-gray-500">Prix bundle</p>
                  <p className="text-lg font-bold text-purple-600">{bundle.bundlePrice.toLocaleString()} F</p>
                </div>
                <Button 
                  size="sm"
                  onClick={() => createBundleMutation.mutate(bundle)}
                  disabled={createBundleMutation.isPending}
                  className="bg-purple-500 hover:bg-purple-600"
                >
                  {createBundleMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-1" />
                      Créer
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}