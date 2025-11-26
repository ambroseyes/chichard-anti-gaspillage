import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, ShoppingBag, ChefHat, Lightbulb, Flame, Users,
  TrendingUp, Heart, Clock, Star, Loader2
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductCard from '@/components/ui/ProductCard';

export default function PersonalizedFeed({ user, onAddToCart }) {
  const [feedItems, setFeedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.filter({ status: 'active' }, '-created_date', 50),
  });

  const { data: recipes = [] } = useQuery({
    queryKey: ['recipes'],
    queryFn: () => base44.entities.Recipe.list('-created_date', 20),
  });

  const { data: tips = [] } = useQuery({
    queryKey: ['tips'],
    queryFn: () => base44.entities.ZeroWasteTip.list('-created_date', 20),
  });

  const { data: challenges = [] } = useQuery({
    queryKey: ['challenges'],
    queryFn: () => base44.entities.Challenge.filter({ is_active: true }),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['user-orders', user?.email],
    queryFn: () => base44.entities.Order.filter({ customer_email: user?.email }, '-created_date', 20),
    enabled: !!user,
  });

  useEffect(() => {
    if (products.length > 0) {
      generatePersonalizedFeed();
    }
  }, [products, recipes, tips, challenges, orders, user]);

  const generatePersonalizedFeed = async () => {
    setLoading(true);

    // Build user profile
    const purchaseHistory = orders.flatMap(o => o.items?.map(i => i.product_name) || []);
    const purchasedCategories = orders.flatMap(o => 
      o.items?.map(i => products.find(p => p.id === i.product_id)?.category).filter(Boolean) || []
    );
    const preferences = user?.dietary_preferences || [];
    const allergens = user?.allergens || [];

    // Score products based on user profile
    const scoredProducts = products.map(product => {
      let score = 50; // Base score

      // Category affinity
      const categoryCount = purchasedCategories.filter(c => c === product.category).length;
      score += categoryCount * 10;

      // Dietary match
      if (preferences.includes('Végétarien') && ['fruits_legumes', 'produits_laitiers'].includes(product.category)) {
        score += 15;
      }

      // Allergen check (negative)
      if (allergens.some(a => product.allergens?.includes(a))) {
        score -= 100;
      }

      // Urgency boost
      const daysLeft = Math.ceil((new Date(product.expiration_date) - new Date()) / 86400000);
      if (daysLeft <= 2) score += 20;
      else if (daysLeft <= 5) score += 10;

      // Discount boost
      const discount = Math.round((1 - product.discounted_price / product.original_price) * 100);
      score += discount / 2;

      // Popularity
      score += (product.views_count || 0) / 10;
      score += (product.favorites_count || 0) * 2;

      return { ...product, score, type: 'product' };
    }).filter(p => p.score > 0);

    // Score recipes
    const scoredRecipes = recipes.map(recipe => {
      let score = 40;
      if (recipe.is_ai_generated) score += 10;
      score += (recipe.likes_count || 0) * 2;
      return { ...recipe, score, type: 'recipe' };
    });

    // Score tips
    const scoredTips = tips.map(tip => {
      let score = 30;
      score += (tip.likes_count || 0) * 3;
      return { ...tip, score, type: 'tip' };
    });

    // Score challenges
    const scoredChallenges = challenges.map(challenge => {
      let score = 35;
      score += (challenge.participants_count || 0) / 5;
      return { ...challenge, score, type: 'challenge' };
    });

    // Combine and sort
    const allItems = [
      ...scoredProducts.slice(0, 12),
      ...scoredRecipes.slice(0, 4),
      ...scoredTips.slice(0, 3),
      ...scoredChallenges.slice(0, 2),
    ].sort((a, b) => b.score - a.score);

    // Interleave for variety
    const finalFeed = [];
    let productIdx = 0, recipeIdx = 0, tipIdx = 0, challengeIdx = 0;
    
    for (let i = 0; i < 20; i++) {
      const mod = i % 5;
      if (mod < 3 && productIdx < scoredProducts.length) {
        finalFeed.push(scoredProducts[productIdx++]);
      } else if (mod === 3 && recipeIdx < scoredRecipes.length) {
        finalFeed.push(scoredRecipes[recipeIdx++]);
      } else if (mod === 4) {
        if (tipIdx < scoredTips.length) finalFeed.push(scoredTips[tipIdx++]);
        else if (challengeIdx < scoredChallenges.length) finalFeed.push(scoredChallenges[challengeIdx++]);
      }
    }

    setFeedItems(finalFeed);
    setLoading(false);
  };

  const filteredItems = activeFilter === 'all' 
    ? feedItems 
    : feedItems.filter(item => item.type === activeFilter);

  if (loading) {
    return (
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
          <span className="text-purple-700">Personnalisation de votre fil...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-purple-500" />
        <h3 className="font-semibold">Pour vous</h3>
        <Badge className="bg-purple-100 text-purple-700 text-xs">IA</Badge>
      </div>

      <Tabs value={activeFilter} onValueChange={setActiveFilter}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">Tout</TabsTrigger>
          <TabsTrigger value="product">
            <ShoppingBag className="w-4 h-4 mr-1" />
            Produits
          </TabsTrigger>
          <TabsTrigger value="recipe">
            <ChefHat className="w-4 h-4 mr-1" />
            Recettes
          </TabsTrigger>
          <TabsTrigger value="tip">
            <Lightbulb className="w-4 h-4 mr-1" />
            Astuces
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-4">
        <AnimatePresence>
          {filteredItems.map((item, idx) => (
            <motion.div
              key={`${item.type}-${item.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: idx * 0.05 }}
            >
              {item.type === 'product' && (
                <ProductCard product={item} onAddToCart={onAddToCart} />
              )}
              
              {item.type === 'recipe' && (
                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <ChefHat className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <Badge className="bg-orange-100 text-orange-700 text-xs mb-1">Recette</Badge>
                      <h4 className="font-semibold">{item.title}</h4>
                      <p className="text-sm text-gray-500">{item.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span><Clock className="w-3 h-3 inline mr-1" />{item.prep_time} min</span>
                        <span><Heart className="w-3 h-3 inline mr-1" />{item.likes_count || 0}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
              
              {item.type === 'tip' && (
                <Card className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Lightbulb className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <Badge className="bg-amber-100 text-amber-700 text-xs mb-1">Astuce</Badge>
                      <h4 className="font-semibold">{item.title}</h4>
                      <p className="text-sm text-gray-600">{item.content}</p>
                    </div>
                  </div>
                </Card>
              )}
              
              {item.type === 'challenge' && (
                <Card className="p-4 bg-gradient-to-r from-red-50 to-orange-50">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Flame className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <Badge className="bg-red-100 text-red-700 text-xs mb-1">Défi</Badge>
                      <h4 className="font-semibold">{item.title}</h4>
                      <p className="text-sm text-gray-600">{item.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className="bg-amber-100 text-amber-700">+{item.reward_points} pts</Badge>
                        <span className="text-xs text-gray-500">
                          <Users className="w-3 h-3 inline mr-1" />
                          {item.participants_count || 0} participants
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}