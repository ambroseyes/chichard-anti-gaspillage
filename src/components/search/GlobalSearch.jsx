import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, ShoppingBag, ChefHat, Store, Flame,
  Clock, MapPin, Loader2, Filter, SlidersHorizontal
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function GlobalSearch({ isOpen, onClose, userRole }) {
  return <AdvancedGlobalSearch isOpen={isOpen} onClose={onClose} userRole={userRole} />;
}
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ products: [], recipes: [], stores: [], challenges: [] });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.length >= 2) {
      performSearch();
    } else {
      setResults({ products: [], recipes: [], stores: [], challenges: [] });
    }
  }, [query]);

  const performSearch = async () => {
    setLoading(true);
    const q = query.toLowerCase();

    try {
      const [products, recipes, stores, challenges] = await Promise.all([
        base44.entities.Product.filter({ status: 'active' }, '-created_date', 100),
        base44.entities.Recipe.list('-created_date', 50),
        base44.entities.Store.filter({ is_partner: true }),
        base44.entities.Challenge.filter({ is_active: true }),
      ]);

      setResults({
        products: products.filter(p => 
          p.name?.toLowerCase().includes(q) || 
          p.category?.toLowerCase().includes(q) ||
          p.store_name?.toLowerCase().includes(q)
        ).slice(0, 6),
        recipes: recipes.filter(r => 
          r.title?.toLowerCase().includes(q) || 
          r.description?.toLowerCase().includes(q)
        ).slice(0, 4),
        stores: stores.filter(s => 
          s.name?.toLowerCase().includes(q) || 
          s.city?.toLowerCase().includes(q)
        ).slice(0, 4),
        challenges: challenges.filter(c => 
          c.title?.toLowerCase().includes(q) || 
          c.description?.toLowerCase().includes(q)
        ).slice(0, 3),
      });
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const totalResults = results.products.length + results.recipes.length + 
    results.stores.length + results.challenges.length;

  const filteredResults = activeTab === 'all' ? results : {
    products: activeTab === 'products' ? results.products : [],
    recipes: activeTab === 'recipes' ? results.recipes : [],
    stores: activeTab === 'stores' ? results.stores : [],
    challenges: activeTab === 'challenges' ? results.challenges : [],
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        {/* Search Header */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher produits, recettes, magasins, défis..."
              className="pl-10 pr-10 h-12 text-lg border-0 focus-visible:ring-0"
            />
            {query && (
              <button 
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        {totalResults > 0 && (
          <div className="flex gap-2 p-3 border-b overflow-x-auto">
            {[
              { id: 'all', label: 'Tout', count: totalResults },
              { id: 'products', label: 'Produits', count: results.products.length, icon: ShoppingBag },
              { id: 'recipes', label: 'Recettes', count: results.recipes.length, icon: ChefHat },
              { id: 'stores', label: 'Magasins', count: results.stores.length, icon: Store },
              { id: 'challenges', label: 'Défis', count: results.challenges.length, icon: Flame },
            ].filter(t => t.id === 'all' || t.count > 0).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.icon && <tab.icon className="w-4 h-4" />}
                {tab.label}
                <span className="text-xs opacity-70">({tab.count})</span>
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        <div className="max-h-96 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            </div>
          ) : query.length < 2 ? (
            <div className="text-center py-8 text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Tapez au moins 2 caractères pour rechercher</p>
            </div>
          ) : totalResults === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Aucun résultat pour "{query}"</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Products */}
              {filteredResults.products.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-500 text-sm mb-2 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4" /> Produits
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {filteredResults.products.map((product) => (
                      <Link
                        key={product.id}
                        to={createPageUrl(`ProductDetail?id=${product.id}`)}
                        onClick={onClose}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
                      >
                        <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                          {product.image_url ? (
                            <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">🛒</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{product.name}</p>
                          <p className="text-sm text-emerald-600">{product.discounted_price?.toLocaleString()} F</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Recipes */}
              {filteredResults.recipes.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-500 text-sm mb-2 flex items-center gap-2">
                    <ChefHat className="w-4 h-4" /> Recettes
                  </h3>
                  <div className="space-y-2">
                    {filteredResults.recipes.map((recipe) => (
                      <Link
                        key={recipe.id}
                        to={createPageUrl(`FoodCoach`)}
                        onClick={onClose}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
                      >
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <ChefHat className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{recipe.title}</p>
                          <p className="text-sm text-gray-500">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {recipe.prep_time} min
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Stores */}
              {filteredResults.stores.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-500 text-sm mb-2 flex items-center gap-2">
                    <Store className="w-4 h-4" /> Magasins
                  </h3>
                  <div className="space-y-2">
                    {filteredResults.stores.map((store) => (
                      <Link
                        key={store.id}
                        to={createPageUrl(`Catalog?store=${store.id}`)}
                        onClick={onClose}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
                      >
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Store className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{store.name}</p>
                          <p className="text-sm text-gray-500">
                            <MapPin className="w-3 h-3 inline mr-1" />
                            {store.city}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Challenges */}
              {filteredResults.challenges.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-500 text-sm mb-2 flex items-center gap-2">
                    <Flame className="w-4 h-4" /> Défis
                  </h3>
                  <div className="space-y-2">
                    {filteredResults.challenges.map((challenge) => (
                      <Link
                        key={challenge.id}
                        to={createPageUrl('Community')}
                        onClick={onClose}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
                      >
                        <div className="p-2 bg-red-100 rounded-lg">
                          <Flame className="w-5 h-5 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{challenge.title}</p>
                          <Badge className="bg-amber-100 text-amber-700 text-xs">+{challenge.reward_points} pts</Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}