import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function AIProductRecommendations({ storeId, onAddProduct }) {
  const [generating, setGenerating] = useState(false);

  const { data: orders = [] } = useQuery({
    queryKey: ['orders-analysis'],
    queryFn: () => api.entities.Order.list('-created_date', 100),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products-analysis'],
    queryFn: () => api.entities.Product.list('-created_date', 100),
  });

  const generateRecommendations = async () => {
    setGenerating(true);
    try {
      const result = await api.ai.partnerRestockAdvice();

      return result.recommendations;
    } catch (e) {
      toast.error("Erreur lors de la génération");
      return [];
    } finally {
      setGenerating(false);
    }
  };

  const { data: recommendations = [], refetch } = useQuery({
    queryKey: ['ai-recommendations', storeId],
    queryFn: generateRecommendations,
    enabled: false,
  });

  const categoryColors = {
    fruits_legumes: 'bg-green-100 text-green-700',
    produits_laitiers: 'bg-blue-100 text-blue-700',
    viandes_poissons: 'bg-red-100 text-red-700',
    boulangerie: 'bg-amber-100 text-amber-700',
    boissons: 'bg-purple-100 text-purple-700',
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Recommandations IA</h3>
            <p className="text-xs text-gray-500">Produits tendance à ajouter</p>
          </div>
        </div>
        <Button 
          size="sm" 
          onClick={() => refetch()}
          disabled={generating}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {generating ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          {generating ? 'Analyse...' : 'Analyser'}
        </Button>
      </div>

      {recommendations.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm">Cliquez sur "Analyser" pour obtenir des recommandations</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recommendations.map((rec, idx) => (
            <div key={idx} className="bg-white rounded-xl p-4 border border-purple-100">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900">{rec.product_name}</h4>
                    <Badge className={categoryColors[rec.category] || 'bg-gray-100 text-gray-700'}>
                      {rec.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{rec.reason}</p>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-emerald-600 font-semibold">
                      {rec.suggested_price?.toLocaleString()} FCFA
                    </span>
                    <div className="flex items-center gap-1 text-orange-600">
                      <TrendingUp className="w-4 h-4" />
                      <span>Score: {rec.trend_score}/10</span>
                    </div>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onAddProduct?.(rec)}
                  className="ml-2"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}