import React, { useState } from 'react';
import { api } from '@/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MessageSquare, Send, ThumbsUp, MessageCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

export default function ForumSection({ user }) {
  const [newQuestion, setNewQuestion] = useState('');
  const queryClient = useQueryClient();

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['forum-questions'],
    queryFn: () => api.entities.SocialPost.filter({ post_type: 'question' }, '-created_date', 20),
  });

  const createQuestionMutation = useMutation({
    mutationFn: (content) => api.entities.SocialPost.create({
      content,
      post_type: 'question',
      author_email: user.email,
      author_name: user.full_name,
      author_avatar: user.avatar_url, // assuming this exists or is handled
      author_eco_level: user.eco_level,
      likes_count: 0,
      comments_count: 0
    }),
    onSuccess: () => {
      setNewQuestion('');
      queryClient.invalidateQueries({ queryKey: ['forum-questions'] });
      toast.success('Question posée !');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;
    createQuestionMutation.mutate(newQuestion);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Ask Question Input */}
      <Card className="p-4">
        <div className="flex gap-4">
          <Avatar>
            <AvatarImage src={user?.avatar_url} />
            <AvatarFallback>{user?.full_name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <form onSubmit={handleSubmit} className="flex-1 space-y-3">
            <Textarea
              placeholder="Poser une question à la communauté..."
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              className="min-h-[80px]"
            />
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={!newQuestion.trim() || createQuestionMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Send className="w-4 h-4 mr-2" />
                Publier
              </Button>
            </div>
          </form>
        </div>
      </Card>

      {/* Questions List */}
      <div className="space-y-4">
        {questions.map((post) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex gap-3">
                <Avatar className="w-10 h-10">
                   {/* <AvatarImage src={post.author_avatar} /> */}
                  <AvatarFallback className="bg-emerald-100 text-emerald-700">
                    {post.author_name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-gray-900">{post.author_name}</h4>
                    <span className="text-xs text-gray-500">
                      {post.created_date && formatDistanceToNow(new Date(post.created_date), { addSuffix: true, locale: fr })}
                    </span>
                  </div>
                  <p className="text-gray-800 mb-3">{post.content}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <button className="flex items-center gap-1 hover:text-emerald-600">
                      <ThumbsUp className="w-4 h-4" />
                      {post.likes_count || 0}
                    </button>
                    <button className="flex items-center gap-1 hover:text-emerald-600">
                      <MessageCircle className="w-4 h-4" />
                      {post.comments_count || 0} réponses
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}

        {questions.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Aucune question pour le moment. Soyez le premier !</p>
          </div>
        )}
      </div>
    </div>
  );
}