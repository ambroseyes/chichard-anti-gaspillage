import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ChefHat, Sparkles, Clock, Users, Loader2 } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AIRecipeRecommendations({ user }) {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  const { data: cartItems = [] } = useQuery({
    queryKey: ['cart', user?.email],
    queryFn: () => base44.entities.CartItem.filter({ user_email: user?.email }),
    enabled: !!user,
  });

  const { data: existingRecipes = [] } = useQuery({
    queryKey: ['recipes'],
    queryFn: () => base44.entities.Recipe.list('-created_date', 20),
  });

  useEffect(() => {
    const generateRecipes = async () => {
      setLoading(true);
      
      const availableIngredients = cartItems.map(c => c.product_name).join(', ');
      const preferences = user?.dietary_preferences || [];

      const prompt = `Tu es un chef cuisinier expert en cuisine africaine et anti-gaspillage.

INGRÉDIENTS DISPONIBLES: ${availableIngredients || 'Aucun panier en cours'}
PRÉFÉRENCES: ${preferences.join(', ') || 'Aucune'}

Génère 3 recettes simples et savoureuses adaptées au contexte camerounais. Format JSON:
{
  "recipes": [
    {
      "title": "Nom de la recette",
      "description": "Description courte",
      "prep_time": 15,
      "difficulty": "facile|moyen|difficile",
      "servings": 4,
      "match_score": 85
    }
  ]
}`;

      try {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: "object",
            properties: {
              recipes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    prep_time: { type: "number" },
                    difficulty: { type: "string" },
                    servings: { type: "number" },
                    match_score: { type: "number" }
                  }
                }
              }
            }
          }
        });

        setRecipes(result.recipes || []);
      } catch (e) {
        setRecipes([]);
      }
      
      setLoading(false);
    };

    generateRecipes();
  }, [cartItems, user]);

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