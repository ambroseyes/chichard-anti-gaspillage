import React, { useState } from 'react';
import { api } from '@/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Ticket, Calendar, Clock, MapPin, Users, Crown,
  Loader2, Check
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from 'sonner';

const experienceTypes = {
  workshop: { icon: '👨‍🍳', label: 'Atelier' },
  visit: { icon: '🏪', label: 'Visite' },
  tasting: { icon: '🍽️', label: 'Dégustation' },
  class: { icon: '📚', label: 'Cours' },
  event: { icon: '🎉', label: 'Événement' },
};

const tierColors = {
  bronze: 'bg-amber-100 text-amber-700',
  silver: 'bg-gray-100 text-gray-700',
  gold: 'bg-yellow-100 text-yellow-700',
  platinum: 'bg-purple-100 text-purple-700',
  diamond: 'bg-cyan-100 text-cyan-700',
};

export default function ExperienceBookingSection({ user, userPoints = 0, userTier = 'bronze' }) {
  const [selectedExp, setSelectedExp] = useState(null);
  const [phone, setPhone] = useState('');
  const queryClient = useQueryClient();

  const { data: experiences = [], isLoading } = useQuery({
    queryKey: ['available-experiences'],
    queryFn: async () => {
      const exps = await api.entities.Experience.filter({ is_active: true });
      return exps.filter(e => 
        new Date(e.event_date) >= new Date() &&
        e.current_participants < e.max_participants
      );
    },
  });

  const { data: myBookings = [] } = useQuery({
    queryKey: ['my-bookings', user?.email],
    queryFn: () => api.entities.ExperienceBooking.filter({ user_email: user?.email }),
    enabled: !!user,
  });

  const bookMutation = useMutation({
    mutationFn: async (experience) => {
      // Deduct points
      await api.auth.updateMe({
        loyalty_points: userPoints - experience.points_required
      });

      // Create booking
      await api.entities.ExperienceBooking.create({
        experience_id: experience.id,
        experience_title: experience.title,
        user_email: user.email,
        user_name: user.full_name,
        user_phone: phone,
        points_spent: experience.points_required,
        event_date: experience.event_date,
        event_time: experience.event_time,
        store_name: experience.store_name,
        status: 'pending',
      });

      // Update participant count
      await api.entities.Experience.update(experience.id, {
        current_participants: (experience.current_participants || 0) + 1
      });

      // Create loyalty transaction
      await api.entities.LoyaltyTransaction.create({
        user_email: user.email,
        type: 'redeem',
        points: experience.points_required,
        source: 'redemption',
        description: `Réservation: ${experience.title}`
      });

      // Send confirmation email
      
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['available-experiences'] });
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      setSelectedExp(null);
      toast.success('Réservation envoyée ! Vous recevrez une confirmation.');
    },
    onError: () => {
      toast.error('Erreur lors de la réservation');
    }
  });

  const tierOrder = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
  const canAccessTier = (requiredTier) => {
    return tierOrder.indexOf(userTier) >= tierOrder.indexOf(requiredTier);
  };

  const isAlreadyBooked = (expId) => {
    return myBookings.some(b => b.experience_id === expId && b.status !== 'cancelled');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Ticket className="w-5 h-5 text-purple-500" />
          Expériences disponibles
        </h3>
        <Badge className="bg-purple-100 text-purple-700">
          {userPoints.toLocaleString()} pts disponibles
        </Badge>
      </div>

      {experiences.length === 0 ? (
        <Card className="p-8 text-center">
          <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucune expérience disponible pour le moment</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {experiences.map((exp) => {
            const expType = experienceTypes[exp.experience_type];
            const spotsLeft = exp.max_participants - (exp.current_participants || 0);
            const canAccess = canAccessTier(exp.tier_required);
            const alreadyBooked = isAlreadyBooked(exp.id);
            const canAfford = userPoints >= exp.points_required;

            return (
              <Card key={exp.id} className={`p-4 ${!canAccess ? 'opacity-60' : ''}`}>
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-3xl">{expType?.icon || '🎁'}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{exp.title}</h4>
                      {exp.tier_required !== 'bronze' && (
                        <Badge className={tierColors[exp.tier_required]}>
                          <Crown className="w-3 h-3 mr-1" />
                          {exp.tier_required}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{exp.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(exp.event_date), 'd MMM', { locale: fr })}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {exp.event_time}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {exp.store_name}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {spotsLeft} places
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <div>
                    <p className="text-lg font-bold text-purple-600">{exp.points_required.toLocaleString()} pts</p>
                    <p className="text-xs text-gray-500">{exp.duration_minutes} min</p>
                  </div>
                  {alreadyBooked ? (
                    <Badge className="bg-green-100 text-green-700">
                      <Check className="w-3 h-3 mr-1" />
                      Réservé
                    </Badge>
                  ) : !canAccess ? (
                    <Badge className="bg-gray-100 text-gray-500">
                      Niveau requis: {exp.tier_required}
                    </Badge>
                  ) : !canAfford ? (
                    <Badge className="bg-red-100 text-red-700">
                      Points insuffisants
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => setSelectedExp(exp)}
                      className="bg-purple-500 hover:bg-purple-600"
                    >
                      Réserver
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* My Bookings */}
      {myBookings.length > 0 && (
        <div className="mt-8">
          <h3 className="font-semibold mb-3">Mes réservations</h3>
          <div className="space-y-3">
            {myBookings.filter(b => b.status !== 'cancelled').map((booking) => (
              <Card key={booking.id} className="p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium">{booking.experience_title}</p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(booking.event_date), 'd MMMM yyyy', { locale: fr })} à {booking.event_time}
                  </p>
                </div>
                <Badge className={
                  booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                  booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }>
                  {booking.status === 'confirmed' ? 'Confirmé' : 
                   booking.status === 'pending' ? 'En attente' : booking.status}
                </Badge>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Booking Dialog */}
      <Dialog open={!!selectedExp} onOpenChange={() => setSelectedExp(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Réserver - {selectedExp?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Card className="p-4 bg-purple-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Date</span>
                <span className="font-medium">
                  {selectedExp && format(new Date(selectedExp.event_date), 'd MMMM yyyy', { locale: fr })}
                </span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Heure</span>
                <span className="font-medium">{selectedExp?.event_time}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Lieu</span>
                <span className="font-medium">{selectedExp?.location}</span>
              </div>
            </Card>

            <div>
              <Label>Téléphone de contact</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="6XX XX XX XX"
              />
            </div>

            <Card className="p-4 bg-amber-50 border-amber-200">
              <div className="flex items-center justify-between">
                <span>Points à utiliser</span>
                <span className="font-bold text-amber-700">{selectedExp?.points_required?.toLocaleString()} pts</span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Solde après</span>
                <span>{(userPoints - (selectedExp?.points_required || 0)).toLocaleString()} pts</span>
              </div>
            </Card>

            <Button
              onClick={() => bookMutation.mutate(selectedExp)}
              disabled={bookMutation.isPending || !phone}
              className="w-full bg-purple-500 hover:bg-purple-600"
            >
              {bookMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirmer la réservation
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}