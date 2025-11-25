import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Star, ThumbsUp, Camera, Send } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { toast } from 'sonner';

export default function RecipeRatings({ recipeId, user }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: ratings = [] } = useQuery({
    queryKey: ['recipe-ratings', recipeId],
    queryFn: () => base44.entities.RecipeRating.filter({ recipe_id: recipeId }, '-created_date'),
    enabled: !!recipeId,
  });

  const submitMutation = useMutation({
    mutationFn: (data) => base44.entities.RecipeRating.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipe-ratings', recipeId] });
      setRating(0);
      setComment('');
      setShowForm(false);
      toast.success('Avis publié !');
    }
  });

  const handleSubmit = () => {
    if (!rating) return;
    submitMutation.mutate({
      recipe_id: recipeId,
      user_email: user.email,
      user_name: user.full_name,
      rating,
      comment
    });
  };

  // Calculate stats
  const avgRating = ratings.length > 0 
    ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
    : 0;
  
  const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: ratings.filter(r => r.rating === star).length,
    percent: ratings.length > 0 
      ? (ratings.filter(r => r.rating === star).length / ratings.length) * 100 
      : 0
  }));

  const userHasRated = ratings.some(r => r.user_email === user?.email);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <Card className="p-5">
        <div className="flex items-start gap-6">
          <div className="text-center">
            <p className="text-4xl font-bold text-gray-900">{avgRating}</p>
            <div className="flex items-center gap-0.5 my-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star}
                  className={`w-4 h-4 ${star <= Math.round(avgRating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
                />
              ))}
            </div>
            <p className="text-sm text-gray-500">{ratings.length} avis</p>
          </div>
          
          <div className="flex-1 space-y-1">
            {ratingDistribution.map(({ star, count, percent }) => (
              <div key={star} className="flex items-center gap-2 text-sm">
                <span className="w-3">{star}</span>
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <Progress value={percent} className="h-2 flex-1" />
                <span className="w-8 text-gray-500">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Add Rating */}
      {user && !userHasRated && (
        <Card className="p-4">
          {!showForm ? (
            <button 
              onClick={() => setShowForm(true)}
              className="w-full text-center py-3 text-emerald-600 font-medium hover:bg-emerald-50 rounded-lg transition-colors"
            >
              <Star className="w-5 h-5 inline mr-2" />
              Donner mon avis
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4"
            >
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star 
                      className={`w-8 h-8 ${
                        star <= (hoverRating || rating) 
                          ? 'text-amber-400 fill-amber-400' 
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              
              <Textarea
                placeholder="Partagez votre expérience avec cette recette..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">
                  Annuler
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={!rating}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Publier
                </Button>
              </div>
            </motion.div>
          )}
        </Card>
      )}

      {/* Ratings List */}
      <div className="space-y-4">
        {ratings.map((r) => (
          <Card key={r.id} className="p-4">
            <div className="flex items-start gap-3">
              <Avatar>
                <AvatarFallback className="bg-emerald-100 text-emerald-600">
                  {r.user_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{r.user_name}</p>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star}
                        className={`w-4 h-4 ${star <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                </div>
                {r.comment && (
                  <p className="text-sm text-gray-600 mt-2">{r.comment}</p>
                )}
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                  <button className="flex items-center gap-1 hover:text-emerald-600">
                    <ThumbsUp className="w-4 h-4" />
                    Utile ({r.helpful_count || 0})
                  </button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}