import React, { useState } from 'react';
import { Shield, Heart, AlertTriangle, Loader2, Check
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';

const dietaryOptions = [
  'Végétarien', 'Végan', 'Sans gluten', 'Halal', 'Casher', 'Sans lactose'
];

const allergenOptions = [
  'Arachides', 'Lait', 'Œufs', 'Poisson', 'Crustacés', 'Soja', 'Gluten', 'Fruits à coque'
];

export default function UserPreferencesForm({ user, onSuccess }) {
  const { updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    dietary_preferences: user?.dietary_preferences || [],
    allergens: user?.allergens || [],
    allow_messages: user?.allow_messages !== false,
    is_public_profile: user?.is_public_profile !== false,
  });
  const [loading, setLoading] = useState(false);

  const toggleItem = (field, item) => {
    const current = formData[field] || [];
    const updated = current.includes(item)
      ? current.filter(i => i !== item)
      : [...current, item];
    setFormData({ ...formData, [field]: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await updateProfile(formData);
      toast.success('Préférences mises à jour');
      onSuccess?.();
    } catch (e) {
      toast.error('Erreur lors de la sauvegarde');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Dietary Preferences */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Heart className="w-5 h-5 text-pink-500" />
          <h3 className="font-semibold">Préférences alimentaires</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {dietaryOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => toggleItem('dietary_preferences', option)}
              className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                formData.dietary_preferences.includes(option)
                  ? 'bg-pink-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {formData.dietary_preferences.includes(option) && <Check className="w-3 h-3 inline mr-1" />}
              {option}
            </button>
          ))}
        </div>
      </Card>

      {/* Allergens */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          <h3 className="font-semibold">Allergènes à éviter</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {allergenOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => toggleItem('allergens', option)}
              className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                formData.allergens.includes(option)
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {formData.allergens.includes(option) && <Check className="w-3 h-3 inline mr-1" />}
              {option}
            </button>
          ))}
        </div>
      </Card>

      {/* Privacy Settings */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold">Confidentialité</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Profil public</p>
              <p className="text-sm text-gray-500">Visible dans le classement communautaire</p>
            </div>
            <Switch
              checked={formData.is_public_profile}
              onCheckedChange={(v) => setFormData({ ...formData, is_public_profile: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Messages privés</p>
              <p className="text-sm text-gray-500">Recevoir des messages d'autres membres</p>
            </div>
            <Switch
              checked={formData.allow_messages}
              onCheckedChange={(v) => setFormData({ ...formData, allow_messages: v })}
            />
          </div>
        </div>
      </Card>

      <Button type="submit" disabled={loading} className="w-full bg-emerald-500 hover:bg-emerald-600">
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        Enregistrer les préférences
      </Button>
    </form>
  );
}