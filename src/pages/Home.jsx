import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { api } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, ChevronRight, Sparkles, Users, ChefHat, Trophy, Flame } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import ProductCard from '@/components/ui/ProductCard';
import CategoryPill, { categories } from '@/components/ui/CategoryPill';
import UrgencyBanner from '@/components/ui/UrgencyBanner';
import SavingsCounter from '@/components/ui/SavingsCounter';
import AIProductRecommendations from '@/components/ai/AIProductRecommendations';
import AIRecipeRecommendations from '@/components/ai/AIRecipeRecommendations';
import AIPartnerRecommendations from '@/components/ai/AIPartnerRecommendations';
import EnhancedPersonalizedFeed from '@/components/feed/EnhancedPersonalizedFeed';
import OrderNotifications from '@/components/notifications/OrderNotifications';
import { goToLogin } from '@/lib/navigation';

export default function Home() {
  const [user, setUser] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await api.auth.me();
        setUser(userData);
      } catch {
        // Visiteur non connecté : la page reste consultable en anonyme.
      }
    };
    loadUser();
  }, []);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.entities.Product.filter({ status: 'active' }, '-created_date', 50),
  });

  const addToCart = async (product) => {
    if (!user) {
      goToLogin();
      return;
    }
    
    const existingItems = await api.entities.CartItem.filter({ 
      user_email: user.email, 
      product_id: product.id 
    });
    
    if (existingItems.length > 0) {
      await api.entities.CartItem.update(existingItems[0].id, {
        quantity: (existingItems[0].quantity || 1) + 1
      });
    } else {
      await api.entities.CartItem.create({
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
      {/* Order Notifications */}
      {user && <OrderNotifications userEmail={user.email} />}
      
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

          {/* AI Product Recommendations */}
          {user && (
            <AIProductRecommendations user={user} onAddToCart={addToCart} />
          )}

          {/* AI Recipe Recommendations */}
          {user && (
            <AIRecipeRecommendations user={user} />
          )}

          {/* AI Partner Recommendations */}
          {user && (
            <AIPartnerRecommendations user={user} />
          )}

          {/* Personalized Feed */}
          {user && (
            <section>
              <EnhancedPersonalizedFeed user={user} onAddToCart={addToCart} />
            </section>
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

        {/* Quick Access Cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to={createPageUrl('Community')}>
            <Card className="p-4 hover:shadow-md transition-shadow bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-100">
              <Users className="w-8 h-8 text-purple-500 mb-2" />
              <h3 className="font-semibold text-gray-900">Communauté</h3>
              <p className="text-xs text-gray-500">Partagez vos économies</p>
            </Card>
          </Link>
          <Link to={createPageUrl('FoodCoach')}>
            <Card className="p-4 hover:shadow-md transition-shadow bg-gradient-to-br from-orange-50 to-red-50 border-orange-100">
              <ChefHat className="w-8 h-8 text-orange-500 mb-2" />
              <h3 className="font-semibold text-gray-900">FoodCoach IA</h3>
              <p className="text-xs text-gray-500">Recettes anti-gaspi</p>
            </Card>
          </Link>
          <Link to={createPageUrl('Community')}>
            <Card className="p-4 hover:shadow-md transition-shadow bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-100">
              <Trophy className="w-8 h-8 text-amber-500 mb-2" />
              <h3 className="font-semibold text-gray-900">Classement</h3>
              <p className="text-xs text-gray-500">Top éco-héros</p>
            </Card>
          </Link>
          <Link to={createPageUrl('Community')}>
            <Card className="p-4 hover:shadow-md transition-shadow bg-gradient-to-br from-red-50 to-pink-50 border-red-100">
              <Flame className="w-8 h-8 text-red-500 mb-2" />
              <h3 className="font-semibold text-gray-900">Défis</h3>
              <p className="text-xs text-gray-500">Gagnez des badges</p>
            </Card>
          </Link>
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