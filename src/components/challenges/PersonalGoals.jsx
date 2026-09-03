import React, { useState } from 'react';
import { api } from '@/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Target, Zap, TrendingUp, Check, Plus,
  Flame, Award
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from 'sonner';

const goalTemplates = [
  { id: 'savings', label: 'Économiser', unit: 'FCFA', icon: TrendingUp, color: 'emerald', defaultValue: 10000 },
  { id: 'orders', label: 'Commander', unit: 'fois', icon: Zap, color: 'blue', defaultValue: 5 },
  { id: 'waste_avoided', label: 'Sauver', unit: 'kg', icon: Flame, color: 'orange', defaultValue: 10 },
];

export default function PersonalGoals({ user, userChallenges = [] }) {
  const [showCreate, setShowCreate] = useState(false);
  const [goalType, setGoalType] = useState('savings');
  const [goalValue, setGoalValue] = useState([10000]);
  const [duration, setDuration] = useState('7');
  const queryClient = useQueryClient();

  const personalChallenges = userChallenges.filter(uc => 
    uc.challenge_id?.startsWith('personal_')
  );

  const createGoalMutation = useMutation({
    mutationFn: async () => {
      const template = goalTemplates.find(t => t.id === goalType);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + parseInt(duration));

      const challenge = await api.entities.Challenge.create({
        title: `${template.label} ${goalValue[0].toLocaleString()} ${template.unit}`,
        description: `Objectif personnel en ${duration} jours`,
        challenge_type: 'personal',
        goal_type: goalType,
        goal_value: goalValue[0],
        reward_points: Math.round(goalValue[0] / 100),
        start_date: new Date().toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        is_active: true,
        participants_count: 1
      });

      await api.entities.UserChallenge.create({
        user_email: user.email,
        challenge_id: challenge.id,
        current_progress: 0,
        is_completed: false
      });

      return challenge;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      queryClient.invalidateQueries({ queryKey: ['user-challenges'] });
      setShowCreate(false);
      toast.success('Objectif créé ! Bonne chance 💪');
    }
  });

  const selectedTemplate = goalTemplates.find(t => t.id === goalType);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-emerald-500" />
          <h3 className="font-semibold text-lg">Mes Objectifs</h3>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Nouvel objectif
        </Button>
      </div>

      {personalChallenges.length === 0 ? (
        <Card className="p-8 text-center bg-gradient-to-br from-emerald-50 to-teal-50">
          <Target className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
          <h4 className="font-semibold text-gray-900 mb-1">Fixez-vous un objectif</h4>
          <p className="text-sm text-gray-500 mb-4">
            Créez des défis personnalisés selon vos ambitions
          </p>
          <Button onClick={() => setShowCreate(true)} className="bg-emerald-500 hover:bg-emerald-600">
            <Target className="w-4 h-4 mr-2" />
            Créer un objectif
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {personalChallenges.map((uc) => {
            const progress = (uc.current_progress / 100) * 100;
            return (
              <Card key={uc.id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">{uc.challenge_id}</h4>
                  {uc.is_completed ? (
                    <Badge className="bg-emerald-100 text-emerald-700">
                      <Check className="w-3 h-3 mr-1" />
                      Terminé
                    </Badge>
                  ) : (
                    <Badge variant="secondary">{Math.round(progress)}%</Badge>
                  )}
                </div>
                <Progress value={progress} className="h-2" />
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un objectif personnel</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Type d'objectif</label>
              <div className="grid grid-cols-3 gap-3">
                {goalTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => {
                      setGoalType(template.id);
                      setGoalValue([template.defaultValue]);
                    }}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      goalType === template.id
                        ? `border-${template.color}-500 bg-${template.color}-50`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <template.icon className={`w-6 h-6 mx-auto mb-2 text-${template.color}-500`} />
                    <p className="text-sm font-medium">{template.label}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Objectif: {goalValue[0].toLocaleString()} {selectedTemplate?.unit}
              </label>
              <Slider
                value={goalValue}
                onValueChange={setGoalValue}
                max={goalType === 'savings' ? 100000 : goalType === 'orders' ? 20 : 50}
                min={goalType === 'savings' ? 5000 : 1}
                step={goalType === 'savings' ? 5000 : 1}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Durée</label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 jours</SelectItem>
                  <SelectItem value="7">7 jours</SelectItem>
                  <SelectItem value="14">14 jours</SelectItem>
                  <SelectItem value="30">30 jours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card className="p-4 bg-amber-50 border-amber-200">
              <div className="flex items-center gap-2 text-amber-700">
                <Award className="w-5 h-5" />
                <span className="font-medium">
                  Récompense: +{Math.round(goalValue[0] / 100)} points
                </span>
              </div>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1">
                Annuler
              </Button>
              <Button 
                onClick={() => createGoalMutation.mutate()}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600"
              >
                Créer l'objectif
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}