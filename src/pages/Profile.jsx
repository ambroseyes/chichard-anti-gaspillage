import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  User, Mail, Phone, MapPin, Edit2, Save, LogOut,
  Package, TrendingUp, Leaf, Award, ChevronRight,
  Store, Settings, HelpCircle, Users, ChefHat, Trophy, Flame, Crown,
  ShoppingBag, Recycle, Star, Heart, Lightbulb, Check
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from 'sonner';
import SavingsCounter from '@/components/ui/SavingsCounter';
import BadgeDisplay from '@/components/gamification/BadgeDisplay';
import ReferralSystem from '@/components/gamification/ReferralSystem';

const DIETARY_OPTIONS = [
  'Végétarien', 'Vegan', 'Halal', 'Sans gluten', 'Sans lactose', 'Kasher', 'Bio uniquement', 'Sans fruits de mer'
];

const ALLERGEN_OPTIONS = [
  'Arachides', 'Gluten', 'Lactose', 'Œufs', 'Soja', 'Fruits de mer', 'Noix', 'Céleri'
];

// Badge mapping configuration
const badgeIcons = {
  top_advisor: { icon: Lightbulb, color: 'bg-amber-500' },
  recipe_master: { icon: ChefHat, color: 'bg-pink-500' },
  community_star: { icon: Star, color: 'bg-purple-500' },
  helper: { icon: Heart, color: 'bg-red-500' },
  influencer: { icon: Users, color: 'bg-emerald-500' },
  pioneer: { icon: Flame, color: 'bg-orange-500' },
  champion: { icon: Trophy, color: 'bg-yellow-500' },
  diamond: { icon: Crown, color: 'bg-blue-500' },
};

const ecoLevels = {
  debutant: { name: 'Débutant', icon: '🌱', color: 'from-gray-400 to-gray-500' },
  eco_citoyen: { name: 'Éco-Citoyen', icon: '🌿', color: 'from-emerald-400 to-emerald-500' },
  eco_hero: { name: 'Éco-Héros', icon: '🌳', color: 'from-blue-400 to-blue-500' },
  eco_champion: { name: 'Éco-Champion', icon: '🌲', color: 'from-purple-400 to-purple-500' },
  eco_legend: { name: 'Éco-Légende', icon: '🌍', color: 'from-orange-400 to-orange-500' },
};

export default function Profile() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ phone: '', city: '', address: '' });
  const [prefData, setPrefData] = useState({ dietary: [], allergens: [] });
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        setFormData({ phone: userData.phone || '', city: userData.city || '', address: userData.address || '' });
        setPrefData({
          dietary: userData.dietary_preferences || [],
          allergens: userData.allergens_to_avoid || []
        });
      } catch (e) {
        base44.auth.redirectToLogin();
      }
    };
    loadUser();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    await base44.auth.updateMe(formData);
    setUser({ ...user, ...formData });
    setIsEditing(false);
    setIsSaving(false);
    toast.success('Profil mis à jour');
  };

  const handleSavePrefs = async () => {
    setIsSavingPrefs(true);
    await base44.auth.updateMe({ dietary_preferences: prefData.dietary, allergens_to_avoid: prefData.allergens });
    setUser({ ...user, dietary_preferences: prefData.dietary, allergens_to_avoid: prefData.allergens });
    setIsSavingPrefs(false);
    toast.success('Préférences enregistrées');
  };

  const togglePref = (key, value) => {
    setPrefData(prev => ({
      ...prev,
      [key]: prev[key].includes(value) ? prev[key].filter(v => v !== value) : [...prev[key], value]
    }));
  };

  const { data: orders = [] } = useQuery({
    queryKey: ['profile-orders', user?.email],
    queryFn: () => base44.entities.Order.filter({ customer_email: user.email }, '-created_date', 50),
    enabled: !!user?.email,
  });

  const totalSaved = orders.reduce((s, o) => s + (o.savings_amount || 0), 0);
  const level = ecoLevels[user?.eco_level] || ecoLevels.debutant;

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className={`bg-gradient-to-br ${level.color} text-white`}>
        <div className="max-w-2xl mx-auto px-4 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 text-5xl">
              {level.icon}
            </div>
            <h1 className="text-2xl font-bold mb-1">{user.full_name}</h1>
            <p className="text-white/80 mb-2">{user.email}</p>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5">
              <Award className="w-4 h-4" />
              <span className="text-sm font-medium">{level.name}</span>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-4">
        <Tabs defaultValue="overview">
          <TabsList className="w-full mb-6 bg-white shadow-sm">
            <TabsTrigger value="overview" className="flex-1">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="orders" className="flex-1">Commandes</TabsTrigger>
            <TabsTrigger value="prefs" className="flex-1">Préférences</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6">
            {/* Eco Stats */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="p-3 text-center">
                <ShoppingBag className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                <p className="text-xl font-bold">{orders.length}</p>
                <p className="text-xs text-gray-500">Commandes</p>
              </Card>
              <Card className="p-3 text-center">
                <TrendingUp className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                <p className="text-xl font-bold">{(totalSaved / 1000).toFixed(0)}k</p>
                <p className="text-xs text-gray-500">F économisés</p>
              </Card>
              <Card className="p-3 text-center">
                <Recycle className="w-5 h-5 text-green-500 mx-auto mb-1" />
                <p className="text-xl font-bold">{(user.waste_avoided_kg || 0).toFixed(1)}</p>
                <p className="text-xs text-gray-500">kg sauvés</p>
              </Card>
            </div>

            <SavingsCounter totalSavings={user.total_savings || 0} wasteAvoided={user.waste_avoided_kg || 0} ecoLevel={user.eco_level || 'debutant'} />

            {/* Profile Info */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Informations personnelles</h2>
                <Button variant="ghost" size="sm" onClick={() => isEditing ? handleSave() : setIsEditing(true)} disabled={isSaving}>
                  {isEditing ? <><Save className="w-4 h-4 mr-1" />Enregistrer</> : <><Edit2 className="w-4 h-4 mr-1" />Modifier</>}
                </Button>
              </div>
              <div className="space-y-3">
                {[['Téléphone', 'phone', '6XX XX XX XX'], ['Ville', 'city', 'Votre ville'], ['Adresse', 'address', 'Votre adresse']].map(([label, field, placeholder]) => (
                  <div key={field}>
                    <Label className="text-gray-500 text-xs">{label}</Label>
                    {isEditing ? (
                      <Input value={formData[field]} onChange={e => setFormData({ ...formData, [field]: e.target.value })} placeholder={placeholder} />
                    ) : (
                      <p className="font-medium text-sm mt-0.5">{formData[field] || 'Non renseigné'}</p>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            <BadgeDisplay userBadges={user.badges || []} compact />
            <ReferralSystem user={user} />

            <Card className="divide-y">
              {user.is_partner && (
                <Link to={createPageUrl('PartnerDashboard')} className="flex items-center gap-4 p-4 hover:bg-gray-50">
                  <Store className="w-5 h-5 text-gray-500" /><span className="flex-1 font-medium">Espace partenaire</span><ChevronRight className="w-5 h-5 text-gray-400" />
                </Link>
              )}
              <Link to={createPageUrl('LoyaltyProgram')} className="flex items-center gap-4 p-4 hover:bg-gray-50">
                <TrendingUp className="w-5 h-5 text-purple-500" /><span className="flex-1 font-medium">Programme Fidélité</span>
                <Badge className="bg-purple-100 text-purple-700 text-xs">{user.loyalty_points || 0} pts</Badge>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>
              <Link to={createPageUrl('Achievements')} className="flex items-center gap-4 p-4 hover:bg-gray-50">
                <Trophy className="w-5 h-5 text-amber-500" /><span className="flex-1 font-medium">Accomplissements</span><ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>
            </Card>

            <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50" onClick={() => base44.auth.logout()}>
              <LogOut className="w-4 h-4 mr-2" />Déconnexion
            </Button>
          </TabsContent>

          {/* ORDERS TAB */}
          <TabsContent value="orders" className="space-y-4">
            <Card className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-lg font-bold text-emerald-700">{orders.length}</p>
                  <p className="text-xs text-gray-500">Total commandes</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-emerald-700">{orders.filter(o => o.status === 'delivered').length}</p>
                  <p className="text-xs text-gray-500">Livrées</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-emerald-700">{(totalSaved).toLocaleString()} F</p>
                  <p className="text-xs text-gray-500">Économisé</p>
                </div>
              </div>
            </Card>

            {orders.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Aucune commande pour l'instant</p>
              </div>
            ) : (
              orders.map(order => (
                <Card key={order.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400">{new Date(order.created_date).toLocaleDateString('fr-FR')}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                      order.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>{order.status}</span>
                  </div>
                  <p className="font-medium text-gray-800">{order.store_name}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm text-gray-500">{(order.items || []).length} article(s)</p>
                    <p className="font-bold text-gray-900">{(order.total_amount || 0).toLocaleString()} F</p>
                  </div>
                  {(order.savings_amount || 0) > 0 && (
                    <p className="text-xs text-emerald-600 mt-1">💚 {order.savings_amount.toLocaleString()} F économisés</p>
                  )}
                </Card>
              ))
            )}
          </TabsContent>

          {/* PREFERENCES TAB */}
          <TabsContent value="prefs" className="space-y-6">
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Régimes alimentaires</h3>
              <div className="flex flex-wrap gap-2">
                {DIETARY_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    onClick={() => togglePref('dietary', opt)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                      prefData.dietary.includes(opt)
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : 'border-gray-200 text-gray-600 hover:border-emerald-300'
                    }`}
                  >
                    {prefData.dietary.includes(opt) && <Check className="w-3 h-3 inline mr-1" />}
                    {opt}
                  </button>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-3">Allergènes à éviter</h3>
              <div className="flex flex-wrap gap-2">
                {ALLERGEN_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    onClick={() => togglePref('allergens', opt)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                      prefData.allergens.includes(opt)
                        ? 'bg-red-500 text-white border-red-500'
                        : 'border-gray-200 text-gray-600 hover:border-red-300'
                    }`}
                  >
                    {prefData.allergens.includes(opt) && <Check className="w-3 h-3 inline mr-1" />}
                    {opt}
                  </button>
                ))}
              </div>
            </Card>

            <Button onClick={handleSavePrefs} disabled={isSavingPrefs} className="w-full bg-emerald-500 hover:bg-emerald-600">
              {isSavingPrefs ? 'Enregistrement...' : 'Sauvegarder mes préférences'}
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}