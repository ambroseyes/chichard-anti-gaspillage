import React from 'react';
import { motion } from 'framer-motion';
import { differenceInDays } from 'date-fns';
import { Trophy, Users, Clock, CheckCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const goalTypeLabels = {
  savings: { label: 'Économies', unit: 'FCFA', icon: '💰' },
  orders: { label: 'Commandes', unit: '', icon: '🛒' },
  waste_avoided: { label: 'Gaspillage évité', unit: 'kg', icon: '🌿' },
  products_saved: { label: 'Produits sauvés', unit: '', icon: '📦' },
  referrals: { label: 'Parrainages', unit: '', icon: '👥' },
};

export default function ChallengeCard({ challenge, userProgress, onJoin, isJoined }) {
  const daysLeft = differenceInDays(new Date(challenge.end_date), new Date());
  const goalConfig = goalTypeLabels[challenge.goal_type] || goalTypeLabels.savings;
  const progress = userProgress ? (userProgress.current_progress / challenge.goal_value) * 100 : 0;
  const isCompleted = userProgress?.is_completed;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
    >
      <Card className={`overflow-hidden ${isCompleted ? 'border-emerald-300 bg-emerald-50/50' : ''}`}>
        {/* Header image or gradient */}
        <div className={`h-24 relative ${
          challenge.image_url ? '' : 'bg-gradient-to-r from-indigo-500 to-purple-600'
        }`}>
          {challenge.image_url && (
            <img 
              src={challenge.image_url} 
              alt="" 
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          
          {/* Badge */}
          <div className="absolute top-3 left-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              challenge.challenge_type === 'weekly' ? 'bg-blue-500 text-white' :
              challenge.challenge_type === 'monthly' ? 'bg-purple-500 text-white' :
              'bg-orange-500 text-white'
            }`}>
              {challenge.challenge_type === 'weekly' ? 'Hebdomadaire' :
               challenge.challenge_type === 'monthly' ? 'Mensuel' : 'Spécial'}
            </span>
          </div>

          {/* Completed badge */}
          {isCompleted && (
            <div className="absolute top-3 right-3 bg-emerald-500 text-white p-2 rounded-full">
              <CheckCircle className="w-5 h-5" />
            </div>
          )}

          {/* Title */}
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="font-bold text-white text-lg">{challenge.title}</h3>
          </div>
        </div>

        <div className="p-4">
          {/* Goal */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-xl">
              {goalConfig.icon}
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">{goalConfig.label}</p>
              <p className="font-bold text-gray-900">
                {challenge.goal_value.toLocaleString()} {goalConfig.unit}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-amber-500">
                <Trophy className="w-4 h-4" />
                <span className="font-semibold">{challenge.reward_points || 100} pts</span>
              </div>
            </div>
          </div>

          {/* Progress (if joined) */}
          {isJoined && (
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Progression</span>
                <span className="font-medium">
                  {userProgress?.current_progress?.toLocaleString() || 0} / {challenge.goal_value.toLocaleString()} {goalConfig.unit}
                </span>
              </div>
              <Progress value={Math.min(progress, 100)} className="h-2" />
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {challenge.participants_count || 0}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {daysLeft > 0 ? `${daysLeft}j restants` : 'Terminé'}
              </span>
            </div>

            {!isJoined && daysLeft > 0 && (
              <Button 
                size="sm" 
                onClick={() => onJoin?.(challenge)}
                className="bg-indigo-500 hover:bg-indigo-600"
              >
                Participer
              </Button>
            )}

            {isCompleted && (
              <span className="text-sm font-medium text-emerald-600">
                ✓ Complété !
              </span>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}