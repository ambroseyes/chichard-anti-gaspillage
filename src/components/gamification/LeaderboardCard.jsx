import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, TrendingUp, Leaf } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const mockLeaderboard = [
  { rank: 1, name: 'Marie K.', avatar: '', savings: 125000, waste: 45.2, eco_level: 'eco_champion' },
  { rank: 2, name: 'Paul D.', avatar: '', savings: 98500, waste: 38.5, eco_level: 'eco_hero' },
  { rank: 3, name: 'Aisha M.', avatar: '', savings: 87200, waste: 32.1, eco_level: 'eco_hero' },
  { rank: 4, name: 'Jean P.', avatar: '', savings: 72100, waste: 28.4, eco_level: 'eco_citoyen' },
  { rank: 5, name: 'Sophie L.', avatar: '', savings: 65800, waste: 25.7, eco_level: 'eco_citoyen' },
];

const ecoLevelIcons = {
  debutant: '🌱',
  eco_citoyen: '🌿',
  eco_hero: '🌳',
  eco_champion: '🌲',
  eco_legend: '🌍',
};

export default function LeaderboardCard({ currentUser }) {
  const getRankStyle = (rank) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-amber-400 to-yellow-500 text-white';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-400 text-white';
      case 3:
        return 'bg-gradient-to-r from-amber-600 to-orange-600 text-white';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-4 h-4" />;
      case 2:
      case 3:
        return <Medal className="w-4 h-4" />;
      default:
        return rank;
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 text-white">
        <div className="flex items-center gap-3">
          <Trophy className="w-6 h-6" />
          <div>
            <h3 className="font-bold text-lg">Classement</h3>
            <p className="text-indigo-100 text-sm">Top éco-héros de la semaine</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="savings" className="w-full">
        <TabsList className="w-full rounded-none border-b">
          <TabsTrigger value="savings" className="flex-1">
            <TrendingUp className="w-4 h-4 mr-2" />
            Économies
          </TabsTrigger>
          <TabsTrigger value="waste" className="flex-1">
            <Leaf className="w-4 h-4 mr-2" />
            Impact
          </TabsTrigger>
        </TabsList>

        <TabsContent value="savings" className="p-4 space-y-3">
          {mockLeaderboard.map((user, idx) => (
            <motion.div
              key={user.rank}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`flex items-center gap-3 p-3 rounded-xl ${
                currentUser?.full_name === user.name ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getRankStyle(user.rank)}`}>
                {getRankIcon(user.rank)}
              </div>
              <Avatar className="w-10 h-10">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="bg-indigo-100 text-indigo-600">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{user.name}</span>
                  <span>{ecoLevelIcons[user.eco_level]}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-emerald-600">{user.savings.toLocaleString()}</p>
                <p className="text-xs text-gray-500">FCFA</p>
              </div>
            </motion.div>
          ))}
        </TabsContent>

        <TabsContent value="waste" className="p-4 space-y-3">
          {mockLeaderboard.map((user, idx) => (
            <motion.div
              key={user.rank}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-gray-50"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getRankStyle(user.rank)}`}>
                {getRankIcon(user.rank)}
              </div>
              <Avatar className="w-10 h-10">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="bg-teal-100 text-teal-600">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <span className="font-medium truncate">{user.name}</span>
              </div>
              <div className="text-right">
                <p className="font-bold text-teal-600">{user.waste.toFixed(1)}</p>
                <p className="text-xs text-gray-500">kg sauvés</p>
              </div>
            </motion.div>
          ))}
        </TabsContent>
      </Tabs>

      {/* Current user position if not in top 5 */}
      {currentUser && (
        <div className="border-t p-4 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-bold">
              {currentUser.weekly_ranking || '?'}
            </div>
            <Avatar className="w-10 h-10">
              <AvatarImage src={currentUser.avatar_url} />
              <AvatarFallback className="bg-emerald-100 text-emerald-600">
                {currentUser.full_name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium">Vous</p>
              <p className="text-xs text-gray-500">Votre position</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-emerald-600">{(currentUser.total_savings || 0).toLocaleString()}</p>
              <p className="text-xs text-gray-500">FCFA</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}