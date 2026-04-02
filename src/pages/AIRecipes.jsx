import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, Sparkles, Clock, Users, Leaf, ShoppingCart, Plus, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';

export default function AIRecipes() {
  const [user, setUser] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedRecipe, setExpandedRecipe] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => base44.auth.redirectToLogin());
  }, []);

  // Fetch recent orders to extract products
  const { data: recentOrders = [] } = useQuery({
    queryKey: ['recent-orders-recipes', user?.email],
    queryFn: () => base44.entities.Order.filter({ customer_email: user.email }, '-created_date', 20),
    enabled: !!user?.email,
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites-recipes', user?.email],
    queryFn: () => base44.entities.Favorite.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const { data: allProducts = [] } = useQuery({
    queryKey: ['products-for-recipes'],
    queryFn: () => base44.entities.Product.list('-expiration_date', 100),
    enabled: !!user,
  });

  // Build product context: items from orders + favorites near DLC
  const buildContext = () => {
    const favProductIds = new Set(favorites.map(f => f.product_id));
    const urgentProducts = allProducts.filter(p => {
      if (!p.expiration_date) return false;
      const days = Math.ceil((new Date(p.expiration_date) - new Date()) / 86400000);
      return days >= 0 && days <= 5;
    });

    // Extract product names from recent order items
    const orderProductNames = [];
    recentOrders.forEach(order => {
      (order.items || []).forEach(item => {
        if (item.product_name) orderProductNames.push(item.product_name);
      });
    });

    const urgentNames = urgentProducts.map(p => `${p.name} (expire dans ${Math.ceil((new Date(p.expiration_date) - new Date()) / 86400000)} jours)`);
    
    return {
      urgent: urgentNames,
      recent: [...new Set(orderProductNames)].slice(0, 15),
      dietary: user?.dietary_preferences || [],
      allergens: user?.allergens_to_avoid || [],
    };
  };

  const generateRecipes = async () => {
    setIsGenerating(true);
    setRecipes([]);
    const ctx = buildContext();

    const prompt = `Tu es un chef cuisinier spécialisé anti-gaspi. Génère 5 recettes créatives basées sur les produits disponibles, en priorisant les produits qui expirent bientôt.

Produits prioritaires (proches DLC) : ${ctx.urgent.join(', ') || 'aucun'}
Achats récents disponibles : ${ctx.recent.join(', ') || 'non précisé'}
Régimes alimentaires : ${ctx.dietary.join(', ') || 'aucun'}
Allergènes à EXCLURE absolument : ${ctx.allergens.join(', ') || 'aucun'}

Pour chaque recette, fournis :
- title : nom de la recette
- time_minutes : temps de préparation
- difficulty : facile/moyen/difficile
- servings : nombre de portions
- anti_waste_score : 1-10 (priorité DLC)
- why_anti_waste : courte explication (ex: "utilise 2 produits qui expirent dans 2 jours")
- ingredients_available : liste des ingrédients utilisés depuis les produits disponibles
- ingredients_missing : liste des ingrédients manquants avec quantités approximatives
- steps : tableau de 4-6 étapes courtes`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          recipes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                time_minutes: { type: 'number' },
                difficulty: { type: 'string' },
                servings: { type: 'number' },
                anti_waste_score: { type: 'number' },
                why_anti_waste: { type: 'string' },
                ingredients_available: { type: 'array', items: { type: 'string' } },
                ingredients_missing: { type: 'array', items: { type: 'string' } },
                steps: { type: 'array', items: { type: 'string' } },
              }
            }
          }
        }
      }
    });

    setRecipes(result.recipes || []);
    setIsGenerating(false);
  };

  const addToShoppingList = async (recipe) => {
    if (!recipe.ingredients_missing?.length) return;
    const existing = await base44.entities.ShoppingList.filter({ user_email: user.email, status: 'active' });
    let list = existing[0];
    if (!list) {
      list = await base44.entities.ShoppingList.create({ user_email: user.email, name: 'Ma liste de courses', status: 'active', items: [] });
    }
    const existingItems = list.items || [];
    const existingNames = new Set(existingItems.map(i => i.product_name?.toLowerCase()));
    const newItems = recipe.ingredients_missing
      .filter(ing => !existingNames.has(ing.toLowerCase()))
      .map(ing => ({ product_name: ing, quantity: 1, is_checked: false, category: 'recipe_missing', source: 'RECIPE_MISSING' }));
    
    if (!newItems.length) {
      toast.info('Tous les ingrédients sont déjà dans votre liste');
      return;
    }
    await base44.entities.ShoppingList.update(list.id, { items: [...existingItems, ...newItems] });
    queryClient.invalidateQueries({ queryKey: ['shopping-list'] });
    toast.success(`${newItems.length} ingrédient(s) ajouté(s) à votre liste de courses`);
  };

  const ctx = user ? buildContext() : null;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Recettes IA Anti-Gaspi</h1>
              <p className="text-emerald-100 text-sm">Recettes personnalisées depuis vos achats</p>
            </div>
          </div>

          {ctx && (
            <div className="flex flex-wrap gap-2">
              {ctx.urgent.length > 0 && (
                <span className="bg-amber-400/30 text-amber-100 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {ctx.urgent.length} produit(s) à utiliser en priorité
                </span>
              )}
              {ctx.dietary.map(d => (
                <span key={d} className="bg-white/20 text-white text-xs px-3 py-1 rounded-full">{d}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Generate Button */}
        <Card className="p-5 text-center">
          <Sparkles className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-4 text-sm">
            L'IA analyse vos achats récents et vos produits favoris proches de la DLC pour vous proposer des recettes anti-gaspi adaptées à vos préférences.
          </p>
          <Button
            onClick={generateRecipes}
            disabled={isGenerating || !user}
            className="bg-emerald-500 hover:bg-emerald-600 w-full"
            size="lg"
          >
            {isGenerating ? (
              <><Loader2 className="w-5 h-5 animate-spin mr-2" />Génération en cours...</>
            ) : recipes.length > 0 ? (
              <><RefreshCw className="w-5 h-5 mr-2" />Régénérer les recettes</>
            ) : (
              <><Sparkles className="w-5 h-5 mr-2" />Générer mes recettes</>
            )}
          </Button>
        </Card>

        {/* Recipes */}
        <AnimatePresence>
          {recipes
            .sort((a, b) => (b.anti_waste_score || 0) - (a.anti_waste_score || 0))
            .map((recipe, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="overflow-hidden">
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedRecipe(expandedRecipe === i ? null : i)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{recipe.title}</h3>
                        {recipe.anti_waste_score >= 7 && (
                          <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                            <Leaf className="w-3 h-3 mr-1" />Anti-gaspi ★
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-md inline-block mb-2">
                        💡 {recipe.why_anti_waste}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{recipe.time_minutes} min</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{recipe.servings} pers.</span>
                        <span>{recipe.difficulty}</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-emerald-700">{recipe.anti_waste_score}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">score</p>
                    </div>
                  </div>
                </div>

                {expandedRecipe === i && (
                  <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-4">
                    {/* Ingredients available */}
                    {recipe.ingredients_available?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">✅ Ingrédients disponibles</p>
                        <div className="flex flex-wrap gap-1">
                          {recipe.ingredients_available.map((ing, j) => (
                            <span key={j} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full">{ing}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Missing ingredients */}
                    {recipe.ingredients_missing?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">🛒 Ingrédients manquants</p>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {recipe.ingredients_missing.map((ing, j) => (
                            <span key={j} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{ing}</span>
                          ))}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addToShoppingList(recipe)}
                          className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                        >
                          <ShoppingCart className="w-3 h-3 mr-1" />
                          Ajouter à ma liste de courses
                        </Button>
                      </div>
                    )}

                    {/* Steps */}
                    {recipe.steps?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">📝 Préparation</p>
                        <ol className="space-y-2">
                          {recipe.steps.map((step, j) => (
                            <li key={j} className="flex gap-3 text-sm text-gray-600">
                              <span className="w-5 h-5 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{j + 1}</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {!isGenerating && recipes.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <ChefHat className="w-16 h-16 mx-auto mb-3 opacity-20" />
            <p>Cliquez sur "Générer" pour obtenir vos recettes personnalisées</p>
          </div>
        )}
      </div>
    </div>
  );
}