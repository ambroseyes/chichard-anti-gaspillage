import { api } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ChefHat, Sparkles, Clock, Users, Loader2 } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EMPTY_ARRAY } from '@/lib/stable';
import { useAiEnabled } from '@/hooks/useAppConfig';

export default function AIRecipeRecommendations({ user }) {
  const aiEnabled = useAiEnabled();
  const { data: cartItems = EMPTY_ARRAY } = useQuery({
    queryKey: ['cart', user?.email],
    queryFn: () => api.entities.CartItem.filter({ user_email: user?.email }, '-created_date', 50),
    enabled: Boolean(user),
  });

  const { data: existingRecipes = EMPTY_ARRAY } = useQuery({
    queryKey: ['recipes'],
    queryFn: () => api.entities.Recipe.list('-created_date', 20),
  });

  const ingredients = cartItems.map((c) => c.product_name).filter(Boolean).slice(0, 12);

  /**
   * La suggestion est une donnée serveur comme une autre : une requête, pas un
   * effet qui écrit dans l'état. La clé porte les ingrédients, si bien que la
   * requête ne repart que lorsque le panier change réellement.
   *
   * L'ancienne version dépendait de `cartItems`, recréé à chaque rendu : elle
   * bouclait sans fin sur la page d'accueil.
   */
  const { data: suggestion, isLoading, isError } = useQuery({
    queryKey: ['ai-recipe', ingredients.join('|')],
    queryFn: () => api.ai.recipeFromIngredients(ingredients),
    enabled: aiEnabled && ingredients.length > 0,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

  // Sans assistance IA (ou sans panier), on montre les recettes de la communauté.
  const recipes = suggestion && !isError ? [suggestion] : EMPTY_ARRAY;
  const loading = ingredients.length > 0 && isLoading && !isError;

  const difficultyColors = {
    facile: 'bg-green-100 text-green-700',
    moyen: 'bg-yellow-100 text-yellow-700',
    difficile: 'bg-red-100 text-red-700'
  };

  if (loading) {
    return (
      <Card className="p-6 bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
          <span className="text-orange-700">Génération de recettes personnalisées...</span>
        </div>
      </Card>
    );
  }

  if (recipes.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
          <ChefHat className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Recettes suggérées</h3>
          <p className="text-xs text-gray-500">Basées sur vos ingrédients</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {recipes.map((recipe, idx) => (
          <Card key={idx} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-gray-900">{recipe.title}</h4>
              <Badge className="bg-purple-100 text-purple-700">
                <Sparkles className="w-3 h-3 mr-1" />
                {recipe.match_score}%
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mb-3">{recipe.description}</p>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {recipe.prep_time} min
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {recipe.servings} pers.
              </span>
              <Badge className={difficultyColors[recipe.difficulty] || difficultyColors.facile}>
                {recipe.difficulty}
              </Badge>
            </div>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}