import React from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Sparkles, ChefHat, Store, Camera, Users, Gift,
  Calendar, MapPin, Clock, Star, Lock
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';

const experiences = [
  {
    id: 'cooking_class',
    title: 'Atelier Cuisine Anti-Gaspi',
    description: 'Apprenez à cuisiner zéro déchet avec un chef professionnel',
    points: 2000,
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400',
    duration: '2h',
    location: 'Douala',
    tier: 'gold',
    icon: ChefHat,
    spots: 8
  },
  {
    id: 'partner_visit',
    title: 'Visite Partenaire VIP',
    description: 'Découvrez les coulisses d\'un supermarché partenaire',
    points: 1500,
    image: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400',
    duration: '1h30',
    location: 'Yaoundé',
    tier: 'silver',
    icon: Store,
    spots: 12
  },
  {
    id: 'photo_session',
    title: 'Séance Photo Éco-Héros',
    description: 'Photo professionnelle avec votre badge de champion',
    points: 1000,
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400',
    duration: '30min',
    location: 'Studio CHICHARD',
    tier: 'silver',
    icon: Camera,
    spots: 20
  },
  {
    id: 'community_lunch',
    title: 'Déjeuner Communautaire',
    description: 'Rencontrez d\'autres éco-héros autour d\'un repas anti-gaspi',
    points: 2500,
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400',
    duration: '2h',
    location: 'Douala / Yaoundé',
    tier: 'platinum',
    icon: Users,
    spots: 15
  }
];

const tierConfig = {
  bronze: { label: 'Bronze', color: 'bg-amber-100 text-amber-700' },
  silver: { label: 'Argent', color: 'bg-gray-100 text-gray-700' },
  gold: { label: 'Or', color: 'bg-yellow-100 text-yellow-700' },
  platinum: { label: 'Platine', color: 'bg-purple-100 text-purple-700' },
  diamond: { label: 'Diamant', color: 'bg-cyan-100 text-cyan-700' }
};

const tierOrder = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];

export default function ExperienceRewards({ user }) {
  const queryClient = useQueryClient();
  const userPoints = user?.loyalty_points || 0;
  const userTier = user?.loyalty_tier || 'bronze';
  const userTierIndex = tierOrder.indexOf(userTier);

  const redeemMutation = useMutation({
    mutationFn: async (experience) => {
      await base44.entities.LoyaltyTransaction.create({
        user_email: user.email,
        type: 'redeem',
        points: -experience.points,
        source: 'redemption',
        description: `Expérience: ${experience.title}`
      });

      await base44.auth.updateMe({
        loyalty_points: userPoints - experience.points
      });

      // Send confirmation email
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: `🎉 Votre expérience ${experience.title} est réservée !`,
        body: `Félicitations ! Votre expérience "${experience.title}" a été réservée. Nous vous contacterons bientôt avec les détails.`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-transactions'] });
      toast.success('Expérience réservée ! Vérifiez votre email 🎉');
    }
  });

  const canRedeem = (exp) => {
    const expTierIndex = tierOrder.indexOf(exp.tier);
    return userPoints >= exp.points && userTierIndex >= expTierIndex;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-purple-500" />
        <h3 className="font-semibold text-lg">Expériences Exclusives</h3>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {experiences.map((exp) => {
          const Icon = exp.icon;
          const tier = tierConfig[exp.tier];
          const isUnlocked = canRedeem(exp);
          const expTierIndex = tierOrder.indexOf(exp.tier);
          const tierLocked = userTierIndex < expTierIndex;

          return (
            <motion.div
              key={exp.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -5 }}
            >
              <Card className={`overflow-hidden ${!isUnlocked ? 'opacity-75' : ''}`}>
                <div className="relative h-40">
                  <img 
                    src={exp.image} 
                    alt={exp.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <h4 className="font-bold text-white text-lg">{exp.title}</h4>
                  </div>
                  <Badge className={`absolute top-3 right-3 ${tier.color}`}>
                    {tier.label}+
                  </Badge>
                  {tierLocked && (
                    <div className="absolute top-3 left-3 p-2 bg-black/50 rounded-lg">
                      <Lock className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <p className="text-sm text-gray-600 mb-4">{exp.description}</p>

                  <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {exp.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {exp.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {exp.spots} places
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-amber-500" />
                      <span className="font-bold text-lg">{exp.points.toLocaleString()}</span>
                      <span className="text-sm text-gray-500">points</span>
                    </div>

                    <Button
                      disabled={!isUnlocked}
                      onClick={() => redeemMutation.mutate(exp)}
                      className={isUnlocked ? 'bg-purple-500 hover:bg-purple-600' : ''}
                    >
                      {tierLocked ? (
                        <>
                          <Lock className="w-4 h-4 mr-1" />
                          {tier.label}+
                        </>
                      ) : userPoints < exp.points ? (
                        `${exp.points - userPoints} pts manquants`
                      ) : (
                        <>
                          <Gift className="w-4 h-4 mr-1" />
                          Réserver
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}