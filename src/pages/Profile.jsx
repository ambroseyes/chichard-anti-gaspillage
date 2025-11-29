import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { 
  User, Mail, Phone, MapPin, Edit2, Save, LogOut,
  Package, TrendingUp, Leaf, Award, ChevronRight,
  Store, Settings, HelpCircle, Users, ChefHat, Trophy, Flame, Crown
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import SavingsCounter from '@/components/ui/SavingsCounter';
import BadgeDisplay from '@/components/gamification/BadgeDisplay';
import CommunityBadges from '@/components/gamification/CommunityBadges';
import ReferralSystem from '@/components/gamification/ReferralSystem';
import { Lightbulb, Heart, Star } from 'lucide-react';

// Badge mapping for featured display
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
  const [formData, setFormData] = useState({
    phone: '',
    city: '',
    address: ''
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        setFormData({
          phone: userData.phone || '',
          city: userData.city || '',
          address: userData.address || ''
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const level = ecoLevels[user.eco_level] || ecoLevels.debutant;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className={`bg-gradient-to-br ${level.color} text-white`}>
        <div className="max-w-2xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 text-5xl">
              {level.icon}
            </div>
            <h1 className="text-2xl font-bold mb-1">{user.full_name}</h1>
            <p className="text-white/80 mb-2">{user.email}</p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5">
                <Award className="w-4 h-4" />
                <span className="text-sm font-medium">{level.name}</span>
              </div>

              {user.featured_badge && badgeIcons[user.featured_badge] && (
                <div className={`inline-flex items-center gap-2 ${badgeIcons[user.featured_badge].color} text-white rounded-full px-4 py-1.5 shadow-sm`}>
                  {React.createElement(badgeIcons[user.featured_badge].icon, { className: "w-4 h-4" })}
                  <span className="text-sm font-medium">Badge Actif</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-4 space-y-6">
        {/* Stats & Progression */}
        <div className="space-y-2">
            <SavingsCounter 
            totalSavings={user.total_savings || 0}
            wasteAvoided={user.waste_avoided_kg || 0}
            ecoLevel={user.eco_level || 'debutant'}
            />
            
            {/* Next Level Progression */}
            <Card className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-semibold text-emerald-800">Prochaine étape: Éco-Héros</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-600">75%</span>
                </div>
                <div className="w-full bg-emerald-200 rounded-full h-2 mb-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
                <p className="text-xs text-emerald-600">Plus que 250 points pour atteindre le niveau supérieur !</p>
            </Card>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 text-center">
            <Package className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{user.total_orders || 0}</p>
            <p className="text-sm text-gray-500">Commandes</p>
          </Card>
          <Card className="p-4 text-center">
            <Leaf className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{(user.waste_avoided_kg || 0).toFixed(1)}</p>
            <p className="text-sm text-gray-500">kg sauvés</p>
          </Card>
        </div>

        {/* Info */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Informations personnelles</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              disabled={isSaving}
            >
              {isEditing ? (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer
                </>
              ) : (
                <>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Modifier
                </>
              )}
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-gray-500 text-sm">Téléphone</Label>
              {isEditing ? (
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="6XX XX XX XX"
                />
              ) : (
                <p className="font-medium">{user.phone || 'Non renseigné'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-500 text-sm">Ville</Label>
              {isEditing ? (
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Votre ville"
                />
              ) : (
                <p className="font-medium">{user.city || 'Non renseigné'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-500 text-sm">Adresse</Label>
              {isEditing ? (
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Votre adresse"
                />
              ) : (
                <p className="font-medium">{user.address || 'Non renseigné'}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Badges */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Mes badges
            </h2>
            <Link to={createPageUrl('Achievements')} className="text-sm text-emerald-600">
              Gérer mes badges
            </Link>
          </div>
          <BadgeDisplay userBadges={user.badges || []} compact />
        </Card>

        {/* Referral System */}
        <ReferralSystem user={user} />

        {/* Community Badges Link */}
        <Link to={createPageUrl('Achievements')}>
            <Card className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-full text-amber-600">
                            <Trophy className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Accomplissements & Badges</h3>
                            <p className="text-sm text-gray-500">Voir votre progression et personnaliser</p>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
            </Card>
        </Link>

        {/* Actions */}
        <Card className="divide-y">
          {user.is_partner && (
            <Link 
              to={createPageUrl('PartnerDashboard')}
              className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
            >
              <Store className="w-5 h-5 text-gray-500" />
              <span className="flex-1 font-medium">Espace partenaire</span>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>
          )}
          <Link 
            to={createPageUrl('Orders')}
            className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
          >
            <Package className="w-5 h-5 text-gray-500" />
            <span className="flex-1 font-medium">Mes commandes</span>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </Link>
          <Link 
            to={createPageUrl('Community')}
            className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
          >
            <Users className="w-5 h-5 text-gray-500" />
            <span className="flex-1 font-medium">Communauté</span>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </Link>
          <Link 
            to={createPageUrl('FoodCoach')}
            className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
          >
            <ChefHat className="w-5 h-5 text-gray-500" />
            <span className="flex-1 font-medium">FoodCoach IA</span>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </Link>
          <Link 
            to={createPageUrl('WeeklyChallenges')}
            className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
          >
            <Flame className="w-5 h-5 text-orange-500" />
            <span className="flex-1 font-medium">Défis hebdomadaires</span>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </Link>
          <Link 
            to={createPageUrl('ChichardPlus')}
            className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
          >
            <Crown className="w-5 h-5 text-amber-500" />
            <span className="flex-1 font-medium">CHICHARD+</span>
            {!user.is_premium && <Badge className="bg-amber-100 text-amber-700 text-xs">Premium</Badge>}
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </Link>
          <Link 
            to={createPageUrl('LoyaltyProgram')}
            className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
          >
            <TrendingUp className="w-5 h-5 text-purple-500" />
            <span className="flex-1 font-medium">Programme Fidélité</span>
            <Badge className="bg-purple-100 text-purple-700 text-xs">{user.loyalty_points || 0} pts</Badge>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </Link>
          <button className="flex items-center gap-4 p-4 w-full hover:bg-gray-50 transition-colors">
            <HelpCircle className="w-5 h-5 text-gray-500" />
            <span className="flex-1 font-medium text-left">Aide & Support</span>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </Card>

        {/* Logout */}
        <Button
          variant="outline"
          className="w-full text-red-600 border-red-200 hover:bg-red-50"
          onClick={() => base44.auth.logout()}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Déconnexion
        </Button>
      </div>
    </div>
  );
}