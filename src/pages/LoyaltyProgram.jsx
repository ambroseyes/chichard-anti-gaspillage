import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Crown, Gift, Star, TrendingUp, Zap, Truck, Percent,
  Award, ChevronRight, Lock, Check, Sparkles, ShoppingBag, ChefHat
} from 'lucide-react';
import ExperienceRewards from '@/components/loyalty/ExperienceRewards';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';

const tiers = [
  { id: 'bronze', name: 'Bronze', minPoints: 0, color: 'from-amber-600 to-amber-700', icon: '🥉', multiplier: 1, benefits: ['Points de base'] },
  { id: 'silver', name: 'Argent', minPoints: 1000, color: 'from-gray-400 to-gray-500', icon: '🥈', multiplier: 1.25, benefits: ['x1.25 points', 'Offres exclusives'] },
  { id: 'gold', name: 'Or', minPoints: 5000, color: 'from-yellow-400 to-amber-500', icon: '🥇', multiplier: 1.5, benefits: ['x1.5 points', 'Livraison prioritaire', 'Accès anticipé'] },
  { id: 'platinum', name: 'Platine', minPoints: 15000, color: 'from-purple-400 to-indigo-500', icon: '💎', multiplier: 2, benefits: ['x2 points', 'Support VIP', 'Événements exclusifs'] },
  { id: 'diamond', name: 'Diamant', minPoints: 50000, color: 'from-cyan-400 to-blue-500', icon: '👑', multiplier: 3, benefits: ['x3 points', 'Concierge dédié', 'Expériences premium', 'Cadeaux anniversaire'] },
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
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {}
    };
    loadUser();
  }, []);

  const { data: transactions = [] } = useQuery({
    queryKey: ['loyalty-transactions', user?.email],
    queryFn: () => base44.entities.LoyaltyTransaction.filter({ user_email: user.email }, '-created_date', 50),
    enabled: !!user,
  });

  const { data: rewards = [] } = useQuery({
    queryKey: ['loyalty-rewards'],
    queryFn: () => base44.entities.LoyaltyReward.filter({ is_active: true }),
  });

  const displayRewards = rewards.length > 0 ? rewards : defaultRewards;

  const userPoints = user?.loyalty_points || 0;
  const currentTier = [...tiers].reverse().find(t => userPoints >= t.minPoints) || tiers[0];
  const nextTier = tiers[tiers.indexOf(currentTier) + 1];
  const progressToNext = nextTier 
    ? ((userPoints - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100
    : 100;

  const redeemMutation = useMutation({
    mutationFn: async (reward) => {
      if (userPoints < reward.points_required) {
        throw new Error('Points insuffisants');
      }
      
      await base44.entities.LoyaltyTransaction.create({
        user_email: user.email,
        type: 'redeem',
        points: -reward.points_required,
        source: 'redemption',
        description: `Échange: ${reward.title}`
      });

      await base44.auth.updateMe({
        loyalty_points: userPoints - reward.points_required
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-transactions'] });
      toast.success('Récompense échangée ! 🎁');
    },
    onError: (e) => toast.error(e.message)
  });

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
          <Button onClick={() => base44.auth.redirectToLogin()}>
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

        <Tabs defaultValue="rewards">
          <TabsList className="mb-6 flex-wrap">
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

          <TabsContent value="rewards">
            <div className="grid md:grid-cols-2 gap-4">
              {displayRewards.map((reward) => {
                const Icon = rewardIcons[reward.reward_type] || Gift;
                const tierUnlocked = tiers.findIndex(t => t.id === reward.tier_required) <= tiers.indexOf(currentTier);
                const canRedeem = userPoints >= reward.points_required && tierUnlocked;

                return (
                  <motion.div
                    key={reward.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
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
                        <Button
                          size="sm"
                          disabled={!canRedeem}
                          onClick={() => redeemMutation.mutate(reward)}
                          className={canRedeem ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                        >
                          Échanger
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              {transactions.length === 0 ? (
                <div className="p-8 text-center">
                  <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Aucune transaction</p>
                </div>
              ) : (
                <div className="divide-y">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${tx.type === 'earn' ? 'bg-emerald-100' : 'bg-orange-100'}`}>
                          {tx.type === 'earn' ? (
                            <TrendingUp className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Gift className="w-4 h-4 text-orange-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{tx.description}</p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(tx.created_date), "d MMM yyyy", { locale: fr })}
                          </p>
                        </div>
                      </div>
                      <span className={`font-bold ${tx.type === 'earn' ? 'text-emerald-600' : 'text-orange-600'}`}>
                        {tx.type === 'earn' ? '+' : ''}{tx.points}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="experiences">
            <ExperienceRewards user={user} />
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