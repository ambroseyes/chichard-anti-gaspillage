import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Ticket, Plus, Edit, Trash2, Users, Calendar, Clock,
  MapPin, Loader2, Send, Check, X
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from 'sonner';

const experienceTypes = [
  { id: 'workshop', label: 'Atelier cuisine', icon: '👨‍🍳' },
  { id: 'visit', label: 'Visite magasin', icon: '🏪' },
  { id: 'tasting', label: 'Dégustation', icon: '🍽️' },
  { id: 'class', label: 'Cours', icon: '📚' },
  { id: 'event', label: 'Événement', icon: '🎉' },
];

const tierLabels = {
  bronze: 'Bronze',
  silver: 'Argent',
  gold: 'Or',
  platinum: 'Platine',
  diamond: 'Diamant'
};

export default function ExperienceManager({ user }) {
  const [showForm, setShowForm] = useState(false);
  const [editingExp, setEditingExp] = useState(null);
  const [showBookings, setShowBookings] = useState(null);
  const queryClient = useQueryClient();

  const { data: experiences = [] } = useQuery({
    queryKey: ['partner-experiences', user?.store_id],
    queryFn: () => base44.entities.Experience.filter({ store_id: user?.store_id }),
    enabled: !!user?.store_id,
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['experience-bookings', showBookings?.id],
    queryFn: () => base44.entities.ExperienceBooking.filter({ experience_id: showBookings?.id }),
    enabled: !!showBookings,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Experience.create({
      ...data,
      store_id: user.store_id,
      store_name: user.store_name || user.full_name,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-experiences'] });
      setShowForm(false);
      toast.success('Expérience créée !');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Experience.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-experiences'] });
      setShowForm(false);
      setEditingExp(null);
      toast.success('Expérience mise à jour');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Experience.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-experiences'] });
      toast.success('Expérience supprimée');
    }
  });

  const updateBookingMutation = useMutation({
    mutationFn: async ({ bookingId, status, experience }) => {
      await base44.entities.ExperienceBooking.update(bookingId, { status });
      
      if (status === 'confirmed') {
        const booking = bookings.find(b => b.id === bookingId);
        await base44.integrations.Core.SendEmail({
          to: booking.user_email,
          subject: `Confirmation de réservation - ${experience.title}`,
          body: `Votre réservation pour "${experience.title}" le ${format(new Date(experience.event_date), 'd MMMM yyyy', { locale: fr })} à ${experience.event_time} est confirmée. Lieu: ${experience.location}. À bientôt !`
        });
        await base44.entities.ExperienceBooking.update(bookingId, { confirmation_sent: true });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experience-bookings'] });
      toast.success('Réservation mise à jour');
    }
  });

  const upcomingExperiences = experiences.filter(e => new Date(e.event_date) >= new Date());
  const pastExperiences = experiences.filter(e => new Date(e.event_date) < new Date());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Ticket className="w-6 h-6 text-purple-500" />
            Expériences
          </h2>
          <p className="text-sm text-gray-500">Proposez des expériences exclusives</p>
        </div>
        <Button onClick={() => { setEditingExp(null); setShowForm(true); }} className="bg-purple-500 hover:bg-purple-600">
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle expérience
        </Button>
      </div>

      {/* Upcoming Experiences */}
      <div>
        <h3 className="font-semibold mb-3">À venir</h3>
        {upcomingExperiences.length === 0 ? (
          <Card className="p-8 text-center">
            <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucune expérience programmée</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {upcomingExperiences.map((exp) => (
              <ExperienceCard
                key={exp.id}
                experience={exp}
                onEdit={() => { setEditingExp(exp); setShowForm(true); }}
                onDelete={() => deleteMutation.mutate(exp.id)}
                onViewBookings={() => setShowBookings(exp)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingExp ? 'Modifier l\'expérience' : 'Créer une expérience'}</DialogTitle>
          </DialogHeader>
          <ExperienceForm
            experience={editingExp}
            onSubmit={(data) => {
              if (editingExp) {
                updateMutation.mutate({ id: editingExp.id, data });
              } else {
                createMutation.mutate(data);
              }
            }}
            loading={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Bookings Dialog */}
      <Dialog open={!!showBookings} onOpenChange={() => setShowBookings(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Réservations - {showBookings?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4 max-h-96 overflow-y-auto">
            {bookings.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Aucune réservation</p>
            ) : (
              bookings.map((booking) => (
                <Card key={booking.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{booking.user_name}</p>
                      <p className="text-sm text-gray-500">{booking.user_email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }>
                        {booking.status}
                      </Badge>
                      {booking.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateBookingMutation.mutate({ 
                              bookingId: booking.id, 
                              status: 'confirmed',
                              experience: showBookings 
                            })}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-500"
                            onClick={() => updateBookingMutation.mutate({ 
                              bookingId: booking.id, 
                              status: 'cancelled',
                              experience: showBookings 
                            })}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ExperienceCard({ experience, onEdit, onDelete, onViewBookings }) {
  const expType = experienceTypes.find(t => t.id === experience.experience_type);
  const spotsLeft = experience.max_participants - (experience.current_participants || 0);

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3 mb-3">
        <span className="text-2xl">{expType?.icon || '🎁'}</span>
        <div className="flex-1">
          <h4 className="font-semibold">{experience.title}</h4>
          <p className="text-sm text-gray-500">{experience.description}</p>
        </div>
        <Badge className="bg-purple-100 text-purple-700">{experience.points_required} pts</Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-4">
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          {format(new Date(experience.event_date), 'd MMM yyyy', { locale: fr })}
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          {experience.event_time} ({experience.duration_minutes} min)
        </div>
        <div className="flex items-center gap-1">
          <MapPin className="w-4 h-4" />
          {experience.location}
        </div>
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          {spotsLeft} places restantes
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onViewBookings} className="flex-1">
          <Users className="w-4 h-4 mr-1" />
          Réservations
        </Button>
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Edit className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onDelete} className="text-red-500">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}

function ExperienceForm({ experience, onSubmit, loading }) {
  const [formData, setFormData] = useState({
    title: experience?.title || '',
    description: experience?.description || '',
    experience_type: experience?.experience_type || 'workshop',
    points_required: experience?.points_required || 500,
    duration_minutes: experience?.duration_minutes || 60,
    max_participants: experience?.max_participants || 10,
    event_date: experience?.event_date || '',
    event_time: experience?.event_time || '14:00',
    location: experience?.location || '',
    tier_required: experience?.tier_required || 'bronze',
    is_active: experience?.is_active !== false,
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
      <div>
        <Label>Titre</Label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Ex: Atelier cuisine anti-gaspi"
          required
        />
      </div>

      <div>
        <Label>Description</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Type d'expérience</Label>
          <Select value={formData.experience_type} onValueChange={(v) => setFormData({ ...formData, experience_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {experienceTypes.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.icon} {t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Points requis</Label>
          <Input
            type="number"
            value={formData.points_required}
            onChange={(e) => setFormData({ ...formData, points_required: Number(e.target.value) })}
            min="100"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Date</Label>
          <Input
            type="date"
            value={formData.event_date}
            onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
            required
          />
        </div>
        <div>
          <Label>Heure</Label>
          <Input
            type="time"
            value={formData.event_time}
            onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Durée (min)</Label>
          <Input
            type="number"
            value={formData.duration_minutes}
            onChange={(e) => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
            min="15"
          />
        </div>
        <div>
          <Label>Places max</Label>
          <Input
            type="number"
            value={formData.max_participants}
            onChange={(e) => setFormData({ ...formData, max_participants: Number(e.target.value) })}
            min="1"
          />
        </div>
      </div>

      <div>
        <Label>Lieu</Label>
        <Input
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          placeholder="Adresse ou salle"
        />
      </div>

      <div>
        <Label>Niveau fidélité requis</Label>
        <Select value={formData.tier_required} onValueChange={(v) => setFormData({ ...formData, tier_required: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(tierLabels).map(([id, label]) => (
              <SelectItem key={id} value={id}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={loading} className="w-full bg-purple-500 hover:bg-purple-600">
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        {experience ? 'Mettre à jour' : 'Créer l\'expérience'}
      </Button>
    </form>
  );
}