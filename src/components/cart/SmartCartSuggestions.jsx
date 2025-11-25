import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, Package, ChevronRight, Check, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';

export default function SmartCartSuggestions({ cartItems, user, onOptimize }) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [suggestions, setSuggestions] = useState(null);

  const analyzeCart = async () => {
    if (cartItems.length < 2) {
      toast.info('Ajoutez plus de produits pour des suggestions');
      return;
    }

    setIsOptimizing(true);

    // Calculate potential bundle savings
    const currentTotal = cartItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    
    // Simulate AI analysis
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Tu es un assistant shopping intelligent. Analyse ce panier et propose des optimisations:
      
Panier actuel:
${cartItems.map(item => `- ${item.product_name}: ${item.unit_price} FCFA x ${item.quantity}`).join('\n')}

Total: ${currentTotal} FCFA

Propose:
1. Des économies possibles (ex: si achète 2 au lieu de 1)
2. Des produits complémentaires qui iraient bien ensemble
3. Des alternatives moins chères si disponibles

Réponds en JSON:`,
      response_json_schema: {
        type: 'object',
        properties: {
          optimizations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                description: { type: 'string' },
                savings: { type: 'number' },
                action: { type: 'string' }
              }
            }
          },
          total_potential_savings: { type: 'number' },
          recommendation: { type: 'string' }
        }
      }
    });

    setSuggestions(result);
    setIsOptimizing(false);
  };

  const currentTotal = cartItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  const currentSavings = cartItems.reduce((sum, item) => 
    sum + ((item.original_price - item.unit_price) * item.quantity), 0
  );

  return (
    <Card className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-indigo-100 rounded-xl">
          <Sparkles className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Panier Intelligent</h3>
          <p className="text-xs text-gray-500">IA Mini-Coach</p>
        </div>
      </div>

      {/* Current savings display */}
      <div className="bg-white rounded-xl p-3 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Économies actuelles</span>
          <span className="font-bold text-emerald-600">-{currentSavings.toLocaleString()} FCFA</span>
        </div>
        <div className="h-2 bg-emerald-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((currentSavings / currentTotal) * 100, 100)}%` }}
            className="h-full bg-gradient-to-r from-emerald-400 to-teal-500"
          />
        </div>
      </div>

      {!suggestions ? (
        <Button
          onClick={analyzeCart}
          disabled={isOptimizing || cartItems.length < 2}
          className="w-full bg-indigo-500 hover:bg-indigo-600"
        >
          {isOptimizing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyse en cours...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Optimiser mon panier
            </>
          )}
        </Button>
      ) : (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {/* Recommendation */}
            <div className="bg-white rounded-xl p-3 border border-indigo-100">
              <p className="text-sm text-gray-700">{suggestions.recommendation}</p>
            </div>

            {/* Optimizations */}
            {suggestions.optimizations?.map((opt, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-xl p-3 border border-gray-100"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-1.5 rounded-lg ${
                    opt.type === 'bundle' ? 'bg-purple-100' :
                    opt.type === 'alternative' ? 'bg-blue-100' :
                    'bg-emerald-100'
                  }`}>
                    <Package className={`w-4 h-4 ${
                      opt.type === 'bundle' ? 'text-purple-600' :
                      opt.type === 'alternative' ? 'text-blue-600' :
                      'text-emerald-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">{opt.description}</p>
                    {opt.savings > 0 && (
                      <Badge className="mt-2 bg-emerald-100 text-emerald-700">
                        Économisez {opt.savings.toLocaleString()} FCFA
                      </Badge>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Total potential savings */}
            {suggestions.total_potential_savings > 0 && (
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl p-4 text-center">
                <p className="text-sm text-emerald-100">Économies potentielles totales</p>
                <p className="text-2xl font-bold">{suggestions.total_potential_savings.toLocaleString()} FCFA</p>
              </div>
            )}

            <Button
              variant="outline"
              onClick={() => setSuggestions(null)}
              className="w-full"
            >
              Nouvelle analyse
            </Button>
          </motion.div>
        </AnimatePresence>
      )}
    </Card>
  );
}