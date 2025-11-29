import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, ArrowRight, TrendingUp } from 'lucide-react';

export default function BundlingAnalysis() {
  const bundles = [
    { name: "Pack Petit-Déj", performance: "+24%", status: "top", items: ["Lait", "Céréales", "Café"] },
    { name: "Panier Légumes", performance: "+12%", status: "stable", items: ["Tomates", "Oignons", "Carottes"] },
    { name: "Kit Apéro", performance: "-5%", status: "low", items: ["Chips", "Soda", "Arachides"] }
  ];

  const suggestions = [
    { name: "Pack Famille", reason: "Forte corrélation d'achat le week-end", potential: "+18%" },
    { name: "Duo Fraîcheur", reason: "Produits souvent achetés ensemble en été", potential: "+10%" }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Analyse de Bundling</h3>
        
        <div className="grid gap-3">
          {bundles.map((bundle, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${bundle.status === 'top' ? 'bg-green-100 text-green-600' : bundle.status === 'low' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium">{bundle.name}</p>
                  <p className="text-xs text-gray-500">{bundle.items.join(', ')}</p>
                </div>
              </div>
              <Badge variant={bundle.status === 'top' ? 'success' : 'secondary'}>
                {bundle.performance}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-500" />
          Suggestions IA
        </h4>
        <div className="grid gap-3">
          {suggestions.map((sug, i) => (
            <div key={i} className="border border-indigo-100 bg-indigo-50/50 p-3 rounded-xl">
              <div className="flex justify-between items-start mb-1">
                <p className="font-medium text-indigo-900">{sug.name}</p>
                <span className="text-xs font-bold text-green-600">{sug.potential}</span>
              </div>
              <p className="text-xs text-indigo-700">{sug.reason}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}