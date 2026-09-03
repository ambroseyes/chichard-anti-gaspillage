import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from '@/api';
import { toast } from 'sonner';
import { Loader2, ChefHat, Lightbulb } from 'lucide-react';

export default function ContentSubmissionModal({ open, onClose, user, onSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('recipe');

  // Forms state
  const [recipeData, setRecipeData] = useState({
    title: '',
    description: '',
    ingredients: '',
    steps: '',
    prep_time: '',
    category: 'dejeuner',
    difficulty: 'moyen'
  });

  const [tipData, setTipData] = useState({
    title: '',
    content: '',
    category: 'autre'
  });

  const handleSubmitRecipe = async (e) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);

    try {
      const ingredientsList = recipeData.ingredients.split('\n').map(line => ({
        name: line,
        quantity: '1', 
        product_id: null
      }));

      const stepsList = recipeData.steps.split('\n').filter(s => s.trim());

      await api.entities.Recipe.create({
        title: recipeData.title,
        description: recipeData.description,
        ingredients: ingredientsList,
        steps: stepsList,
        prep_time: parseInt(recipeData.prep_time) || 0,
        category: recipeData.category,
        difficulty: recipeData.difficulty,
        author_email: user.email,
        author_name: user.full_name,
        status: 'pending' // Waiting for review
      });

      toast.success('Recette soumise pour revue !');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'envoi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitTip = async (e) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);

    try {
      await api.entities.ZeroWasteTip.create({
        title: tipData.title,
        content: tipData.content,
        category: tipData.category,
        author_email: user.email,
        author_name: user.full_name,
        status: 'pending'
      });

      toast.success('Astuce soumise pour revue !');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'envoi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Partager avec la communauté</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-6">
            <TabsTrigger value="recipe">
              <ChefHat className="w-4 h-4 mr-2" />
              Proposer une recette
            </TabsTrigger>
            <TabsTrigger value="tip">
              <Lightbulb className="w-4 h-4 mr-2" />
              Partager une astuce
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recipe">
            <form onSubmit={handleSubmitRecipe} className="space-y-4">
              <div className="space-y-2">
                <Label>Titre de la recette</Label>
                <Input 
                  required
                  placeholder="Ex: Soupe de légumes oubliés"
                  value={recipeData.title}
                  onChange={e => setRecipeData({...recipeData, title: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Catégorie</Label>
                  <Select 
                    value={recipeData.category} 
                    onValueChange={v => setRecipeData({...recipeData, category: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="petit_dejeuner">Petit Déjeuner</SelectItem>
                      <SelectItem value="dejeuner">Déjeuner</SelectItem>
                      <SelectItem value="diner">Dîner</SelectItem>
                      <SelectItem value="dessert">Dessert</SelectItem>
                      <SelectItem value="snack">Snack</SelectItem>
                      <SelectItem value="boisson">Boisson</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Difficulté</Label>
                  <Select 
                    value={recipeData.difficulty} 
                    onValueChange={v => setRecipeData({...recipeData, difficulty: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="facile">Facile</SelectItem>
                      <SelectItem value="moyen">Moyen</SelectItem>
                      <SelectItem value="difficile">Difficile</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Temps de préparation (min)</Label>
                <Input 
                  type="number"
                  value={recipeData.prep_time}
                  onChange={e => setRecipeData({...recipeData, prep_time: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Ingrédients (un par ligne)</Label>
                <Textarea 
                  required
                  className="h-24"
                  placeholder="2 carottes&#10;1 oignon&#10;500g de pommes de terre"
                  value={recipeData.ingredients}
                  onChange={e => setRecipeData({...recipeData, ingredients: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Étapes de préparation (une par ligne)</Label>
                <Textarea 
                  required
                  className="h-32"
                  placeholder="1. Éplucher les légumes&#10;2. Faire revenir les oignons&#10;3. Ajouter l'eau et laisser mijoter"
                  value={recipeData.steps}
                  onChange={e => setRecipeData({...recipeData, steps: e.target.value})}
                />
              </div>

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Soumettre pour validation
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="tip">
            <form onSubmit={handleSubmitTip} className="space-y-4">
              <div className="space-y-2">
                <Label>Titre de l'astuce</Label>
                <Input 
                  required
                  placeholder="Ex: Garder les herbes fraîches plus longtemps"
                  value={tipData.title}
                  onChange={e => setTipData({...tipData, title: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select 
                  value={tipData.category} 
                  onValueChange={v => setTipData({...tipData, category: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conservation">Conservation</SelectItem>
                    <SelectItem value="cuisine">Cuisine</SelectItem>
                    <SelectItem value="achat">Achat</SelectItem>
                    <SelectItem value="compost">Compost</SelectItem>
                    <SelectItem value="reutilisation">Réutilisation</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Votre astuce</Label>
                <Textarea 
                  required
                  className="h-40"
                  placeholder="Partagez votre technique..."
                  value={tipData.content}
                  onChange={e => setTipData({...tipData, content: e.target.value})}
                />
              </div>

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Soumettre pour validation
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}