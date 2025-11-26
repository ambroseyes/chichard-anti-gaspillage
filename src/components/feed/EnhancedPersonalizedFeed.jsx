import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, ShoppingBag, ChefHat, Lightbulb, Flame, Users,
  TrendingUp, Heart, Clock, Star, Loader2, ThumbsUp, Share2,
  Bookmark, Target
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductCard from '@/components/ui/ProductCard';

export default function EnhancedPersonalizedFeed({ user, onAddToCart }) {
  const [feedItems, setFeedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [aiReason, setAiReason] = useState('');

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.filter({ status: 'active' }, '-created_date', 100),
  });

  const { data: recipes = [] } = useQuery({
    queryKey: ['recipes'],
    queryFn: () => base44.entities.Recipe.list('-created_date', 30),
  });

  const { data: challenges = [] } = useQuery({
    queryKey: ['challenges'],
    queryFn: () => base44.entities.Challenge.filter({ is_active: true }),
  });

  const { data: partnerChallenges = [] } = useQuery({
    queryKey: ['partner-challenges'],
    queryFn: () => base44.entities.PartnerChallenge.filter({ is_active: true }),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['user-orders', user?.email],
    queryFn: () => base44.entities.Order.filter({ customer_email: user?.email }, '-created_date', 50),
    enabled: !!user,
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['user-interactions', user?.email],
    queryFn: () => base44.entities.UserInteraction.filter({ user_email: user?.email }, '-created_date', 200),
    enabled: !!user,
  });

  const { data: userChallenges = [] } = useQuery({
    queryKey: ['user-challenges', user?.email],
    queryFn: () => base44.entities.UserChallenge.filter({ user_email: user?.email }),
    enabled: !!user,
  });

  useEffect(() => {
    if (products.length > 0) {
      generateEnhancedFeed();
    }
  }, [products, recipes, challenges, partnerChallenges, orders, interactions, user]);

  const generateEnhancedFeed = async () => {
    setLoading(true);

    // Build comprehensive user profile
    const purchasedProducts = orders.flatMap(o => o.items || []);
    const purchasedCategories = {};
    const purchasedIngredients = [];
    
    purchasedProducts.forEach(item => {
      const product = products.find(p => p.id === item.product_id);
      if (product) {
        purchasedCategories[product.category] = (purchasedCategories[product.category] || 0) + 1;
        purchasedIngredients.push(product.name.toLowerCase());
      }
    });

    // Analyze interactions
    const likedItems = interactions.filter(i => i.interaction_type === 'like');
    const viewedItems = interactions.filter(i => i.interaction_type === 'view');
    const sharedItems = interactions.filter(i => i.interaction_type === 'share');
    const savedItems = interactions.filter(i => i.interaction_type === 'save');

    const likedCategories = {};
    likedItems.forEach(item => {
      if (item.category) {
        likedCategories[item.category] = (likedCategories[item.category] || 0) + 3;
      }
    });
    viewedItems.forEach(item => {
      if (item.category) {
        likedCategories[item.category] = (likedCategories[item.category] || 0) + 1;
      }
    });

    const preferences = user?.dietary_preferences || [];
    const allergens = user?.allergens || [];
    const favoriteStores = user?.favorite_stores || [];

    // Score products with enhanced AI
    const scoredProducts = products.map(product => {
      let score = 50;
      let reasons = [];

      // Category affinity from purchases
      const categoryPurchases = purchasedCategories[product.category] || 0;
      score += categoryPurchases * 8;
      if (categoryPurchases > 2) reasons.push('Catégorie préférée');

      // Category affinity from interactions
      const categoryLikes = likedCategories[product.category] || 0;
      score += categoryLikes * 5;

      // Favorite store boost
      if (favoriteStores.includes(product.store_id)) {
        score += 25;
        reasons.push('Magasin favori');
      }

      // Dietary preferences
      if (preferences.includes('Végétarien') && ['fruits_legumes', 'produits_laitiers'].includes(product.category)) {
        score += 15;
      }
      if (preferences.includes('Végan') && product.category === 'fruits_legumes') {
        score += 20;
      }

      // Allergen check
      if (allergens.some(a => product.allergens?.includes(a))) {
        score -= 100;
      }

      // Urgency boost
      const daysLeft = Math.ceil((new Date(product.expiration_date) - new Date()) / 86400000);
      if (daysLeft <= 1) { score += 30; reasons.push('Expire demain'); }
      else if (daysLeft <= 3) { score += 20; reasons.push('Derniers jours'); }

      // Discount boost
      const discount = Math.round((1 - product.discounted_price / product.original_price) * 100);
      score += discount / 2;
      if (discount >= 50) reasons.push(`-${discount}%`);

      // Popularity from interactions
      const productLikes = likedItems.filter(i => i.item_id === product.id).length;
      score += productLikes * 10;

      // Time decay for already viewed
      const wasViewed = viewedItems.some(v => v.item_id === product.id);
      if (wasViewed) score -= 10;

      return { ...product, score, reasons, type: 'product' };
    }).filter(p => p.score > 0);

    // Score recipes based on purchased ingredients
    const scoredRecipes = recipes.map(recipe => {
      let score = 40;
      let reasons = [];

      // Check ingredient match
      const recipeIngredients = recipe.ingredients?.map(i => i.name?.toLowerCase()) || [];
      const matchingIngredients = recipeIngredients.filter(ri => 
        purchasedIngredients.some(pi => pi.includes(ri) || ri.includes(pi))
      );
      
      if (matchingIngredients.length > 0) {
        score += matchingIngredients.length * 15;
        reasons.push(`${matchingIngredients.length} ingrédients en stock`);
      }

      // Check current promotions
      const promoIngredients = products.filter(p => {
        const discount = Math.round((1 - p.discounted_price / p.original_price) * 100);
        return discount >= 30 && recipeIngredients.some(ri => 
          p.name.toLowerCase().includes(ri) || ri.includes(p.name.toLowerCase())
        );
      });
      if (promoIngredients.length > 0) {
        score += promoIngredients.length * 10;
        reasons.push('Ingrédients en promo');
      }

      // Dietary match
      if (preferences.includes('Végétarien') && recipe.tags?.includes('végétarien')) {
        score += 20;
        reasons.push('Végétarien');
      }

      score += (recipe.likes_count || 0) * 2;

      return { ...recipe, score, reasons, type: 'recipe' };
    });

    // Score challenges based on user goals and activity
    const completedChallengeIds = userChallenges.filter(uc => uc.is_completed).map(uc => uc.challenge_id);
    const joinedChallengeIds = userChallenges.map(uc => uc.challenge_id);

    const scoredChallenges = [...challenges, ...partnerChallenges].map(challenge => {
      let score = 35;
      let reasons = [];

      // Skip completed
      if (completedChallengeIds.includes(challenge.id)) {
        score -= 50;
      }

      // Boost not-joined
      if (!joinedChallengeIds.includes(challenge.id)) {
        score += 15;
        reasons.push('Nouveau défi');
      }

      // Goal alignment
      const userGoals = user?.goals || {};
      if (userGoals.save_money && challenge.goal_type === 'savings') {
        score += 25;
        reasons.push('Aligné avec vos objectifs');
      }
      if (userGoals.reduce_waste && challenge.goal_type === 'waste_avoided') {
        score += 25;
        reasons.push('Anti-gaspi');
      }

      // Favorite store challenges
      if (challenge.store_id && favoriteStores.includes(challenge.store_id)) {
        score += 20;
        reasons.push('Magasin favori');
      }

      // Ending soon boost
      const daysLeft = Math.ceil((new Date(challenge.end_date) - new Date()) / 86400000);
      if (daysLeft <= 3 && daysLeft > 0) {
        score += 15;
        reasons.push('Bientôt terminé');
      }

      score += (challenge.participants_count || 0) / 10;

      return { ...challenge, score, reasons, type: 'challenge' };
    });

    // Combine and sort
    const allItems = [
      ...scoredProducts.slice(0, 15),
      ...scoredRecipes.slice(0, 6),
      ...scoredChallenges.slice(0, 4),
    ].sort((a, b) => b.score - a.score);

    // Interleave for variety
    const finalFeed = [];
    let pIdx = 0, rIdx = 0, cIdx = 0;
    const sortedProducts = scoredProducts.sort((a, b) => b.score - a.score);
    const sortedRecipes = scoredRecipes.sort((a, b) => b.score - a.score);
    const sortedChallenges = scoredChallenges.sort((a, b) => b.score - a.score);
    
    for (let i = 0; i < 24; i++) {
      const mod = i % 6;
      if (mod < 4 && pIdx < sortedProducts.length) {
        finalFeed.push(sortedProducts[pIdx++]);
      } else if (mod === 4 && rIdx < sortedRecipes.length) {
        finalFeed.push(sortedRecipes[rIdx++]);
      } else if (mod === 5 && cIdx < sortedChallenges.length) {
        finalFeed.push(sortedChallenges[cIdx++]);
      }
    }

    // Generate AI reason
    const topCategories = Object.entries(purchasedCategories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .map(([cat]) => cat);
    
    if (topCategories.length > 0) {
      setAiReason(`Basé sur vos achats en ${topCategories.join(' et ')}`);
    } else {
      setAiReason('Recommandations personnalisées');
    }

    setFeedItems(finalFeed);
    setLoading(false);
  };

  const trackInteraction = async (item, type) => {
    if (!user) return;
    await base44.entities.UserInteraction.create({
      user_email: user.email,
      item_type: item.type,
      item_id: item.id,
      interaction_type: type,
      category: item.category,
    });
  };

  const filteredItems = activeFilter === 'all' 
    ? feedItems 
    : feedItems.filter(item => item.type === activeFilter);

  if (loading) {
    return (
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
          <span className="text-purple-700">IA en cours de personnalisation...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h3 className="font-semibold">Pour vous</h3>
            <Badge className="bg-purple-100 text-purple-700 text-xs">IA</Badge>
          </div>
          <p className="text-xs text-gray-500 mt-1">{aiReason}</p>
        </div>
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
          <TabsTrigger value="challenge">
            <Flame className="w-4 h-4 mr-1" />
            Défis
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
              exit={{ opacity: 0 }}
              transition={{ delay: idx * 0.03 }}
            >
              {item.type === 'product' && (
                <div className="relative">
                  {item.reasons?.length > 0 && (
                    <div className="absolute top-2 left-2 z-10 flex gap-1 flex-wrap max-w-[80%]">
                      {item.reasons.slice(0, 2).map((reason, i) => (
                        <Badge key={i} className="bg-purple-500 text-white text-[10px]">
                          {reason}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <ProductCard 
                    product={item} 
                    onAddToCart={(p) => {
                      trackInteraction(item, 'purchase');
                      onAddToCart(p);
                    }}
                    onView={() => trackInteraction(item, 'view')}
                  />
                </div>
              )}
              
              {item.type === 'recipe' && (
                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <ChefHat className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-orange-100 text-orange-700 text-xs">Recette</Badge>
                        {item.reasons?.map((r, i) => (
                          <Badge key={i} className="bg-emerald-100 text-emerald-700 text-xs">{r}</Badge>
                        ))}
                      </div>
                      <h4 className="font-semibold">{item.title}</h4>
                      <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span><Clock className="w-3 h-3 inline mr-1" />{item.prep_time} min</span>
                        <span><Heart className="w-3 h-3 inline mr-1" />{item.likes_count || 0}</span>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => trackInteraction(item, 'save')}
                    >
                      <Bookmark className="w-4 h-4" />
                    </Button>
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
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-red-100 text-red-700 text-xs">Défi</Badge>
                        {item.reasons?.map((r, i) => (
                          <Badge key={i} className="bg-amber-100 text-amber-700 text-xs">{r}</Badge>
                        ))}
                      </div>
                      <h4 className="font-semibold">{item.title}</h4>
                      <p className="text-sm text-gray-600">{item.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className="bg-amber-100 text-amber-700">+{item.reward_points || item.reward_value} pts</Badge>
                        <span className="text-xs text-gray-500">
                          <Users className="w-3 h-3 inline mr-1" />
                          {item.participants_count || 0}
                        </span>
                      </div>
                    </div>
                    <Button size="sm" className="bg-red-500 hover:bg-red-600">
                      <Target className="w-4 h-4 mr-1" />
                      Rejoindre
                    </Button>
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