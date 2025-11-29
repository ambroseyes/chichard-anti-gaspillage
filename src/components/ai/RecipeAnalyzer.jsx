import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Sparkles, ArrowRight, AlertCircle, CheckCircle2, Search } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function RecipeAnalyzer() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [alternatives, setAlternatives] = useState(null);
  const [ingredientSearch, setIngredientSearch] = useState('');

  const analyzeRecipe = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `
          Analyse cette recette et suggère des améliorations pour la rendre plus saine et plus économique, tout en gardant l'esprit du plat.
          Recette: "${input}"
          
          Format JSON attendu:
          {
            "health_score": 8,
            "cost_score": 6,
            "health_improvements": ["..."],
            "cost_improvements": ["..."],
            "suggestions": [
              { "original": "...", "replacement": "...", "reason": "..." }
            ]
          }
        `,
        response_json_schema: {
          type: "object",
          properties: {
            health_score: { type: "number" },
            cost_score: { type: "number" },
            health_improvements: { type: "array", items: { type: "string" } },
            cost_improvements: { type: "array", items: { type: "string" } },
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  original: { type: "string" },
                  replacement: { type: "string" },
                  reason: { type: "string" }
                }
              }
            }
          }
        }
      });
      setAnalysis(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const findAlternatives = async () => {
    if (!ingredientSearch.trim()) return;
    setLoading(true);
    try {
        const result = await base44.integrations.Core.InvokeLLM({
            prompt: `
              Suggère des alternatives pour l'ingrédient "${ingredientSearch}" qui sont:
              1. Plus économiques
              2. Plus saines
              3. Disponibles localement (contexte Afrique/Cameroun si pertinent)
              
              Format JSON:
              {
                "alternatives": [
                  { "name": "...", "category": "economique|sante|local", "description": "..." }
                ]
              }
            `,
            response_json_schema: {
              type: "object",
              properties: {
                alternatives: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      category: { type: "string" },
                      description: { type: "string" }
                    }
                  }
                }
              }
            }
          });
          setAlternatives(result.alternatives);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="analyze">
        <TabsList className="w-full">
          <TabsTrigger value="analyze" className="flex-1">Analyser une recette</TabsTrigger>
          <TabsTrigger value="alternatives" className="flex-1">Alternatives d'ingrédients</TabsTrigger>
        </TabsList>

        <TabsContent value="analyze" className="space-y-4">
          <Card className="p-4">
            <Textarea 
              placeholder="Collez votre recette ici (ingrédients et étapes)..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-[150px] mb-4"
            />
            <Button 
              onClick={analyzeRecipe} 
              disabled={loading || !input}
              className="w-full bg-indigo-500 hover:bg-indigo-600"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Analyser et Améliorer
            </Button>
          </Card>

          {analysis && (
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-4 bg-green-50 border-green-100">
                <h3 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Santé ({analysis.health_score}/10)
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-green-700">
                  {analysis.health_improvements.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </Card>

              <Card className="p-4 bg-blue-50 border-blue-100">
                <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Économies ({analysis.cost_score}/10)
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
                  {analysis.cost_improvements.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </Card>

              <Card className="col-span-full p-4">
                <h3 className="font-bold mb-3">Suggestions de remplacements</h3>
                <div className="space-y-2">
                  {analysis.suggestions.map((sug, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-red-500 line-through">{sug.original}</span>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        <span className="text-green-600 font-bold">{sug.replacement}</span>
                      </div>
                      <span className="text-gray-500 text-xs italic">{sug.reason}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="alternatives" className="space-y-4">
            <Card className="p-4">
                <div className="flex gap-2 mb-4">
                    <Input 
                        placeholder="Chercher un ingrédient (ex: Huile d'olive, Viande de boeuf...)" 
                        value={ingredientSearch}
                        onChange={(e) => setIngredientSearch(e.target.value)}
                    />
                    <Button onClick={findAlternatives} disabled={loading}>
                        <Search className="w-4 h-4" />
                    </Button>
                </div>
                
                {alternatives && (
                    <div className="space-y-3">
                        {alternatives.map((alt, i) => (
                            <div key={i} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-bold">{alt.name}</h4>
                                    <Badge variant={alt.category === 'economique' ? 'secondary' : 'outline'}>
                                        {alt.category}
                                    </Badge>
                                </div>
                                <p className="text-sm text-gray-600">{alt.description}</p>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Badge({ children, variant }) {
    const bg = variant === 'secondary' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800';
    return <span className={`text-xs px-2 py-1 rounded-full ${bg}`}>{children}</span>;
}