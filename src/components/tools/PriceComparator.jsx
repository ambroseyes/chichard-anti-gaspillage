import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingDown, MapPin, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function PriceComparator() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['price-comparison', activeSearch],
    queryFn: async () => {
      if (!activeSearch) return [];
      
      const products = await base44.entities.Product.filter({ status: 'active' });
      
      // Filter products matching search
      const matching = products.filter(p => 
        p.name.toLowerCase().includes(activeSearch.toLowerCase()) ||
        p.description?.toLowerCase().includes(activeSearch.toLowerCase())
      );

      // Group by product name similarity
      const grouped = matching.reduce((acc, product) => {
        const key = product.name.toLowerCase().trim();
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(product);
        return acc;
      }, {});

      // Create comparisons
      return Object.entries(grouped).map(([name, prods]) => {
        const stores = prods.map(p => ({
          store_id: p.store_id,
          store_name: p.store_name,
          store_location: p.store_location,
          price: p.original_price,
          discounted_price: p.discounted_price,
          in_stock: p.quantity_available > 0,
          quantity: p.quantity_available,
          expiration_date: p.expiration_date,
          product_id: p.id,
          image_url: p.image_url
        })).sort((a, b) => a.discounted_price - b.discounted_price);

        const avgPrice = stores.reduce((sum, s) => sum + s.discounted_price, 0) / stores.length;
        const bestDeal = stores[0];

        return {
          product_name: prods[0].name,
          image_url: prods[0].image_url,
          category: prods[0].category,
          stores,
          best_deal: {
            ...bestDeal,
            savings: avgPrice - bestDeal.discounted_price
          }
        };
      });
    },
    enabled: !!activeSearch
  });

  const handleSearch = () => {
    setActiveSearch(searchQuery);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Comparateur de prix</h2>
        <p className="text-gray-500 text-sm mb-4">
          Comparez les prix des produits dans différents magasins et trouvez la meilleure offre
        </p>
        
        <div className="flex gap-2">
          <Input
            placeholder="Rechercher un produit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={isLoading}>
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto" />
        </div>
      )}

      {!isLoading && results.length === 0 && activeSearch && (
        <Card className="p-8 text-center">
          <TrendingDown className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">Aucun résultat</h3>
          <p className="text-gray-500 text-sm">
            Essayez avec un autre terme de recherche
          </p>
        </Card>
      )}

      <div className="space-y-6">
        {results.map((comparison, idx) => (
          <Card key={idx} className="p-6">
            <div className="flex items-start gap-4 mb-4">
              {comparison.image_url && (
                <img
                  src={comparison.image_url}
                  alt={comparison.product_name}
                  className="w-20 h-20 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <h3 className="font-bold text-lg">{comparison.product_name}</h3>
                <Badge variant="outline">{comparison.category}</Badge>
                <p className="text-sm text-gray-500 mt-1">
                  {comparison.stores.length} magasin{comparison.stores.length > 1 ? 's' : ''} comparé{comparison.stores.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Best Deal */}
            {comparison.best_deal && (
              <Card className="p-4 bg-emerald-50 border-emerald-200 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Badge className="bg-emerald-500 mb-2">Meilleure offre</Badge>
                    <p className="font-semibold">{comparison.best_deal.store_name}</p>
                    <p className="text-sm text-gray-500">{comparison.best_deal.store_location}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-emerald-600">
                      {comparison.best_deal.discounted_price.toLocaleString()} F
                    </p>
                    {comparison.best_deal.savings > 0 && (
                      <p className="text-sm text-emerald-600">
                        -{comparison.best_deal.savings.toFixed(0)} F vs moyenne
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* All Stores */}
            <div className="space-y-2">
              {comparison.stores.map((store, storeIdx) => {
                const discount = Math.round((1 - store.discounted_price / store.price) * 100);
                const daysLeft = Math.ceil(
                  (new Date(store.expiration_date) - new Date()) / (1000 * 60 * 60 * 24)
                );

                return (
                  <Link
                    key={storeIdx}
                    to={createPageUrl('ProductDetail') + '?id=' + store.product_id}
                    className="block"
                  >
                    <Card className="p-3 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{store.store_name}</p>
                            {storeIdx === 0 && (
                              <Badge className="bg-emerald-500 text-xs">Best</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {store.store_location && (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {store.store_location}
                              </span>
                            )}
                            <Badge variant="outline" className="text-xs">-{discount}%</Badge>
                            {!store.in_stock && (
                              <Badge variant="outline" className="bg-red-50 text-red-600 text-xs">
                                Rupture
                              </Badge>
                            )}
                            {daysLeft <= 3 && store.in_stock && (
                              <Badge className="bg-orange-500 text-white text-xs flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {daysLeft}j
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-emerald-600">
                            {store.discounted_price.toLocaleString()} F
                          </p>
                          <p className="text-xs text-gray-400 line-through">
                            {store.price.toLocaleString()} F
                          </p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}