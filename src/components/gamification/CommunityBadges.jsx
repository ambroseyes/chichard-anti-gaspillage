import React from 'react';
import { motion } from 'framer-motion';
import { 
  Award, Star, Heart, ChefHat, Lightbulb,
  Users, Trophy, Flame, Crown, Sparkles
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const communityBadges = [
  { 
    id: 'top_advisor', 
    name: 'Conseiller Expert', 
    icon: Lightbulb, 
    color: 'from-amber-400 to-orange-500',
    description: 'Top 10 des astuces les plus appréciées',
    requirement: '10+ likes sur vos astuces'
  },
  { 
    id: 'recipe_master', 
    name: 'Chef Anti-Gaspi', 
    icon: ChefHat, 
    color: 'from-red-400 to-pink-500',
    description: 'Recettes très bien notées',
    requirement: '5 recettes avec 4+ étoiles'
  },
  { 
    id: 'community_star', 
    name: 'Star Communauté', 
    icon: Star, 
    color: 'from-purple-400 to-indigo-500',
    description: 'Contributeur actif apprécié',
    requirement: '50+ interactions reçues'
  },
  { 
    id: 'helper', 
    name: 'Main Tendue', 
    icon: Heart, 
    color: 'from-pink-400 to-red-500',
    description: 'Aide les nouveaux membres',
    requirement: 'Répondu à 20+ questions'
  },
  { 
    id: 'influencer', 
    name: 'Influenceur Vert', 
    icon: Users, 
    color: 'from-emerald-400 to-teal-500',
    description: 'Grande communauté de followers',
    requirement: '100+ abonnés'
  },
  { 
    id: 'pioneer', 
    name: 'Pionnier', 
    icon: Flame, 
    color: 'from-orange-400 to-red-500',
    description: 'Parmi les premiers utilisateurs',
    requirement: 'Inscrit dans les 1000 premiers'
  },
  { 
    id: 'champion', 
    name: 'Champion Hebdo', 
    icon: Trophy, 
    color: 'from-yellow-400 to-amber-500',
    description: '#1 du classement hebdomadaire',
    requirement: 'Classé #1 au moins une fois'
  },
  { 
    id: 'diamond', 
    name: 'Diamant', 
    icon: Crown, 
    color: 'from-cyan-400 to-blue-500',
    description: 'Membre élite CHICHARD+',
    requirement: 'Niveau Diamant atteint'
  },
];

export default function CommunityBadges({ userBadges = [], showAll = false }) {
  const earnedBadges = communityBadges.filter(b => userBadges.includes(b.id));
  const lockedBadges = communityBadges.filter(b => !userBadges.includes(b.id));
  
  const displayBadges = showAll ? communityBadges : earnedBadges;

  if (!showAll && earnedBadges.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Award className="w-5 h-5 text-amber-500" />
        <h3 className="font-semibold">Badges Communautaires</h3>
        {!showAll && (
          <Badge variant="secondary">{earnedBadges.length}/{communityBadges.length}</Badge>
        )}
      </div>

      <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
        <TooltipProvider>
          {displayBadges.map((badge) => {
            const isEarned = userBadges.includes(badge.id);
            const Icon = badge.icon;
            
            return (
              <Tooltip key={badge.id}>
                <TooltipTrigger>
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.1 }}
                    className={`relative p-3 rounded-xl ${
                      isEarned 
                        ? `bg-gradient-to-br ${badge.color} shadow-lg`
                        : 'bg-gray-100 opacity-50'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mx-auto ${isEarned ? 'text-white' : 'text-gray-400'}`} />
                    {isEarned && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow"
                      >
                        <Sparkles className="w-3 h-3 text-amber-500" />
                      </motion.div>
                    )}
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <div className="text-center">
                    <p className="font-semibold">{badge.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{badge.description}</p>
                    {!isEarned && (
                      <p className="text-xs text-amber-600 mt-2 font-medium">
                        🔓 {badge.requirement}
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </div>

      {showAll && lockedBadges.length > 0 && (
        <Card className="p-4 bg-gray-50 border-dashed">
          <p className="text-sm text-gray-500 text-center">
            {lockedBadges.length} badges à débloquer - Continuez à contribuer !
          </p>
        </Card>
      )}
    </div>
  );
}