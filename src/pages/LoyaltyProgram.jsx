import React from 'react';
import { api } from '@/api';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Gift, Star, TrendingUp, Zap, Truck, Percent,
  Award, Lock, Sparkles, ShoppingBag, ChefHat
} from 'lucide-react';
import ExperienceBookingSection from '@/components/loyalty/ExperienceBooking';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import { goToLogin } from '@/lib/navigation';

/** Clés alignées sur celles du serveur (server/src/domain/loyalty.js). */
const ECO_LEVELS = [
  { key: 'debutant',    label: 'Débutant',    minKg: 0,   icon: '🌱' },
  { key: 'engage',      label: 'Engagé',      minKg: 10,  icon: '🌿' },
  { key: 'expert',      label: 'Expert',      minKg: 50,  icon: '🍃' },
  { key: 'ambassadeur', label: 'Ambassadeur', minKg: 150, icon: '🌳' },
  { key: 'heros',       label: 'Héros',       minKg: 500, icon: '🌍' },
];

const BADGES = [
  { code: 'FIRST_SAVE',    icon: '🌱', title: 'Premier Sauvetage',    desc: 'Premier achat anti-gaspi',      rule: { minKg: 0.1 } },
  { code: 'FRUIT_SAVER',  icon: '🍎', title: 'Sauveur de Fruits',     desc: '5 kg de fruits sauvés',         rule: { minKg: 5 } },
  { code: 'ECO_WARRIOR',  icon: '⚔️', title: 'Guerrier Éco',          desc: '15 kg sauvés au total',         rule: { minKg: 15 } },
  { code: 'CHAMPION',     icon: '🏆', title: 'Champion Anti-Gaspi',   desc: '30 kg sauvés au total',         rule: { minKg: 30 } },
  { code: 'LEGEND',       icon: '🌍', title: 'Légende Planétaire',    desc: '60 kg sauvés au total',         rule: { minKg: 60 } },
];

const COUPON_REWARDS = [
  { id: 'c1', label: '500 FCFA de réduction',  points: 100, value: 500,  type: 'FIXED' },
  { id: 'c2', label: '1000 FCFA de réduction', points: 180, value: 1000, type: 'FIXED' },
  { id: 'c3', label: '10% sur votre panier',   points: 250, value: 10,   type: 'PERCENT' },
  { id: 'c4', label: '2500 FCFA de réduction', points: 400, value: 2500, type: 'FIXED' },
];

const tiers = [
  { id: 'bronze',   name: 'Bronze',  minPoints: 0,     color: 'from-amber-600 to-amber-700',   icon: '🥉', multiplier: 1,   benefits: ['Points de base'] },
  { id: 'silver',   name: 'Argent',  minPoints: 1000,  color: 'from-gray-400 to-gray-500',     icon: '🥈', multiplier: 1.25, benefits: ['x1.25 points', 'Offres exclusives'] },
  { id: 'gold',     name: 'Or',      minPoints: 5000,  color: 'from-yellow-400 to-amber-500',  icon: '🥇', multiplier: 1.5,  benefits: ['x1.5 points', 'Livraison prioritaire'] },
  { id: 'platinum', name: 'Platine', minPoints: 15000, color: 'from-purple-400 to-indigo-500', icon: '💎', multiplier: 2,   benefits: ['x2 points', 'Support VIP'] },
  { id: 'diamond',  name: 'Diamant', minPoints: 50000, color: 'from-cyan-400 to-blue-500',     icon: '👑', multiplier: 3,   benefits: ['x3 points', 'Expériences premium'] },
];

const defaultRewards = [
  { id: '1', title: '500 FCFA de réduction', points_required: 200, reward_type: 'discount', reward_value: 500, tier_required: 'bronze' },
  { id: '2', title: 'Livraison gratuite', points_required: 300, reward_type: 'free_delivery', tier_required: 'bronze' },
  { id: '3', title: '1000 FCFA de réduction', points_required: 400, reward_type: 'discount', reward_value: 1000, tier_required: 'silver' },
  { id: '4', title: 'Produit mystère', points_required: 600, reward_type: 'exclusive_product', tier_required: 'silver' },
  { id: '5', title: '2500 FCFA de réduction', points_required: 1000, reward_type: 'discount', reward_value: 2500, tier_required: 'gold' },
  { id: '6', title: 'Badge Platine exclusif', points_required: 2000, reward_type: 'badge', tier_required: 'platinum' },
];

export default function LoyaltyProgram() {
  const queryClient = useQueryClient();
  const { user, reload } = useAuth();

  /**
   * Paliers, niveau écologique et progression sont calculés par le serveur :
   * les seuils ne sont plus dupliqués entre l'interface et le back.
   */
  const { data: summary } = useQuery({
    queryKey: ['loyalty-summary', user?.email],
    queryFn: () => api.loyalty.summary(),
    enabled: Boolean(user),
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['loyalty-transactions', user?.email],
    queryFn: () => api.entities.LoyaltyTransaction.filter({ user_email: user.email }, '-created_date', 50),
    enabled: !!user,
  });

  const { data: rewards = [] } = useQuery({
    queryKey: ['loyalty-rewards'],
    queryFn: () => api.entities.LoyaltyReward.filter({ is_active: true }),
  });

  const displayRewards = rewards.length > 0 ? rewards : defaultRewards;

  const userPoints = summary?.loyalty_points ?? user?.loyalty_points ?? 0;
  const currentTier = tiers.find((t) => t.id === summary?.tier?.key) ?? tiers[0];
  const nextTier = summary?.next_tier ? tiers.find((t) => t.id === summary.next_tier.key) : null;
  const progressToNext = nextTier
    ? ((userPoints - (summary?.tier?.minPoints ?? 0)) /
        Math.max(1, summary.next_tier.minPoints - (summary?.tier?.minPoints ?? 0))) * 100
    : 100;

  // Le modèle nomme ce champ `waste_avoided_kg` ; l'interface lisait `kg_saved`,
  // qui n'a jamais existé — le compteur restait donc à zéro.
  const kgSaved = summary?.waste_avoided_kg ?? user?.waste_avoided_kg ?? 0;
  const ecoLevel = ECO_LEVELS.find((l) => l.key === summary?.eco_level?.key) ?? ECO_LEVELS[0];
  const nextEcoLevel = summary?.next_eco_level
    ? ECO_LEVELS.find((l) => l.key === summary.next_eco_level.key)
    : null;
  const ecoProgress = nextEcoLevel
    ? ((kgSaved - (summary?.eco_level?.minKg ?? 0)) /
        Math.max(1, summary.next_eco_level.minKg - (summary?.eco_level?.minKg ?? 0))) * 100
    : 100;
  const unlockedBadges = new Set(BADGES.filter(b => kgSaved >= b.rule.minKg).map(b => b.code));

  /**
   * L'échange débite les points côté serveur, sous condition SQL : ni le solde
   * ni la valeur du coupon ne sont décidés par le navigateur.
   */
  const redeemMutation = useMutation({
    mutationFn: (reward) => api.loyalty.redeem(reward.id),
    onSuccess: ({ coupon, remaining_points: remaining }) => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-summary'] });
      queryClient.invalidateQueries({ queryKey: ['loyalty-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['user-coupons'] });
      reload();
      toast.success(
        coupon
          ? `Coupon ${coupon.code} généré — retrouvez-le dans votre panier`
          : `Récompense échangée. Solde : ${remaining} points`,
      );
    },
    onError: (error) => toast.error(error.message ?? "L'échange n'a pas abouti"),
  });

  // Une seule voie d'échange : l'ancien doublon créait deux journaux divergents.
  const redeemCouponMutation = redeemMutation;

  const rewardIcons = {
    discount: Percent,
    free_delivery: Truck,
    exclusive_product: Gift,
    badge: Award,
    experience: Sparkles
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <Lock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Programme de Fidélité</h2>
          <p className="text-gray-500 mb-4">Connectez-vous pour accéder à vos avantages</p>
          <Button onClick={() => goToLogin()}>
            Se connecter
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className={`bg-gradient-to-r ${currentTier.color} text-white`}>
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="text-5xl">{currentTier.icon}</div>
            <div>
              <Badge className="bg-white/20 text-white mb-2">Niveau {currentTier.name}</Badge>
              <h1 className="text-3xl font-bold">Programme Fidélité</h1>
            </div>
          </div>
          
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-white/80 text-sm">Vos points</p>
                <p className="text-3xl font-bold">{userPoints.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-white/80 text-sm">Multiplicateur</p>
                <p className="text-2xl font-bold">x{currentTier.multiplier}</p>
              </div>
            </div>
            
            {nextTier && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>{currentTier.name}</span>
                  <span>{nextTier.name}</span>
                </div>
                <Progress value={progressToNext} className="h-2 bg-white/20" />
                <p className="text-center text-sm mt-2 text-white/80">
                  {nextTier.minPoints - userPoints} points pour le niveau suivant
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Tier Benefits */}
        <Card className="p-5 mb-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            Avantages par niveau
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {tiers.map((tier) => {
              const isUnlocked = userPoints >= tier.minPoints;
              return (
                <div 
                  key={tier.id}
                  className={`p-4 rounded-xl text-center ${
                    isUnlocked 
                      ? `bg-gradient-to-br ${tier.color} text-white`
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <div className="text-2xl mb-1">{tier.icon}</div>
                  <p className="font-semibold">{tier.name}</p>
                  <p className="text-xs opacity-80">x{tier.multiplier} points</p>
                  {!isUnlocked && <Lock className="w-4 h-4 mx-auto mt-2" />}
                </div>
              );
            })}
          </div>
        </Card>

        <Tabs defaultValue="eco-hero">
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="eco-hero">🌍 Éco-Héros</TabsTrigger>
            <TabsTrigger value="rewards">
              <Gift className="w-4 h-4 mr-2" />
              Récompenses
            </TabsTrigger>
            <TabsTrigger value="experiences">
              <ChefHat className="w-4 h-4 mr-2" />
              Expériences
            </TabsTrigger>
            <TabsTrigger value="history">
              <TrendingUp className="w-4 h-4 mr-2" />
              Historique
            </TabsTrigger>
            <TabsTrigger value="earn">
              <Zap className="w-4 h-4 mr-2" />
              Gagner des points
            </TabsTrigger>
          </TabsList>

          <TabsContent value="eco-hero">
            {/* Eco-Hero Gauge */}
            <Card className={`p-5 mb-5 bg-gradient-to-br ${ecoLevel.color} text-white`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-white/80 text-sm">Niveau Éco</p>
                  <p className="text-2xl font-bold">{ecoLevel.label}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">{kgSaved.toFixed(1)}<span className="text-lg"> kg</span></p>
                  <p className="text-white/70 text-sm">sauvés du gaspillage</p>
                </div>
              </div>
              {nextEcoLevel && (
                <div>
                  <div className="flex justify-between text-xs text-white/70 mb-1">
                    <span>{ecoLevel.minKg} kg</span>
                    <span>{nextEcoLevel.minKg} kg → {nextEcoLevel.label}</span>
                  </div>
                  <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full transition-all" style={{ width: `${Math.min(ecoProgress, 100)}%` }} />
                  </div>
                  <p className="text-center text-xs text-white/70 mt-1">{(nextEcoLevel.minKg - kgSaved).toFixed(1)} kg pour le niveau suivant</p>
                </div>
              )}
            </Card>

            {/* Badges */}
            <h3 className="font-semibold mb-3">Badges</h3>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-6">
              {BADGES.map(badge => {
                const unlocked = unlockedBadges.has(badge.code);
                return (
                  <div key={badge.code} className={`p-3 rounded-xl text-center border-2 transition-all ${
                    unlocked ? 'border-emerald-300 bg-emerald-50' : 'border-dashed border-gray-200 bg-gray-50 opacity-50'
                  }`}>
                    <p className="text-2xl mb-1">{badge.icon}</p>
                    <p className="text-xs font-medium text-gray-800">{badge.title}</p>
                    <p className="text-[10px] text-gray-500">{badge.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* Convert points to coupon */}
            <h3 className="font-semibold mb-3">Convertir mes points en coupon</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {COUPON_REWARDS.map(r => {
                const canAfford = userPoints >= r.points;
                return (
                  <Card key={r.id} className={`p-4 flex items-center justify-between ${!canAfford ? 'opacity-60' : ''}`}>
                    <div>
                      <p className="font-medium">{r.label}</p>
                      <p className="text-xs text-gray-500">{r.points} pts · Valable 30 jours</p>
                    </div>
                    <Button size="sm" disabled={!canAfford || redeemCouponMutation.isPending}
                      onClick={() => redeemCouponMutation.mutate(r)}
                      className={canAfford ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
                      Obtenir
                    </Button>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="rewards">
            <div className="grid md:grid-cols-2 gap-4">
              {displayRewards.map((reward) => {
                const Icon = rewardIcons[reward.reward_type] || Gift;
                const tierUnlocked = tiers.findIndex(t => t.id === reward.tier_required) <= tiers.indexOf(currentTier);
                const canRedeem = userPoints >= reward.points_required && tierUnlocked;
                return (
                  <motion.div key={reward.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className={`p-4 ${!tierUnlocked ? 'opacity-60' : ''}`}>
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${canRedeem ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                          <Icon className={`w-6 h-6 ${canRedeem ? 'text-emerald-600' : 'text-gray-400'}`} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{reward.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary">{reward.points_required} pts</Badge>
                            {!tierUnlocked && (
                              <Badge className="bg-amber-100 text-amber-700">
                                <Lock className="w-3 h-3 mr-1" />
                                {tiers.find(t => t.id === reward.tier_required)?.name}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button size="sm" disabled={!canRedeem} onClick={() => redeemMutation.mutate(reward)}
                          className={canRedeem ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
                          Échanger
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="experiences">
            <ExperienceBookingSection user={user} userPoints={userPoints} userTier={currentTier.id} />
          </TabsContent>

          <TabsContent value="earn">
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { title: 'Acheter des produits', desc: '1 point par 100 FCFA', points: 'Variable', icon: ShoppingBag },
                { title: 'Compléter un défi', desc: 'Jusqu\'à 400 points', points: '+100-400', icon: Zap },
                { title: 'Parrainer un ami', desc: 'Quand il passe sa 1ère commande', points: '+500', icon: Award },
                { title: 'Laisser un avis', desc: 'Sur un produit acheté', points: '+25', icon: Star },
              ].map((item, idx) => (
                <Card key={idx} className="p-4 flex items-center gap-4">
                  <div className="p-3 bg-emerald-100 rounded-xl">
                    <item.icon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{item.title}</h4>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700">{item.points}</Badge>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}