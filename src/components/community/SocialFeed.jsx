import React, { useState } from 'react';
import { api } from '@/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Heart, MessageCircle, Share2, Award, Leaf, TrendingUp,
  MoreHorizontal
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';

const ecoLevelConfig = {
  debutant: { icon: '🌱', color: 'bg-gray-100 text-gray-600' },
  eco_citoyen: { icon: '🌿', color: 'bg-emerald-100 text-emerald-600' },
  eco_hero: { icon: '🌳', color: 'bg-blue-100 text-blue-600' },
  eco_champion: { icon: '🌲', color: 'bg-purple-100 text-purple-600' },
  eco_legend: { icon: '🌍', color: 'bg-orange-100 text-orange-600' },
};

const postTypeConfig = {
  savings: { icon: TrendingUp, color: 'text-emerald-500', label: 'Économie' },
  recipe: { icon: '🍳', color: 'text-orange-500', label: 'Recette' },
  tip: { icon: '💡', color: 'text-yellow-500', label: 'Astuce' },
  challenge: { icon: '🏆', color: 'text-purple-500', label: 'Défi' },
  deal: { icon: '🔥', color: 'text-red-500', label: 'Bon plan' },
  achievement: { icon: Award, color: 'text-indigo-500', label: 'Badge' },
};

export default function SocialFeed({ user, compact = false }) {
  const queryClient = useQueryClient();
  const [expandedPost, setExpandedPost] = useState(null);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['social-posts'],
    queryFn: () => api.entities.SocialPost.list('-created_date', 50),
  });

  const likeMutation = useMutation({
    mutationFn: async (post) => {
      const isLiked = post.liked_by?.includes(user?.email);
      const newLikedBy = isLiked
        ? post.liked_by.filter(e => e !== user.email)
        : [...(post.liked_by || []), user.email];
      
      await api.entities.SocialPost.update(post.id, {
        liked_by: newLikedBy,
        likes_count: newLikedBy.length
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['social-posts'] }),
  });

  const handleLike = (post) => {
    if (!user) {
      toast.error('Connectez-vous pour aimer');
      return;
    }
    likeMutation.mutate(post);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="flex gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/4" />
              </div>
            </div>
            <div className="h-20 bg-gray-200 rounded" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {posts.map((post) => {
          const typeConfig = postTypeConfig[post.post_type] || postTypeConfig.savings;
          const levelConfig = ecoLevelConfig[post.author_eco_level] || ecoLevelConfig.debutant;
          const isLiked = post.liked_by?.includes(user?.email);
          const TypeIcon = typeof typeConfig.icon === 'string' ? null : typeConfig.icon;

          return (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Card className="overflow-hidden">
                {/* Header */}
                <div className="p-4 pb-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={post.author_avatar} />
                      <AvatarFallback className="bg-emerald-100 text-emerald-600">
                        {post.author_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{post.author_name}</span>
                        <Badge variant="secondary" className={`text-xs ${levelConfig.color}`}>
                          {levelConfig.icon}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>
                          {formatDistanceToNow(new Date(post.created_date), { 
                            addSuffix: true, 
                            locale: fr 
                          })}
                        </span>
                        <span>•</span>
                        <span className={typeConfig.color}>
                          {TypeIcon ? <TypeIcon className="w-3 h-3 inline mr-1" /> : typeConfig.icon}
                          {typeConfig.label}
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-gray-400">
                      <MoreHorizontal className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                {/* Content */}
                <div className="px-4 pb-3">
                  <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
                  
                  {/* Stats cards for savings posts */}
                  {post.post_type === 'savings' && (post.savings_amount || post.waste_avoided_kg) && (
                    <div className="flex gap-3 mt-3">
                      {post.savings_amount > 0 && (
                        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg">
                          <TrendingUp className="w-4 h-4" />
                          <span className="font-semibold">{post.savings_amount.toLocaleString()} FCFA</span>
                        </div>
                      )}
                      {post.waste_avoided_kg > 0 && (
                        <div className="flex items-center gap-2 bg-teal-50 text-teal-700 px-3 py-2 rounded-lg">
                          <Leaf className="w-4 h-4" />
                          <span className="font-semibold">{post.waste_avoided_kg} kg sauvés</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Image */}
                {post.image_url && (
                  <div className="px-4 pb-3">
                    <img 
                      src={post.image_url} 
                      alt=""
                      className="w-full rounded-xl object-cover max-h-80"
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="px-4 py-3 border-t flex items-center gap-6">
                  <button
                    onClick={() => handleLike(post)}
                    className={`flex items-center gap-2 transition-colors ${
                      isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                    <span className="text-sm font-medium">{post.likes_count || 0}</span>
                  </button>
                  <button 
                    className="flex items-center gap-2 text-gray-500 hover:text-blue-500"
                    onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">{post.comments_count || 0}</span>
                  </button>
                  <button className="flex items-center gap-2 text-gray-500 hover:text-emerald-500">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}