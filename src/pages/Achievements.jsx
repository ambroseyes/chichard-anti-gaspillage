import React from 'react';
import { api } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Trophy, Star, CheckCircle, 
  ChefHat, Users, Flame, ShoppingBag, Medal, Crown
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';

// Define Achievements
const achievementsList = [
  {
    id: 'first_step',
    title: 'Premier Pas',
    description: 'Complétez votre première commande',
    icon: ShoppingBag,
    target: 1,
    type: 'orders',
    points: 100
  },
  {
    id: 'chef_apprentice',
    title: 'Apprenti Chef',
    description: 'Partagez 5 recettes avec la communauté',
    icon: ChefHat,
    target: 5,
    type: 'recipes',
    points: 500
  },
  {
    id: 'challenge_accepted',
    title: 'Défi Relevé',
    description: 'Complétez 10 défis hebdomadaires',
    icon: Flame,
    target: 10,
    type: 'challenges',
    points: 1000
  },
  {
    id: 'social_star',
    title: 'Star Sociale',
    description: 'Recevez 50 likes sur vos posts',
    icon: Users,
    target: 50,
    type: 'likes',
    points: 750
  },
  {
    id: 'eco_warrior',
    title: 'Guerrier Éco',
    description: 'Sauvez 50kg de produits',
    icon: LeafIcon,
    target: 50,
    type: 'waste',
    points: 2000
  }
];

function LeafIcon(props) {
    return (
        <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        >
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
        </svg>
    )
}

export default function Achievements() {
  const { user, updateProfile } = useAuth();

  // Fetch detailed stats to calculate progress
  const { data: stats } = useQuery({
    queryKey: ['user-stats', user?.email],
    queryFn: async () => {
        if (!user) return null;
        
        const recipes = await api.entities.Recipe.count({ author_email: user.email });
        const challenges = await api.entities.UserChallenge.count({ user_email: user.email, is_completed: true });
        const posts = await api.entities.SocialPost.filter({ author_email: user.email });
        const totalLikes = posts.reduce((sum, post) => sum + (post.likes_count || 0), 0);
        const orders = await api.entities.Order.count({ user_email: user.email });

        return {
            recipes,
            challenges,
            likes: totalLikes,
            orders,
            waste: user.waste_avoided_kg || 0
        };
    },
    enabled: !!user
  });

  const handleEquipBadge = async (badgeId) => {
    try {
        await updateProfile({ featured_badge: badgeId });
        toast.success('Badge équipé sur votre profil !');
    } catch (error) {
        toast.error('Erreur lors de la mise à jour');
    }
  };

  const getProgress = (achievement) => {
    if (!stats) return 0;
    const current = stats[achievement.type] || 0;
    return Math.min(100, (current / achievement.target) * 100);
  };

  const getCurrentValue = (achievement) => {
    if (!stats) return 0;
    return stats[achievement.type] || 0;
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white pb-12 pt-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Medal className="w-16 h-16 mx-auto mb-4 text-amber-200" />
          <h1 className="text-3xl font-bold mb-2">Salle des Trophées</h1>
          <p className="text-amber-100">Vos exploits et récompenses</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-8">
        <Tabs defaultValue="badges" className="space-y-6">
            <div className="flex justify-center">
                <TabsList className="bg-white shadow-md p-1 rounded-xl">
                    <TabsTrigger value="badges" className="px-8">Badges</TabsTrigger>
                    <TabsTrigger value="achievements" className="px-8">Accomplissements</TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="badges">
                <Card className="p-6">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold mb-2">Vos Badges</h2>
                        <p className="text-gray-500">Cliquez sur un badge débloqué pour l'afficher sur votre profil</p>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                         {/* We reuse existing badge logic but add interaction */}
                         {/* This is a custom view of badges for selection */}
                         <BadgeSelector 
                            user={user} 
                            onEquip={handleEquipBadge} 
                         />
                    </div>
                </Card>
            </TabsContent>

            <TabsContent value="achievements">
                <div className="grid gap-4">
                    {achievementsList.map((achievement) => {
                        const progress = getProgress(achievement);
                        const current = getCurrentValue(achievement);
                        const isUnlocked = progress >= 100;
                        const Icon = achievement.icon;

                        return (
                            <motion.div
                                key={achievement.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <Card className={`p-4 ${isUnlocked ? 'bg-gradient-to-r from-amber-50 to-white border-amber-200' : ''}`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-full ${isUnlocked ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400'}`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className={`font-bold ${isUnlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                                                    {achievement.title}
                                                </h3>
                                                {isUnlocked ? (
                                                    <Badge className="bg-amber-500">Complété</Badge>
                                                ) : (
                                                    <span className="text-xs text-gray-400">{current} / {achievement.target}</span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                                            <Progress value={progress} className="h-2" />
                                        </div>
                                        {isUnlocked && (
                                            <div className="text-center min-w-[60px]">
                                                <div className="text-xs font-bold text-amber-600">+{achievement.points}</div>
                                                <div className="text-[10px] text-gray-500">Points</div>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Helper component to render badges with selection logic
// Importing the list from CommunityBadges might be hard if not exported, so I'll redefine or just use the component if possible.
// To keep it simple and robust, I'll define the badges here or pass them.
// I'll assume I can import the component but I need custom click logic. 
// Actually, let's recreate the badge list for selection to be safe and clean.

import { Lightbulb, Heart } from 'lucide-react'; // Ensure imports
import { useAuth } from '@/lib/AuthContext';

const badgesData = [
  { id: 'top_advisor', name: 'Conseiller Expert', icon: Lightbulb, color: 'from-amber-400 to-orange-500' },
  { id: 'recipe_master', name: 'Chef Anti-Gaspi', icon: ChefHat, color: 'from-red-400 to-pink-500' },
  { id: 'community_star', name: 'Star Communauté', icon: Star, color: 'from-purple-400 to-indigo-500' },
  { id: 'helper', name: 'Main Tendue', icon: Heart, color: 'from-pink-400 to-red-500' },
  { id: 'influencer', name: 'Influenceur Vert', icon: Users, color: 'from-emerald-400 to-teal-500' },
  { id: 'pioneer', name: 'Pionnier', icon: Flame, color: 'from-orange-400 to-red-500' },
  { id: 'champion', name: 'Champion Hebdo', icon: Trophy, color: 'from-yellow-400 to-amber-500' },
  { id: 'diamond', name: 'Diamant', icon: Crown, color: 'from-cyan-400 to-blue-500' },
];

function BadgeSelector({ user, onEquip }) {
    const userBadges = user.community_badges || [];
    const featured = user.featured_badge;

    return (
        <>
            {badgesData.map((badge) => {
                const isEarned = userBadges.includes(badge.id);
                const isFeatured = featured === badge.id;
                const Icon = badge.icon;

                return (
                    <div key={badge.id} className="relative group">
                        <div 
                            className={`p-4 rounded-xl flex flex-col items-center gap-2 text-center transition-all ${
                                isEarned 
                                    ? `bg-gradient-to-br ${badge.color} text-white shadow-md cursor-pointer hover:scale-105`
                                    : 'bg-gray-100 text-gray-400 opacity-60 grayscale'
                            } ${isFeatured ? 'ring-4 ring-offset-2 ring-amber-400' : ''}`}
                            onClick={() => isEarned && onEquip(badge.id)}
                        >
                            <Icon className="w-8 h-8" />
                            <span className="text-xs font-bold leading-tight">{badge.name}</span>
                            
                            {isEarned && !isFeatured && (
                                <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-white text-xs font-bold">Équiper</span>
                                </div>
                            )}
                        </div>
                        {isFeatured && (
                            <div className="absolute -top-2 -right-2 bg-amber-400 text-white p-1 rounded-full shadow-sm z-10">
                                <CheckCircle className="w-4 h-4" />
                            </div>
                        )}
                    </div>
                );
            })}
        </>
    );
}