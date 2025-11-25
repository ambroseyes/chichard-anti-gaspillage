import React from 'react';
import { motion } from 'framer-motion';
import { Award, Lock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const allBadges = [
  { id: 'first_purchase', name: 'Premier Pas', icon: '🎯', description: 'Première commande passée', condition: 'orders >= 1' },
  { id: 'eco_starter', name: 'Éco-Débutant', icon: '🌱', description: '1kg de gaspillage évité', condition: 'waste >= 1' },
  { id: 'eco_bronze', name: 'Éco-Bronze', icon: '🥉', description: '5kg de gaspillage évité', condition: 'waste >= 5' },
  { id: 'eco_silver', name: 'Éco-Argent', icon: '🥈', description: '15kg de gaspillage évité', condition: 'waste >= 15' },
  { id: 'eco_gold', name: 'Éco-Or', icon: '🥇', description: '50kg de gaspillage évité', condition: 'waste >= 50' },
  { id: 'saver_5k', name: 'Économiste', icon: '💰', description: '5 000 FCFA économisés', condition: 'savings >= 5000' },
  { id: 'saver_25k', name: 'Super Économiste', icon: '💎', description: '25 000 FCFA économisés', condition: 'savings >= 25000' },
  { id: 'saver_100k', name: 'Maître Économiste', icon: '👑', description: '100 000 FCFA économisés', condition: 'savings >= 100000' },
  { id: 'social_butterfly', name: 'Papillon Social', icon: '🦋', description: '10 posts publiés', condition: 'posts >= 10' },
  { id: 'influencer', name: 'Influenceur', icon: '⭐', description: '100 likes reçus', condition: 'likes >= 100' },
  { id: 'weekly_champion', name: 'Champion Hebdo', icon: '🏆', description: 'Top 3 de la semaine', condition: 'ranking <= 3' },
  { id: 'challenge_master', name: 'Maître des Défis', icon: '🎖️', description: '5 défis complétés', condition: 'challenges >= 5' },
];

export default function BadgeDisplay({ userBadges = [], compact = false }) {
  const earnedBadges = allBadges.filter(b => userBadges.includes(b.id));
  const lockedBadges = allBadges.filter(b => !userBadges.includes(b.id));

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {earnedBadges.slice(0, 6).map((badge) => (
          <TooltipProvider key={badge.id}>
            <Tooltip>
              <TooltipTrigger>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-10 h-10 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-xl flex items-center justify-center text-xl shadow-sm"
                >
                  {badge.icon}
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-semibold">{badge.name}</p>
                <p className="text-xs text-gray-500">{badge.description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
        {earnedBadges.length > 6 && (
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-sm font-medium text-gray-500">
            +{earnedBadges.length - 6}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Earned badges */}
      {earnedBadges.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            Badges obtenus ({earnedBadges.length})
          </h3>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {earnedBadges.map((badge, idx) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-3 text-center"
              >
                <div className="text-3xl mb-2">{badge.icon}</div>
                <p className="text-xs font-medium text-gray-800 truncate">{badge.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Locked badges */}
      <div>
        <h3 className="font-semibold text-gray-500 mb-3 flex items-center gap-2">
          <Lock className="w-4 h-4" />
          À débloquer ({lockedBadges.length})
        </h3>
        <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
          {lockedBadges.map((badge) => (
            <TooltipProvider key={badge.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center opacity-50">
                    <div className="text-3xl mb-2 grayscale">{badge.icon}</div>
                    <p className="text-xs font-medium text-gray-500 truncate">{badge.name}</p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-semibold">{badge.name}</p>
                  <p className="text-xs text-gray-500">{badge.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </div>
    </div>
  );
}