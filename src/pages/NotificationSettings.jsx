import React, { useState, useEffect } from 'react';
import { api } from '@/api';
import { Bell, Clock, Tag, Leaf, Save, ChevronLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { goToLogin } from '@/lib/navigation';
import { useAuth } from '@/lib/AuthContext';

const DIETARY_OPTIONS = ['Végétarien', 'Vegan', 'Halal', 'Sans gluten', 'Sans lactose', 'Kasher', 'Bio uniquement'];
const CATEGORIES = ['fruits_legumes', 'produits_laitiers', 'viandes_poissons', 'boulangerie', 'epicerie', 'boissons'];
const CATEGORIES_LABELS = {
  fruits_legumes: 'Fruits & Légumes', produits_laitiers: 'Produits laitiers',
  viandes_poissons: 'Viandes & Poissons', boulangerie: 'Boulangerie',
  epicerie: 'Épicerie', boissons: 'Boissons',
};

export default function NotificationSettings() {
  const { user, updateProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    dlc_alert_days: 2,
    push_notifications_enabled: false,
    offer_categories: [],
    dietary_preferences: [],
  });

  useEffect(() => {
    api.auth.me().then(u => {
      setSettings({
        dlc_alert_days: u.dlc_alert_days || 2,
        push_notifications_enabled: u.push_notifications_enabled || false,
        offer_categories: u.offer_categories || [],
        dietary_preferences: u.dietary_preferences || [],
      });
    }).catch(() => goToLogin());
  }, []);

  const toggleArr = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: prev[key].includes(value) ? prev[key].filter(v => v !== value) : [...prev[key], value]
    }));
  };

  const handlePushToggle = async () => {
    if (!settings.push_notifications_enabled) {
      if (!('Notification' in window)) { toast.error('Push non supporté sur ce navigateur'); return; }
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { toast.error('Permission refusée'); return; }
    }
    setSettings(prev => ({ ...prev, push_notifications_enabled: !prev.push_notifications_enabled }));
  };

  const save = async () => {
    setSaving(true);
    // Les préférences vivent dans `preferences`, seul objet libre du profil.
    await updateProfile({ preferences: { ...(user?.preferences ?? {}), notifications: settings } });
    setSaving(false);
    toast.success('Paramètres enregistrés');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link to={createPageUrl('Notifications')}>
            <Button variant="ghost" size="sm"><ChevronLeft className="w-4 h-4" /></Button>
          </Link>
          <h1 className="font-semibold text-lg">Paramètres notifications</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Push toggle */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-xl"><Bell className="w-5 h-5 text-emerald-600" /></div>
              <div>
                <p className="font-medium">Notifications push</p>
                <p className="text-xs text-gray-500">Alertes en temps réel sur votre appareil</p>
              </div>
            </div>
            <button
              onClick={handlePushToggle}
              className={`w-12 h-6 rounded-full transition-colors relative ${settings.push_notifications_enabled ? 'bg-emerald-500' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings.push_notifications_enabled ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </Card>

        {/* DLC threshold */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-amber-500" />
            <p className="font-medium">Alerte DLC (jours avant expiration)</p>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 5].map(d => (
              <button
                key={d}
                onClick={() => setSettings(prev => ({ ...prev, dlc_alert_days: d }))}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
                  settings.dlc_alert_days === d
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'border-gray-200 text-gray-600 hover:border-amber-300'
                }`}
              >
                {d}j
              </button>
            ))}
          </div>
        </Card>

        {/* Offer preferences */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Tag className="w-5 h-5 text-blue-500" />
            <p className="font-medium">Catégories d'offres</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => toggleArr('offer_categories', cat)}
                className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                  settings.offer_categories.includes(cat)
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'border-gray-200 text-gray-600 hover:border-blue-300'
                }`}
              >
                {CATEGORIES_LABELS[cat]}
              </button>
            ))}
          </div>
        </Card>

        {/* Dietary prefs */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Leaf className="w-5 h-5 text-emerald-500" />
            <p className="font-medium">Régimes alimentaires</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {DIETARY_OPTIONS.map(opt => (
              <button
                key={opt}
                onClick={() => toggleArr('dietary_preferences', opt)}
                className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                  settings.dietary_preferences.includes(opt)
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : 'border-gray-200 text-gray-600 hover:border-emerald-300'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </Card>

        <Button onClick={save} disabled={saving} className="w-full bg-emerald-500 hover:bg-emerald-600" size="lg">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Enregistrement...' : 'Sauvegarder'}
        </Button>
      </div>
    </div>
  );
}