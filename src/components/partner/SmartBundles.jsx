import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PackagePlus, ArrowRight, Sparkles } from 'lucide-react';

export default function SmartBundles({ products }) {
  // Mock bundle suggestions
  // Suggest bundling expiring items with popular categories
  const expiring = products
    .filter(p => {
        const days = (new Date(p.expiration_date) - new Date()) / (1000 * 60 * 60 * 24);
        return days < 5 && days > 0;
    })
    .slice(0, 2);

  const popular = products
    .filter(p => p.category === 'fruits_legumes' || p.category === 'epicerie')
    .slice(0, 2);

  const hasSuggestions = expiring.length > 0 && popular.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Sparkles className="w-4 h-4 text-purple-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Suggestions de Lots</h3>
          <p className="text-sm text-gray-500">Optimisez vos ventes croisées</p>
        </div>
      </div>

      {hasSuggestions ? (
        <div className="space-y-3">
          <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
            <div className="flex items-center justify-between mb-3">
              <Badge className="bg-purple-200 text-purple-700 hover:bg-purple-200">Panier Anti-Gaspi</Badge>
              <span className="text-sm font-bold text-purple-700">-25%</span>
            </div>
            
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 bg-white p-2 rounded-lg shadow-sm text-center">
                <p className="text-xs font-medium truncate">{expiring[0].name}</p>
                <p className="text-[10px] text-gray-500">Expire bientôt</p>
              </div>
              <PlusIcon />
              <div className="flex-1 bg-white p-2 rounded-lg shadow-sm text-center">
                <p className="text-xs font-medium truncate">{popular[0]?.name || "Riz Thaï"}</p>
                <p className="text-[10px] text-gray-500">Populaire</p>
              </div>
            </div>

            <Button className="w-full bg-purple-600 hover:bg-purple-700 h-8 text-xs">
              Créer ce lot <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>

          <div className="p-4 bg-white rounded-xl border border-gray-100">
             <div className="flex items-center justify-between mb-3">
              <Badge variant="outline">Découverte</Badge>
              <span className="text-sm font-bold text-gray-900">-15%</span>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Associez vos produits laitiers avec des fruits frais pour booster les ventes du petit-déjeuner.
            </p>
            <Button variant="outline" className="w-full h-8 text-xs">
              Configurer
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-xl">
          <PackagePlus className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Aucune suggestion pour le moment</p>
        </div>
      )}
    </div>
  );
}

const PlusIcon = () => (
  <div className="w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <path d="M12 5v14M5 12h14" />
    </svg>
  </div>
);