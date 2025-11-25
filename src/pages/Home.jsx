import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, MapPin, ChevronRight, Clock, Zap, Sparkles } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ProductCard from '@/components/ui/ProductCard';
import CategoryPill, { categories } from '@/components/ui/CategoryPill';
import UrgencyBanner from '@/components/ui/UrgencyBanner';
import SavingsCounter from '@/components/ui/SavingsCounter';

export default function Home() {
  const [user, setUser] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {}
    };
    loadUser();
  }, []);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.filter({ status: 'active' }, '-created_date', 50),
  });

  const addToCart = async (product) => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }
    
    const existingItems = await base44.entities.CartItem.filter({ 
      user_email: user.email, 
      product_id: product.id 
    });
    
    if (existingItems.length > 0) {
      await base44.entities.CartItem.update(existingItems[0].id, {
        quantity: (existingItems[0].quantity || 1) + 1
      });
    } else {
      await base44.entities.CartItem.create({
        user_email: user.email,
        product_id: product.id,
        product_name: product.name,
        product_image: product.image_url,
        quantity: 1,
        unit_price: product.discounted_price,
        original_price: product.original_price,
        store_name: product.store_name,
        expiration_date: product.expiration_date
      });
    }
  };

  // Filter urgent products (expire within 3 days)
  const urgentProducts = products.filter(p => {
    const daysLeft = Math.ceil((new Date(p.expiration_date) - new Date()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 3 && daysLeft > 0;
  });

  // Filter by category and search
  const filteredProducts = products.filter(p => {
    const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchSearch = !searchQuery || 
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.store_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6"
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Sauvez des produits, <br className="md:hidden" />
              <span className="text-emerald-100">économisez gros</span>
            </h1>
            <p className="text-emerald-100 text-sm md:text-base">
              Des réductions jusqu'à -70% sur les produits proches de leur date limite
            </p>
          </motion.div>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Rechercher un produit ou un magasin..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 h-12 rounded-xl border-0 shadow-lg text-gray-900"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* User Stats (if logged in) */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <SavingsCounter 
              totalSavings={user.total_savings || 0}
              wasteAvoided={user.waste_avoided_kg || 0}
              ecoLevel={user.eco_level || 'debutant'}
            />
          </motion.div>
        )}

        {/* Urgent Products Banner */}
        {urgentProducts.length > 0 && (
          <section>
            <UrgencyBanner type="urgent" />
            
            <div className="mt-4 overflow-x-auto scrollbar-hide">
              <div className="flex gap-4 pb-2">
                {urgentProducts.slice(0, 6).map((product) => (
                  <div key={product.id} className="w-64 flex-shrink-0">
                    <ProductCard product={product} onAddToCart={addToCart} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Categories */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Catégories</h2>
          </div>
          <CategoryPill selected={selectedCategory} onSelect={setSelectedCategory} />
        </section>

        {/* Products Grid */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              {selectedCategory === 'all' ? 'Tous les produits' : categories.find(c => c.id === selectedCategory)?.label}
            </h2>
            <Link 
              to={createPageUrl('Catalog')}
              className="text-emerald-600 text-sm font-medium flex items-center gap-1"
            >
              Voir tout <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-4">
                  <Skeleton className="aspect-square rounded-xl mb-3" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Aucun produit trouvé</h3>
              <p className="text-gray-500 text-sm">Essayez une autre recherche ou catégorie</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onAddToCart={addToCart}
                />
              ))}
            </div>
          )}
        </section>

        {/* Partner CTA */}
        {user?.is_partner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg mb-1">Espace Partenaire</h3>
                <p className="text-indigo-100 text-sm">Gérez vos produits et consultez StockGuardian</p>
              </div>
              <Link to={createPageUrl('PartnerDashboard')}>
                <Button className="bg-white text-indigo-600 hover:bg-indigo-50">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Accéder
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}