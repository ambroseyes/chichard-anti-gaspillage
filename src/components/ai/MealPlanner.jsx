import React, { useState } from 'react';
import { api } from '@/api';
import { Calendar, ChefHat, Loader2, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function MealPlanner({ user }) {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [preferences, setPreferences] = useState({
    goal: 'healthy_eating',
    days: 3,
    servings: 4,
    budget: 15000,
  });

  const goals = {
    weight_loss: "Perte de poids",
    muscle_gain: "Prise de muscle",
    maintenance: "Maintien",
    healthy_eating: "Manger sain"
  };

  const generatePlan = async () => {
    setLoading(true);
    try {

      // Régime et allergènes sont lus dans le profil côté serveur.
      const response = await api.ai.mealPlan({
        days: Number(preferences.days),
        budget_xaf: Number(preferences.budget),
        servings: Number(preferences.servings),
      });
      setPlan(response);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {!plan ? (
        <Card className="p-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-500" />
                Configuration du plan
              </h3>
              <div className="space-y-4">
                <div>
                  <Label>Objectif</Label>
                  <Select 
                    value={preferences.goal} 
                    onValueChange={(v) => setPreferences({...preferences, goal: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(goals).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Durée</Label>
                  <Select 
                    value={preferences.duration} 
                    onValueChange={(v) => setPreferences({...preferences, duration: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1_day">1 Jour</SelectItem>
                      <SelectItem value="3_days">3 Jours</SelectItem>
                      <SelectItem value="7_days">7 Jours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Cible Calorique (kcal/jour)</Label>
                  <Select 
                    value={preferences.calories} 
                    onValueChange={(v) => setPreferences({...preferences, calories: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1500">1500 (Perte rapide)</SelectItem>
                      <SelectItem value="2000">2000 (Standard)</SelectItem>
                      <SelectItem value="2500">2500 (Actif)</SelectItem>
                      <SelectItem value="3000">3000 (Prise de masse)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="bg-emerald-50 p-6 rounded-xl flex flex-col justify-center items-center text-center">
              <ChefHat className="w-16 h-16 text-emerald-500 mb-4" />
              <h3 className="font-bold text-emerald-800 mb-2">Planification Intelligente</h3>
              <p className="text-emerald-600 text-sm mb-6">
                L'IA analyse vos besoins et crée un plan de repas équilibré avec des ingrédients locaux.
              </p>
              <Button 
                onClick={generatePlan} 
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-600"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Générer mon plan
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Votre Plan de Repas</h2>
            <Button variant="outline" onClick={() => setPlan(null)}>Nouveau plan</Button>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plan.days.map((day, idx) => (
              <Card key={idx} className="p-4 border-emerald-100">
                <h3 className="font-bold text-emerald-700 mb-3 border-b pb-2">{day.day}</h3>
                <div className="space-y-4">
                  {day.meals.map((meal, mIdx) => (
                    <div key={mIdx} className="text-sm">
                      <div className="flex justify-between text-gray-500 text-xs mb-1">
                        <span>{meal.type}</span>
                        <span>{meal.calories} kcal</span>
                      </div>
                      <p className="font-medium">{meal.name}</p>
                      <p className="text-xs text-gray-400 mt-1">{meal.ingredients}</p>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-6 bg-gray-50">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Liste de courses suggérée
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {plan.shopping_list.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  {item}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function ShoppingCart(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  )
}