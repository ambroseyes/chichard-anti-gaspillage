import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { differenceInDays, differenceInHours } from 'date-fns';
import {
  Trophy, Flame, Clock, Target, Zap, ShoppingCart, Leaf,
  Award, Star, ChevronRight, Check, Lock, Sparkles, Users, Store
} from 'lucide-react';
import TeamChallenges from '@/components/challenges/TeamChallenges';
import PersonalGoals from '@/components/challenges/PersonalGoals';
import PartnerChallenges from '@/components/challenges/PartnerChallenges';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';

const challengeTemplates = [
  {
    id: 'eco_hero_basket',
    title: 'Panier Éco-Héros',
    description: 'Économisez 10 000 FCFA en une semaine',
    icon: '💰',
    goal_type: 'savings',
    goal_value: 10000,
    reward_points: 200,
    reward_badge: 'eco_saver',
    difficulty: 'medium'
  },
  {
    id: 'early_bird',
    title: 'Le Plus Rapide',
    description: 'Passez une commande avant 10h du matin',
    icon: '⏰',
    goal_type: 'early_order',
    goal_value: 1,
    reward_points: 100,
    reward_badge: 'early_bird',
    difficulty: 'easy'
  },
  {
    id: 'veggie_discovery',
    title: 'Découverte Végétale',
    description: 'Achetez 5 produits fruits & légumes',
    icon: '🥬',
    goal_type: 'category_purchase',
    goal_category: 'fruits_legumes',
    goal_value: 5,
    reward_points: 150,
    reward_badge: 'veggie_lover',
    difficulty: 'easy'
  },
  {
    id: 'zero_waste_week',
    title: 'Semaine Zéro Gaspi',
    description: 'Sauvez 5kg de produits du gaspillage',
    icon: '🌍',
    goal_type: 'waste_avoided',
    goal_value: 5,
    reward_points: 300,
    reward_badge: 'zero_waste',
    difficulty: 'hard'
  },
  {
    id: 'multi_store',
    title: 'Explorateur',
    description: 'Commandez dans 3 magasins différents',
    icon: '🗺️',
    goal_type: 'unique_stores',
    goal_value: 3,
    reward_points: 250,
    reward_badge: 'explorer',
    difficulty: 'medium'
  },
  {
    id: 'social_butterfly',
    title: 'Papillon Social',
    description: 'Partagez 3 posts sur la communauté',
    icon: '🦋',
    goal_type: 'social_posts',
    goal_value: 3,
    reward_points: 150,
    reward_badge: 'social_butterfly',
    difficulty: 'easy'
  },
  {
    id: 'super_saver',
    title: 'Super Économe',
    description: 'Atteignez 70% d\'économie sur une commande',
    icon: '🔥',
    goal_type: 'max_discount',
    goal_value: 70,
    reward_points: 400,
    reward_badge: 'super_saver',
    difficulty: 'hard'
  },
  {
    id: 'weekly_regular',
    title: 'Client Fidèle',
    description: 'Passez au moins 3 commandes cette semaine',
    icon: '🛒',
    goal_type: 'orders',
    goal_value: 3,
    reward_points: 200,
    reward_badge: 'loyal_customer',
    difficulty: 'medium'
  }
];

const difficultyConfig = {
  easy: { label: 'Facile', color: 'bg-green-100 text-green-700' },
  medium: { label: 'Moyen', color: 'bg-yellow-100 text-yellow-700' },
  hard: { label: 'Difficile', color: 'bg-red-100 text-red-700' }
};

export default function WeeklyChallenges() {
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

  const { data: challenges = [] } = useQuery({
    queryKey: ['challenges'],
    queryFn: () => base44.entities.Challenge.filter({ is_active: true }),
  });

  const { data: userChallenges = [] } = useQuery({
    queryKey: ['user-challenges', user?.email],
    queryFn: () => base44.entities.UserChallenge.filter({ user_email: user.email }),
    enabled: !!user,
  });

  const joinChallengeMutation = useMutation({
    mutationFn: async (challenge) => {
      await base44.entities.UserChallenge.create({
        user_email: user.email,
        challenge_id: challenge.id,
        current_progress: 0,
        is_completed: false
      });
      await base44.entities.Challenge.update(challenge.id, {
        participants_count: (challenge.participants_count || 0) + 1
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      queryClient.invalidateQueries({ queryKey: ['user-challenges'] });
      toast.success('Défi rejoint ! Bonne chance 🎯');
    }
  });

  const getUserProgress = (challengeId) => {
    return userChallenges.find(uc => uc.challenge_id === challengeId);
  };

  // Weekly challenges from templates
  const weeklyEndDate = new Date();
  weeklyEndDate.setDate(weeklyEndDate.getDate() + (7 - weeklyEndDate.getDay()));
  const hoursLeft = differenceInHours(weeklyEndDate, new Date());

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Flame className="w-8 h-8" />
              <h1 className="text-2xl font-bold">Défis Hebdomadaires</h1>
            </div>
            <p className="text-orange-100 mb-4">
              Relevez des défis, gagnez des badges exclusifs et des points bonus !
            </p>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
              <Clock className="w-4 h-4" />
              <span className="font-medium">{hoursLeft}h restantes cette semaine</span>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* User Stats */}
        {user && (
          <Card className="p-4 mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-100 rounded-xl">
                  <Trophy className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Vos points cette semaine</p>
                  <p className="text-2xl font-bold text-amber-600">{user.eco_points || 0} pts</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Défis complétés</p>
                <p className="text-xl font-bold text-gray-900">
                  {userChallenges.filter(uc => uc.is_completed).length} / {challenges.length}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Community Goal Banner */}
        <Card className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-6 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Objectif Communautaire: Semaine Sans Gaspi</h3>
                  <p className="text-indigo-100 text-sm">Objectif: Sauver 500kg de nourriture collectivement</p>
                </div>
              </div>
              <Badge className="bg-white text-indigo-600">En cours</Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>Progression actuelle: 342kg</span>
                <span>68%</span>
              </div>
              <Progress value={68} className="h-3 bg-indigo-800/50" />
              <p className="text-xs text-indigo-200 mt-2">
                Participez en sauvant des paniers ou en partageant vos astuces zéro déchet !
              </p>
            </div>
          </div>
        </Card>

        <Tabs defaultValue="weekly">
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="weekly">
              <Flame className="w-4 h-4 mr-2" />
              Hebdo
            </TabsTrigger>
            <TabsTrigger value="personal">
              <Target className="w-4 h-4 mr-2" />
              Mes objectifs
            </TabsTrigger>
            <TabsTrigger value="team">
              <Users className="w-4 h-4 mr-2" />
              Équipe
            </TabsTrigger>
            <TabsTrigger value="partner">
              <Store className="w-4 h-4 mr-2" />
              Partenaires
            </TabsTrigger>
            <TabsTrigger value="completed">
              <Check className="w-4 h-4 mr-2" />
              Complétés
            </TabsTrigger>
          </TabsList>

          <TabsContent value="weekly">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {challengeTemplates.slice(0, 6).map((challenge, idx) => {
                const difficulty = difficultyConfig[challenge.difficulty];
                
                return (
                  <motion.div
                    key={challenge.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className="text-4xl">{challenge.icon}</div>
                          <Badge className={difficulty.color}>{difficulty.label}</Badge>
                        </div>
                        
                        <h3 className="font-bold text-gray-900 mb-1">{challenge.title}</h3>
                        <p className="text-sm text-gray-500 mb-4">{challenge.description}</p>

                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-amber-500" />
                            <span className="font-semibold text-amber-600">+{challenge.reward_points} pts</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Award className="w-3 h-3" />
                            <span>Badge exclusif</span>
                          </div>
                        </div>

                        <Button 
                          className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                          onClick={() => toast.success('Défi accepté ! 🎯')}
                        >
                          <Zap className="w-4 h-4 mr-2" />
                          Relever le défi
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="personal">
            <PersonalGoals user={user} userChallenges={userChallenges} />
          </TabsContent>

          <TabsContent value="team">
            <TeamChallenges user={user} />
          </TabsContent>

          <TabsContent value="partner">
            <PartnerChallenges user={user} />
          </TabsContent>

          <TabsContent value="all">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {challengeTemplates.map((challenge, idx) => {
                const difficulty = difficultyConfig[challenge.difficulty];
                
                return (
                  <motion.div
                    key={challenge.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.03 }}
                  >
                    <Card className="p-5">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="text-3xl">{challenge.icon}</div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{challenge.title}</h3>
                          <Badge className={`${difficulty.color} text-xs`}>{difficulty.label}</Badge>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-amber-600">+{challenge.reward_points}</p>
                          <p className="text-xs text-gray-500">points</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500">{challenge.description}</p>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="completed">
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Aucun défi complété</h3>
              <p className="text-gray-500">Relevez vos premiers défis pour débloquer des badges !</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}