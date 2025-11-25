import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Plus, Trophy, Users, Flame, TrendingUp, Filter,
  Sparkles, MessageCircle, Lightbulb, Mail
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SocialFeed from '@/components/community/SocialFeed';
import CreatePostModal from '@/components/community/CreatePostModal';
import LeaderboardCard from '@/components/gamification/LeaderboardCard';
import ChallengeCard from '@/components/gamification/ChallengeCard';
import ZeroWasteTips from '@/components/community/ZeroWasteTips';
import DirectMessages from '@/components/community/DirectMessages';
import { toast } from 'sonner';

export default function Community() {
  const [user, setUser] = useState(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [activeTab, setActiveTab] = useState('feed');
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {}
    };
    loadUser();
  }, []);

  const { data: challenges = [] } = useQuery({
    queryKey: ['challenges'],
    queryFn: () => base44.entities.Challenge.filter({ is_active: true }),
  });

  const { data: userChallenges = [] } = useQuery({
    queryKey: ['user-challenges', user?.email],
    queryFn: () => base44.entities.UserChallenge.filter({ user_email: user.email }),
    enabled: !!user,
  });

  const handleJoinChallenge = async (challenge) => {
    if (!user) {
      toast.error('Connectez-vous pour participer');
      return;
    }

    await base44.entities.UserChallenge.create({
      user_email: user.email,
      challenge_id: challenge.id,
      current_progress: 0,
      is_completed: false,
    });

    await base44.entities.Challenge.update(challenge.id, {
      participants_count: (challenge.participants_count || 0) + 1
    });

    queryClient.invalidateQueries({ queryKey: ['challenges'] });
    queryClient.invalidateQueries({ queryKey: ['user-challenges'] });
    toast.success('Vous participez au défi !');
  };

  const getUserChallengeProgress = (challengeId) => {
    return userChallenges.find(uc => uc.challenge_id === challengeId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users className="w-6 h-6" />
              <h1 className="text-2xl font-bold">Communauté CHICHARD</h1>
            </div>
            <p className="text-purple-100">
              Partagez vos économies, découvrez des astuces, relevez des défis
            </p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 max-w-md mx-auto">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">12.5K</p>
              <p className="text-xs text-purple-100">Membres</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">45T</p>
              <p className="text-xs text-purple-100">kg sauvés</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">8.2M</p>
              <p className="text-xs text-purple-100">FCFA éco.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full md:w-auto mb-6 flex-wrap">
            <TabsTrigger value="feed" className="flex-1 md:flex-none">
              <MessageCircle className="w-4 h-4 mr-2" />
              Fil
            </TabsTrigger>
            <TabsTrigger value="tips" className="flex-1 md:flex-none">
              <Lightbulb className="w-4 h-4 mr-2" />
              Astuces
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex-1 md:flex-none">
              <Mail className="w-4 h-4 mr-2" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="challenges" className="flex-1 md:flex-none">
              <Flame className="w-4 h-4 mr-2" />
              Défis
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="flex-1 md:flex-none">
              <Trophy className="w-4 h-4 mr-2" />
              Classement
            </TabsTrigger>
          </TabsList>

          {/* Tips Tab */}
          <TabsContent value="tips">
            <div className="max-w-2xl mx-auto">
              <ZeroWasteTips user={user} />
            </div>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <div className="max-w-4xl mx-auto">
              <DirectMessages user={user} />
            </div>
          </TabsContent>

          {/* Feed Tab */}
          <TabsContent value="feed">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Main feed */}
              <div className="md:col-span-2 space-y-4">
                {/* Create post button */}
                {user && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white rounded-xl p-4 shadow-sm border"
                  >
                    <button
                      onClick={() => setShowCreatePost(true)}
                      className="w-full flex items-center gap-3 text-left"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {user.full_name?.charAt(0)}
                      </div>
                      <div className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-gray-500">
                        Partagez vos économies...
                      </div>
                      <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </button>
                  </motion.div>
                )}

                {/* Feed */}
                <SocialFeed user={user} />
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <LeaderboardCard currentUser={user} />

                {/* Active challenge preview */}
                {challenges.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Flame className="w-5 h-5 text-orange-500" />
                      Défi en cours
                    </h3>
                    <ChallengeCard
                      challenge={challenges[0]}
                      userProgress={getUserChallengeProgress(challenges[0].id)}
                      isJoined={!!getUserChallengeProgress(challenges[0].id)}
                      onJoin={handleJoinChallenge}
                    />
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Challenges Tab */}
          <TabsContent value="challenges">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {challenges.map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  userProgress={getUserChallengeProgress(challenge.id)}
                  isJoined={!!getUserChallengeProgress(challenge.id)}
                  onJoin={handleJoinChallenge}
                />
              ))}

              {challenges.length === 0 && (
                <div className="col-span-full text-center py-16">
                  <Flame className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Aucun défi actif</h3>
                  <p className="text-gray-500">De nouveaux défis arrivent bientôt !</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard">
            <div className="max-w-2xl mx-auto">
              <LeaderboardCard currentUser={user} />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Post Modal */}
      <CreatePostModal
        open={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        user={user}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['social-posts'] })}
      />
    </div>
  );
}