import React, { useState, useEffect } from 'react';
import { api } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ChefHat, Clock, Users, Sparkles, Refrigerator,
  BookOpen, Heart, Share2, Loader2,
  Calendar, Search
} from 'lucide-react';
import MealPlanner from '@/components/ai/MealPlanner';
import RecipeAnalyzer from '@/components/ai/RecipeAnalyzer';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';

export default function FoodCoach() {
  const [user, setUser] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState(null);
  const [activeTab, setActiveTab] = useState('suggestions');

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

  const { data: cartItems = [] } = useQuery({
    queryKey: ['cart', user?.email],
    queryFn: () => user ? api.entities.CartItem.filter({ user_email: user.email }) : [],
    enabled: !!user,
  });

  const { data: recipes = [] } = useQuery({
    queryKey: ['recipes'],
    queryFn: () => api.entities.Recipe.list('-created_date', 20),
  });

  // Find items expiring soon
  const expiringItems = cartItems.filter(item => {
    const daysLeft = Math.ceil((new Date(item.expiration_date) - new Date()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 3;
  });

  const generateRecipe = async () => {
    if (cartItems.length === 0) {
      toast.error('Ajoutez des produits à votre panier d\'abord');
      return;
    }

    setIsGenerating(true);

    const ingredients = cartItems.map(item => item.product_name).join(', ');

    const result = await api.ai.recipeFromIngredients(ingredients.split(/[,\n]/).map((s) => s.trim()).filter(Boolean));

    setGeneratedRecipe(result);
    setIsGenerating(false);
    setActiveTab('generated');
  };

  const difficultyColors = {
    facile: 'bg-green-100 text-green-700',
    moyen: 'bg-yellow-100 text-yellow-700',
    difficile: 'bg-red-100 text-red-700',
  };

  const categoryIcons = {
    petit_dejeuner: '🌅',
    dejeuner: '☀️',
    diner: '🌙',
    dessert: '🍰',
    snack: '🥪',
    boisson: '🥤',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <ChefHat className="w-8 h-8" />
              <h1 className="text-2xl font-bold">FoodCoach IA</h1>
            </div>
            <p className="text-orange-100">
              Des recettes anti-gaspillage générées par IA avec vos produits
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Expiring items alert */}
        {expiringItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-4 mb-6 text-white"
          >
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white/20 rounded-xl">
                <Refrigerator className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold">Alerte frigo !</h3>
                <p className="text-orange-100 text-sm">
                  {expiringItems.length} produit{expiringItems.length > 1 ? 's' : ''} expire{expiringItems.length > 1 ? 'nt' : ''} bientôt dans votre panier
                </p>
              </div>
              <Button
                onClick={generateRecipe}
                disabled={isGenerating}
                className="bg-white text-orange-600 hover:bg-orange-50"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Générer une recette
              </Button>
            </div>
          </motion.div>
        )}

        {/* Generate recipe CTA */}
        {expiringItems.length === 0 && cartItems.length > 0 && (
          <Card className="p-6 mb-6 bg-gradient-to-br from-orange-50 to-pink-50 border-orange-200">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="p-4 bg-white rounded-2xl shadow-sm">
                <ChefHat className="w-12 h-12 text-orange-500" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="font-bold text-gray-900 text-lg">Générez une recette avec vos produits</h3>
                <p className="text-gray-600 text-sm">
                  L'IA FoodCoach crée une recette personnalisée avec les {cartItems.length} produits de votre panier
                </p>
              </div>
              <Button
                onClick={generateRecipe}
                disabled={isGenerating}
                size="lg"
                className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Création...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Générer ma recette
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="suggestions">
              <BookOpen className="w-4 h-4 mr-2" />
              Suggestions
            </TabsTrigger>
            {generatedRecipe && (
              <TabsTrigger value="generated">
                <Sparkles className="w-4 h-4 mr-2" />
                Ma recette IA
              </TabsTrigger>
            )}
            <TabsTrigger value="planner">
              <Calendar className="w-4 h-4 mr-2" />
              Planning Repas
            </TabsTrigger>
            <TabsTrigger value="analyzer">
              <Search className="w-4 h-4 mr-2" />
              Analyse & Alternatives
            </TabsTrigger>
          </TabsList>

          {/* Suggestions Tab */}
          <TabsContent value="suggestions">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipes.map((recipe, idx) => (
                <motion.div
                  key={recipe.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-video bg-gradient-to-br from-orange-100 to-pink-100 relative">
                      {recipe.image_url ? (
                        <img 
                          src={recipe.image_url} 
                          alt={recipe.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-6xl">
                          {categoryIcons[recipe.category] || '🍽️'}
                        </div>
                      )}
                      {recipe.is_ai_generated && (
                        <Badge className="absolute top-3 left-3 bg-purple-500">
                          <Sparkles className="w-3 h-3 mr-1" />
                          IA
                        </Badge>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 mb-2">{recipe.title}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">{recipe.description}</p>
                      
                      <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {(recipe.prep_time || 0) + (recipe.cook_time || 0)} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {recipe.servings} pers.
                        </span>
                        <Badge variant="secondary" className={difficultyColors[recipe.difficulty] || ''}>
                          {recipe.difficulty}
                        </Badge>
                      </div>

                      {recipe.savings_potential > 0 && (
                        <div className="bg-emerald-50 text-emerald-700 rounded-lg px-3 py-2 text-sm font-medium">
                          💰 Économisez jusqu'à {recipe.savings_potential.toLocaleString()} FCFA
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}

              {recipes.length === 0 && (
                <div className="col-span-full text-center py-16">
                  <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Aucune recette disponible</h3>
                  <p className="text-gray-500">Générez votre première recette avec le FoodCoach IA !</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Generated Recipe Tab */}
          <TabsContent value="generated">
            {generatedRecipe && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Card className="max-w-3xl mx-auto overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-500 to-pink-500 p-6 text-white">
                    <Badge className="bg-white/20 mb-3">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Recette générée par IA
                    </Badge>
                    <h2 className="text-2xl font-bold mb-2">{generatedRecipe.title}</h2>
                    <p className="text-orange-100">{generatedRecipe.description}</p>
                    
                    <div className="flex items-center gap-4 mt-4">
                      <span className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-sm">
                        <Clock className="w-4 h-4" />
                        {generatedRecipe.prep_time + generatedRecipe.cook_time} min
                      </span>
                      <span className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-sm">
                        <Users className="w-4 h-4" />
                        {generatedRecipe.servings} personnes
                      </span>
                      <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                        {generatedRecipe.difficulty}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Ingredients */}
                    <div>
                      <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="text-xl">🥗</span> Ingrédients
                      </h3>
                      <div className="grid md:grid-cols-2 gap-2">
                        {generatedRecipe.ingredients?.map((ing, idx) => (
                          <div 
                            key={idx}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="w-2 h-2 bg-orange-500 rounded-full" />
                            <span className="font-medium">{ing.quantity}</span>
                            <span className="text-gray-600">{ing.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Steps */}
                    <div>
                      <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="text-xl">👨‍🍳</span> Préparation
                      </h3>
                      <div className="space-y-3">
                        {generatedRecipe.steps?.map((step, idx) => (
                          <div key={idx} className="flex gap-4">
                            <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                              {idx + 1}
                            </div>
                            <p className="text-gray-700 pt-1">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tips */}
                    {generatedRecipe.tips && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                        <h4 className="font-semibold text-yellow-800 mb-1">💡 Astuce du chef</h4>
                        <p className="text-yellow-700 text-sm">{generatedRecipe.tips}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                      <Button variant="outline" className="flex-1">
                        <Heart className="w-4 h-4 mr-2" />
                        Sauvegarder
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <Share2 className="w-4 h-4 mr-2" />
                        Partager
                      </Button>
                      <Button 
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                        onClick={generateRecipe}
                        disabled={isGenerating}
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Nouvelle recette
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </TabsContent>

          {/* Meal Planner Tab */}
          <TabsContent value="planner">
            <MealPlanner user={user} />
          </TabsContent>

          {/* Recipe Analyzer Tab */}
          <TabsContent value="analyzer">
            <RecipeAnalyzer />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}