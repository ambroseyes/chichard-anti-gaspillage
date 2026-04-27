import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Sparkles, ArrowRight, Leaf } from 'lucide-react';

const CATEGORIES = [
  { id: 'fruits_legumes', label: 'Fruits & Légumes', emoji: '🥦', color: 'bg-green-50 border-green-200 text-green-800', active: 'bg-green-500 text-white border-green-500' },
  { id: 'boulangerie', label: 'Boulangerie', emoji: '🥖', color: 'bg-amber-50 border-amber-200 text-amber-800', active: 'bg-amber-500 text-white border-amber-500' },
  { id: 'produits_laitiers', label: 'Produits laitiers', emoji: '🧀', color: 'bg-yellow-50 border-yellow-200 text-yellow-800', active: 'bg-yellow-500 text-white border-yellow-500' },
  { id: 'viande_poisson', label: 'Viande & Poisson', emoji: '🐟', color: 'bg-red-50 border-red-200 text-red-800', active: 'bg-red-500 text-white border-red-500' },
  { id: 'epicerie', label: 'Épicerie', emoji: '🛒', color: 'bg-orange-50 border-orange-200 text-orange-800', active: 'bg-orange-500 text-white border-orange-500' },
  { id: 'snacks', label: 'Snacks & Grignotage', emoji: '🍿', color: 'bg-pink-50 border-pink-200 text-pink-800', active: 'bg-pink-500 text-white border-pink-500' },
  { id: 'boissons', label: 'Boissons', emoji: '🧃', color: 'bg-blue-50 border-blue-200 text-blue-800', active: 'bg-blue-500 text-white border-blue-500' },
  { id: 'surgeles', label: 'Surgelés', emoji: '🧊', color: 'bg-cyan-50 border-cyan-200 text-cyan-800', active: 'bg-cyan-500 text-white border-cyan-500' },
  { id: 'plats_prepares', label: 'Plats préparés', emoji: '🍱', color: 'bg-purple-50 border-purple-200 text-purple-800', active: 'bg-purple-500 text-white border-purple-500' },
  { id: 'bio_naturel', label: 'Bio & Naturel', emoji: '🌿', color: 'bg-emerald-50 border-emerald-200 text-emerald-800', active: 'bg-emerald-500 text-white border-emerald-500' },
  { id: 'patisserie', label: 'Pâtisserie', emoji: '🍰', color: 'bg-rose-50 border-rose-200 text-rose-800', active: 'bg-rose-500 text-white border-rose-500' },
  { id: 'condiments', label: 'Condiments & Sauces', emoji: '🫙', color: 'bg-lime-50 border-lime-200 text-lime-800', active: 'bg-lime-500 text-white border-lime-500' },
];

const DIETARY = [
  { id: 'vegetarien', label: 'Végétarien', emoji: '🥗' },
  { id: 'vegan', label: 'Végan', emoji: '🌱' },
  { id: 'halal', label: 'Halal', emoji: '☪️' },
  { id: 'sans_gluten', label: 'Sans gluten', emoji: '🌾' },
  { id: 'sans_lactose', label: 'Sans lactose', emoji: '🥛' },
];

export default function ProductPreferences() {
  const [user, setUser] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedDietary, setSelectedDietary] = useState([]);
  const [saved, setSaved] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
    }).catch(() => {});
  }, []);

  const { data: prefs } = useQuery({
    queryKey: ['user-prefs', user?.email],
    queryFn: () => base44.entities.UserPreference.filter({ user_email: user.email }),
    enabled: !!user?.email,
    onSuccess: (data) => {
      if (data?.[0]) {
        setSelectedCategories(data[0].favorite_categories || []);
        setSelectedDietary(data[0].dietary_preferences || []);
      }
    }
  });

  // Initialize from loaded data
  useEffect(() => {
    if (prefs?.[0] && selectedCategories.length === 0) {
      setSelectedCategories(prefs[0].favorite_categories || []);
      setSelectedDietary(prefs[0].dietary_preferences || []);
    }
  }, [prefs]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const existing = prefs?.[0];
      const payload = {
        user_email: user.email,
        favorite_categories: selectedCategories,
        dietary_preferences: selectedDietary,
      };
      if (existing?.id) {
        return base44.entities.UserPreference.update(existing.id, payload);
      } else {
        return base44.entities.UserPreference.create(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-prefs'] });
      setSaved(true);
      toast.success('Préférences sauvegardées !');
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const toggle = (id, list, setList) => {
    setList(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 text-center max-w-sm">
          <Sparkles className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Connectez-vous</h2>
          <p className="text-gray-500 mb-4">Pour personnaliser vos suggestions</p>
          <Button onClick={() => base44.auth.redirectToLogin(window.location.pathname)}
            className="bg-emerald-500 hover:bg-emerald-600">
            Se connecter
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Hero */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white px-4 py-10">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 mb-4 text-sm font-medium"
          >
            <Sparkles className="w-4 h-4" /> Suggestions personnalisées
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-3xl font-bold mb-2"
          >
            Vos préférences alimentaires
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-white/80 text-sm max-w-md mx-auto"
          >
            Sélectionnez vos catégories favorites pour recevoir des offres anti-gaspi adaptées à vos goûts.
          </motion.p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">

        {/* Categories */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Catégories préférées</h2>
            <span className="text-sm text-gray-400">{selectedCategories.length} sélectionnée(s)</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {CATEGORIES.map((cat, i) => {
              const isSelected = selectedCategories.includes(cat.id);
              return (
                <motion.button
                  key={cat.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => toggle(cat.id, selectedCategories, setSelectedCategories)}
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left font-medium text-sm ${
                    isSelected ? cat.active : cat.color + ' hover:opacity-80'
                  }`}
                >
                  <span className="text-xl">{cat.emoji}</span>
                  <span className="leading-tight">{cat.label}</span>
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute top-1.5 right-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4 opacity-80" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* Dietary */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Leaf className="w-5 h-5 text-emerald-500" />
            <h2 className="text-lg font-bold text-gray-900">Préférences alimentaires</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {DIETARY.map((d) => {
              const isSelected = selectedDietary.includes(d.id);
              return (
                <motion.button
                  key={d.id}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => toggle(d.id, selectedDietary, setSelectedDietary)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full border-2 font-medium text-sm transition-all ${
                    isSelected
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-md'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300'
                  }`}
                >
                  <span>{d.emoji}</span>
                  {d.label}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* Summary */}
        {selectedCategories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-4 bg-emerald-50 border-emerald-200">
              <p className="text-sm text-emerald-800 font-medium mb-2">
                ✅ Vous recevrez des suggestions pour :
              </p>
              <div className="flex flex-wrap gap-1.5">
                {selectedCategories.map(id => {
                  const cat = CATEGORIES.find(c => c.id === id);
                  return cat ? (
                    <Badge key={id} className="bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {cat.emoji} {cat.label}
                    </Badge>
                  ) : null;
                })}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Save button */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            className="w-full h-12 text-base font-semibold bg-emerald-500 hover:bg-emerald-600 rounded-xl"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            <AnimatePresence mode="wait">
              {saved ? (
                <motion.span key="saved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> Préférences sauvegardées !
                </motion.span>
              ) : (
                <motion.span key="save" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                  {saveMutation.isPending ? 'Enregistrement...' : <>Enregistrer mes préférences <ArrowRight className="w-4 h-4" /></>}
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}