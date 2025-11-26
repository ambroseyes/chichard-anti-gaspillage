import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Users, Trophy, Plus, Target, Crown, UserPlus,
  Check, ChevronRight, Zap
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from 'sonner';

export default function TeamChallenges({ user }) {
  const [showCreate, setShowCreate] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const queryClient = useQueryClient();

  const { data: teamChallenges = [] } = useQuery({
    queryKey: ['team-challenges'],
    queryFn: () => base44.entities.Challenge.filter({ challenge_type: 'team' }),
  });

  const createTeamMutation = useMutation({
    mutationFn: async (data) => {
      const challenge = await base44.entities.Challenge.create({
        title: `Défi Équipe: ${data.teamName}`,
        description: 'Défi collaboratif entre amis',
        challenge_type: 'team',
        goal_type: 'savings',
        goal_value: 50000,
        reward_points: 500,
        reward_badge: 'team_champion',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        is_active: true,
        participants_count: 1
      });

      await base44.entities.UserChallenge.create({
        user_email: user.email,
        challenge_id: challenge.id,
        current_progress: 0,
        is_completed: false
      });

      return challenge;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-challenges'] });
      setShowCreate(false);
      setTeamName('');
      toast.success('Équipe créée ! Invitez vos amis');
    }
  });

  const inviteMutation = useMutation({
    mutationFn: async ({ challengeId, email }) => {
      await base44.integrations.Core.SendEmail({
        to: email,
        subject: `${user.full_name} vous invite à un défi CHICHARD !`,
        body: `Rejoignez le défi équipe sur CHICHARD et économisez ensemble ! Connectez-vous pour participer.`
      });
    },
    onSuccess: () => {
      setInviteEmail('');
      toast.success('Invitation envoyée !');
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-500" />
          <h3 className="font-semibold text-lg">Défis Équipe</h3>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Créer une équipe
        </Button>
      </div>

      {teamChallenges.length === 0 ? (
        <Card className="p-8 text-center bg-gradient-to-br from-indigo-50 to-purple-50">
          <Users className="w-12 h-12 text-indigo-300 mx-auto mb-3" />
          <h4 className="font-semibold text-gray-900 mb-1">Aucun défi équipe</h4>
          <p className="text-sm text-gray-500 mb-4">
            Créez une équipe et invitez vos amis pour économiser ensemble !
          </p>
          <Button onClick={() => setShowCreate(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Créer mon équipe
          </Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {teamChallenges.map((challenge) => (
            <Card key={challenge.id} className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-gray-900">{challenge.title}</h4>
                  <p className="text-sm text-gray-500">{challenge.participants_count} membres</p>
                </div>
                <Badge className="bg-indigo-100 text-indigo-700">
                  <Users className="w-3 h-3 mr-1" />
                  Équipe
                </Badge>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Objectif: {challenge.goal_value?.toLocaleString()} FCFA</span>
                  <span>0%</span>
                </div>
                <Progress value={0} className="h-2" />
              </div>

              <div className="flex items-center gap-2 mb-4">
                {[1, 2, 3].map((i) => (
                  <Avatar key={i} className="w-8 h-8 border-2 border-white -ml-2 first:ml-0">
                    <AvatarFallback className="bg-indigo-100 text-indigo-600 text-xs">
                      {i}
                    </AvatarFallback>
                  </Avatar>
                ))}
                <Button size="sm" variant="outline" className="ml-auto">
                  <UserPlus className="w-4 h-4 mr-1" />
                  Inviter
                </Button>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Récompense:</span>
                <Badge className="bg-amber-100 text-amber-700">
                  <Trophy className="w-3 h-3 mr-1" />
                  +{challenge.reward_points} pts/membre
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer une équipe</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Input
              placeholder="Nom de l'équipe"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
            />
            <div className="bg-indigo-50 rounded-xl p-4">
              <h4 className="font-medium text-indigo-900 mb-2">Objectif du défi</h4>
              <p className="text-sm text-indigo-700">
                Économisez 50 000 FCFA en équipe cette semaine et gagnez 500 points bonus chacun !
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1">
                Annuler
              </Button>
              <Button 
                onClick={() => createTeamMutation.mutate({ teamName })}
                disabled={!teamName}
                className="flex-1 bg-indigo-500 hover:bg-indigo-600"
              >
                Créer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}