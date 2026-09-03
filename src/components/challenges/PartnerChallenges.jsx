import React from 'react';
import { api } from '@/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Store, Gift, Percent, Clock, Users } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';

export default function PartnerChallenges({ user }) {
  const queryClient = useQueryClient();

  const { data: partnerChallenges = [] } = useQuery({
    queryKey: ['partner-challenges'],
    queryFn: () => api.entities.Challenge.filter({ challenge_type: 'partner' }),
  });

  const { data: userChallenges = [] } = useQuery({
    queryKey: ['user-challenges', user?.email],
    queryFn: () => api.entities.UserChallenge.filter({ user_email: user?.email }),
    enabled: !!user,
  });

  const joinMutation = useMutation({
    mutationFn: async (challenge) => {
      await api.entities.UserChallenge.create({
        user_email: user.email,
        challenge_id: challenge.id,
        current_progress: 0,
        is_completed: false
      });

      await api.entities.Challenge.update(challenge.id, {
        participants_count: (challenge.participants_count || 0) + 1
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-challenges'] });
      queryClient.invalidateQueries({ queryKey: ['user-challenges'] });
      toast.success('Vous participez au défi !');
    }
  });

  const isJoined = (challengeId) => userChallenges.some(uc => uc.challenge_id === challengeId);

  // Sample partner challenges if none exist
  const displayChallenges = partnerChallenges.length > 0 ? partnerChallenges : [
    {
      id: 'sample1',
      title: 'Super Marché Express',
      description: 'Achetez 3 produits et recevez -20% sur votre prochaine commande',
      goal_value: 3,
      reward_points: 150,
      participants_count: 45,
      store_name: 'Super Marché Express',
      end_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'sample2',
      title: 'Boulangerie du Coin',
      description: 'Sauvez 5 baguettes cette semaine et gagnez une viennoiserie gratuite',
      goal_value: 5,
      reward_points: 100,
      participants_count: 28,
      store_name: 'Boulangerie du Coin',
      end_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Store className="w-5 h-5 text-purple-500" />
        <h3 className="font-semibold text-lg">Défis Partenaires</h3>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {displayChallenges.map((challenge) => {
          const daysLeft = Math.ceil((new Date(challenge.end_date) - new Date()) / (1000 * 60 * 60 * 24));
          const joined = isJoined(challenge.id);

          return (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-5 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Store className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{challenge.title}</h4>
                    <p className="text-sm text-gray-600">{challenge.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-4 text-sm">
                  <span className="flex items-center gap-1 text-gray-500">
                    <Clock className="w-4 h-4" />
                    {daysLeft}j restants
                  </span>
                  <span className="flex items-center gap-1 text-gray-500">
                    <Users className="w-4 h-4" />
                    {challenge.participants_count} participants
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-purple-100 text-purple-700">
                      <Gift className="w-3 h-3 mr-1" />
                      +{challenge.reward_points} pts
                    </Badge>
                    <Badge className="bg-amber-100 text-amber-700">
                      <Percent className="w-3 h-3 mr-1" />
                      Réduction
                    </Badge>
                  </div>
                  
                  <Button
                    size="sm"
                    disabled={joined}
                    onClick={() => joinMutation.mutate(challenge)}
                    className={joined ? 'bg-gray-300' : 'bg-purple-500 hover:bg-purple-600'}
                  >
                    {joined ? 'Inscrit' : 'Participer'}
                  </Button>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}