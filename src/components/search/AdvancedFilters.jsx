import React, { useState } from 'react';
import {
  Filter, Clock, Calendar, Heart, X, Check, SlidersHorizontal
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const dietaryOptions = [
  'Végétarien', 'Végan', 'Sans gluten', 'Halal', 'Sans lactose'
];

const defaultFilters = {
  expirationDays: 30,
  maxPrepTime: 120,
  dietary: [],
  difficulty: 'all',
  urgentOnly: false,
  discountMin: 0,
};

export default function AdvancedFilters({ type = 'products', filters, onFiltersChange, activeCount = 0 }) {
  const [localFilters, setLocalFilters] = useState(filters || defaultFilters);
  const [isOpen, setIsOpen] = useState(false);

  const applyFilters = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  const resetFilters = () => {
    setLocalFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const toggleDietary = (option) => {
    const current = localFilters.dietary || [];
    const updated = current.includes(option)
      ? current.filter(d => d !== option)
      : [...current, option];
    setLocalFilters({ ...localFilters, dietary: updated });
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          Filtres
          {activeCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white text-xs rounded-full flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtres avancés
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Expiration Filter - Products */}
          {type === 'products' && (
            <>
              <div>
                <Label className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4" />
                  Date d'expiration
                </Label>
                <div className="space-y-2">
                  <Slider
                    value={[localFilters.expirationDays]}
                    onValueChange={([v]) => setLocalFilters({ ...localFilters, expirationDays: v })}
                    max={30}
                    min={1}
                    step={1}
                  />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>1 jour</span>
                    <span className="font-medium text-emerald-600">{localFilters.expirationDays} jours</span>
                    <span>30 jours</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Produits urgents uniquement</Label>
                  <p className="text-xs text-gray-500">Expire dans moins de 3 jours</p>
                </div>
                <Switch
                  checked={localFilters.urgentOnly}
                  onCheckedChange={(v) => setLocalFilters({ ...localFilters, urgentOnly: v })}
                />
              </div>

              <div>
                <Label className="mb-3 block">Réduction minimum</Label>
                <div className="space-y-2">
                  <Slider
                    value={[localFilters.discountMin]}
                    onValueChange={([v]) => setLocalFilters({ ...localFilters, discountMin: v })}
                    max={70}
                    min={0}
                    step={5}
                  />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>0%</span>
                    <span className="font-medium text-emerald-600">-{localFilters.discountMin}%</span>
                    <span>70%</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Recipe Filters */}
          {type === 'recipes' && (
            <>
              <div>
                <Label className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4" />
                  Temps de préparation max
                </Label>
                <div className="space-y-2">
                  <Slider
                    value={[localFilters.maxPrepTime]}
                    onValueChange={([v]) => setLocalFilters({ ...localFilters, maxPrepTime: v })}
                    max={120}
                    min={5}
                    step={5}
                  />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>5 min</span>
                    <span className="font-medium text-emerald-600">{localFilters.maxPrepTime} min</span>
                    <span>120 min</span>
                  </div>
                </div>
              </div>

              <div>
                <Label className="mb-3 block">Difficulté</Label>
                <div className="flex gap-2">
                  {['all', 'facile', 'moyen', 'difficile'].map((d) => (
                    <button
                      key={d}
                      onClick={() => setLocalFilters({ ...localFilters, difficulty: d })}
                      className={`px-3 py-1.5 rounded-full text-sm ${
                        localFilters.difficulty === d
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {d === 'all' ? 'Tous' : d.charAt(0).toUpperCase() + d.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Dietary Preferences */}
          <div>
            <Label className="flex items-center gap-2 mb-3">
              <Heart className="w-4 h-4" />
              Régime alimentaire
            </Label>
            <div className="flex flex-wrap gap-2">
              {dietaryOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => toggleDietary(option)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    localFilters.dietary?.includes(option)
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {localFilters.dietary?.includes(option) && <Check className="w-3 h-3 inline mr-1" />}
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={resetFilters} className="flex-1">
              <X className="w-4 h-4 mr-1" />
              Réinitialiser
            </Button>
            <Button onClick={applyFilters} className="flex-1 bg-emerald-500 hover:bg-emerald-600">
              <Check className="w-4 h-4 mr-1" />
              Appliquer
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}