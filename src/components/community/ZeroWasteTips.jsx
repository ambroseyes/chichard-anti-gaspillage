import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Lightbulb, Heart, Bookmark, Plus, Leaf, ShoppingBag,
  ChefHat, Recycle, Trash2, MoreHorizontal
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';

const categoryConfig = {
  conservation: { label: 'Conservation', icon: Leaf, color: 'bg-green-100 text-green-700' },
  cuisine: { label: 'Cuisine', icon: ChefHat, color: 'bg-orange-100 text-orange-700' },
  achat: { label: 'Achat malin', icon: ShoppingBag, color: 'bg-blue-100 text-blue-700' },
  compost: { label: 'Compost', icon: Recycle, color: 'bg-amber-100 text-amber-700' },
  reutilisation: { label: 'Réutilisation', icon: Recycle, color: 'bg-purple-100 text-purple-700' },
  autre: { label: 'Autre', icon: Lightbulb, color: 'bg-gray-100 text-gray-700' }
};

export default function ZeroWasteTips({ user }) {
  const [showCreate, setShowCreate] = useState(false);
  const [newTip, setNewTip] = useState({ title: '', content: '', category: 'autre' });
  const queryClient = useQueryClient();

  const { data: tips = [] } = useQuery({
    queryKey: ['zero-waste-tips'],
    queryFn: () => base44.entities.ZeroWasteTip.list('-created_date', 50),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ZeroWasteTip.create({
      ...data,
      author_email: user.email,
      author_name: user.full_name
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zero-waste-tips'] });
      setShowCreate(false);
      setNewTip({ title: '', content: '', category: 'autre' });
      toast.success('Astuce partagée !');
    }
  });

  const likeMutation = useMutation({
    mutationFn: async (tip) => {
      const liked = tip.liked_by?.includes(user.email);
      await base44.entities.ZeroWasteTip.update(tip.id, {
        likes_count: (tip.likes_count || 0) + (liked ? -1 : 1),
        liked_by: liked 
          ? tip.liked_by.filter(e => e !== user.email)
          : [...(tip.liked_by || []), user.email]
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['zero-waste-tips'] })
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          Astuces Zéro Déchet
        </h3>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Partager
        </Button>
      </div>

      <div className="grid gap-4">
        {tips.map((tip) => {
          const cat = categoryConfig[tip.category] || categoryConfig.autre;
          const CatIcon = cat.icon;
          const isLiked = tip.liked_by?.includes(user?.email);

          return (
            <motion.div
              key={tip.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${cat.color}`}>
                    <CatIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{tip.title}</h4>
                        <p className="text-xs text-gray-500">par {tip.author_name}</p>
                      </div>
                      <Badge className={cat.color}>{cat.label}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{tip.content}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <button
                        onClick={() => user && likeMutation.mutate(tip)}
                        className={`flex items-center gap-1 text-sm ${isLiked ? 'text-red-500' : 'text-gray-500'}`}
                      >
                        <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500' : ''}`} />
                        {tip.likes_count || 0}
                      </button>
                      <button className="flex items-center gap-1 text-sm text-gray-500">
                        <Bookmark className="w-4 h-4" />
                        Sauvegarder
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Partager une astuce zéro déchet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Input
              placeholder="Titre de l'astuce"
              value={newTip.title}
              onChange={(e) => setNewTip({ ...newTip, title: e.target.value })}
            />
            <Select
              value={newTip.category}
              onValueChange={(v) => setNewTip({ ...newTip, category: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(categoryConfig).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Décrivez votre astuce..."
              value={newTip.content}
              onChange={(e) => setNewTip({ ...newTip, content: e.target.value })}
              rows={4}
            />
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1">
                Annuler
              </Button>
              <Button 
                onClick={() => createMutation.mutate(newTip)}
                disabled={!newTip.title || !newTip.content}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600"
              >
                Publier
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}