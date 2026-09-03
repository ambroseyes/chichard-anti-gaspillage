import React, { useState } from 'react';
import { api } from '@/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Flame, Plus, Edit, Trash2, Users, Target, Loader2, BarChart3
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from 'sonner';

const goalTypes = [
  { id: 'purchases', label: 'Nombre d\'achats', unit: 'achats' },
  { id: 'amount', label: 'Montant dépensé', unit: 'FCFA' },
  { id: 'products', label: 'Produits sauvés', unit: 'produits' },
  { id: 'visits', label: 'Visites en magasin', unit: 'visites' },
];

const rewardTypes = [
  { id: 'discount', label: 'Réduction', unit: '%' },
  { id: 'points', label: 'Points bonus', unit: 'pts' },
  { id: 'free_product', label: 'Produit gratuit', unit: '' },
  { id: 'badge', label: 'Badge exclusif', unit: '' },
];

export default function PartnerChallengeManager({ user }) {
  const [showForm, setShowForm] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState(null);
  const [showStats, setShowStats] = useState(null);
  const queryClient = useQueryClient();

  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ['partner-challenges', user?.store_id],
    queryFn: () => api.entities.PartnerChallenge.filter({ store_id: user?.store_id }),
    enabled: !!user?.store_id,
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.entities.PartnerChallenge.create({
      ...data,
      store_id: user.store_id,
      store_name: user.store_name || user.full_name,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-challenges'] });
      setShowForm(false);
      toast.success('Défi créé avec succès !');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.PartnerChallenge.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-challenges'] });
      setShowForm(false);
      setEditingChallenge(null);
      toast.success('Défi mis à jour');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.entities.PartnerChallenge.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-challenges'] });
      toast.success('Défi supprimé');
    }
  });

  const activeChallenges = challenges.filter(c => c.is_active && new Date(c.end_date) >= new Date());
  const pastChallenges = challenges.filter(c => !c.is_active || new Date(c.end_date) < new Date());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Flame className="w-6 h-6 text-orange-500" />
            Défis Partenaire
          </h2>
          <p className="text-sm text-gray-500">Créez des défis pour fidéliser vos clients</p>
        </div>
        <Button onClick={() => { setEditingChallenge(null); setShowForm(true); }} className="bg-orange-500 hover:bg-orange-600">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau défi
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-orange-600">{activeChallenges.length}</p>
          <p className="text-sm text-gray-500">Défis actifs</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">
            {challenges.reduce((sum, c) => sum + (c.participants_count || 0), 0)}
          </p>
          <p className="text-sm text-gray-500">Participants totaux</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">
            {challenges.reduce((sum, c) => sum + (c.completions_count || 0), 0)}
          </p>
          <p className="text-sm text-gray-500">Défis complétés</p>
        </Card>
      </div>

      {/* Active Challenges */}
      <div>
        <h3 className="font-semibold mb-3">Défis en cours</h3>
        {activeChallenges.length === 0 ? (
          <Card className="p-8 text-center">
            <Flame className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucun défi actif</p>
            <Button variant="outline" className="mt-3" onClick={() => setShowForm(true)}>
              Créer votre premier défi
            </Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {activeChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                onEdit={() => { setEditingChallenge(challenge); setShowForm(true); }}
                onDelete={() => deleteMutation.mutate(challenge.id)}
                onViewStats={() => setShowStats(challenge)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Past Challenges */}
      {pastChallenges.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3 text-gray-500">Défis terminés</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {pastChallenges.slice(0, 4).map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                isPast
                onViewStats={() => setShowStats(challenge)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Create/Edit Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingChallenge ? 'Modifier le défi' : 'Créer un défi'}</DialogTitle>
          </DialogHeader>
          <ChallengeForm
            challenge={editingChallenge}
            onSubmit={(data) => {
              if (editingChallenge) {
                updateMutation.mutate({ id: editingChallenge.id, data });
              } else {
                createMutation.mutate(data);
              }
            }}
            loading={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Stats Dialog */}
      <Dialog open={!!showStats} onOpenChange={() => setShowStats(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Statistiques du défi</DialogTitle>
          </DialogHeader>
          {showStats && <ChallengeStats challenge={showStats} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ChallengeCard({ challenge, onEdit, onDelete, onViewStats, isPast }) {
  const daysLeft = Math.ceil((new Date(challenge.end_date) - new Date()) / 86400000);
  const goalType = goalTypes.find(g => g.id === challenge.goal_type);
  const rewardType = rewardTypes.find(r => r.id === challenge.reward_type);

  return (
    <Card className={`p-4 ${isPast ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold">{challenge.title}</h4>
          <p className="text-sm text-gray-500">{challenge.description}</p>
        </div>
        {!isPast && (
          <Badge className={daysLeft <= 3 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}>
            {daysLeft}j restants
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-xs text-gray-500">Objectif</p>
          <p className="font-semibold">{challenge.goal_value} {goalType?.unit}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-xs text-gray-500">Récompense</p>
          <p className="font-semibold">{challenge.reward_value} {rewardType?.unit}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
        <span><Users className="w-4 h-4 inline mr-1" />{challenge.participants_count || 0}</span>
        <span><Target className="w-4 h-4 inline mr-1" />{challenge.completions_count || 0} complétés</span>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onViewStats} className="flex-1">
          <BarChart3 className="w-4 h-4 mr-1" />
          Stats
        </Button>
        {!isPast && onEdit && (
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit className="w-4 h-4" />
          </Button>
        )}
        {!isPast && onDelete && (
          <Button variant="outline" size="sm" onClick={onDelete} className="text-red-500 hover:text-red-600">
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </Card>
  );
}

function ChallengeForm({ challenge, onSubmit, loading }) {
  const [formData, setFormData] = useState({
    title: challenge?.title || '',
    description: challenge?.description || '',
    goal_type: challenge?.goal_type || 'purchases',
    goal_value: challenge?.goal_value || 5,
    reward_type: challenge?.reward_type || 'points',
    reward_value: challenge?.reward_value || 100,
    reward_description: challenge?.reward_description || '',
    start_date: challenge?.start_date || new Date().toISOString().split('T')[0],
    end_date: challenge?.end_date || '',
    is_active: challenge?.is_active !== false,
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
      <div>
        <Label>Titre du défi</Label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Ex: Week-end Anti-Gaspi"
          required
        />
      </div>

      <div>
        <Label>Description</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Décrivez le défi..."
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Type d'objectif</Label>
          <Select value={formData.goal_type} onValueChange={(v) => setFormData({ ...formData, goal_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {goalTypes.map((g) => (
                <SelectItem key={g.id} value={g.id}>{g.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Valeur objectif</Label>
          <Input
            type="number"
            value={formData.goal_value}
            onChange={(e) => setFormData({ ...formData, goal_value: Number(e.target.value) })}
            min="1"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Type de récompense</Label>
          <Select value={formData.reward_type} onValueChange={(v) => setFormData({ ...formData, reward_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {rewardTypes.map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Valeur récompense</Label>
          <Input
            type="number"
            value={formData.reward_value}
            onChange={(e) => setFormData({ ...formData, reward_value: Number(e.target.value) })}
            min="1"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Date de début</Label>
          <Input
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
          />
        </div>
        <div>
          <Label>Date de fin</Label>
          <Input
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            required
          />
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600">
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        {challenge ? 'Mettre à jour' : 'Créer le défi'}
      </Button>
    </form>
  );
}

function ChallengeStats({ challenge }) {
  const completionRate = challenge.participants_count > 0
    ? Math.round((challenge.completions_count / challenge.participants_count) * 100)
    : 0;

  return (
    <div className="space-y-4 mt-4">
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold">{challenge.participants_count || 0}</p>
          <p className="text-sm text-gray-500">Participants</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold">{challenge.completions_count || 0}</p>
          <p className="text-sm text-gray-500">Complétés</p>
        </Card>
      </div>

      <div>
        <div className="flex justify-between text-sm mb-1">
          <span>Taux de complétion</span>
          <span className="font-semibold">{completionRate}%</span>
        </div>
        <Progress value={completionRate} className="h-2" />
      </div>

      <Card className="p-4">
        <p className="text-sm text-gray-500">Revenus générés estimés</p>
        <p className="text-xl font-bold text-emerald-600">
          {(challenge.total_revenue_generated || challenge.completions_count * 5000).toLocaleString()} FCFA
        </p>
      </Card>
    </div>
  );
}