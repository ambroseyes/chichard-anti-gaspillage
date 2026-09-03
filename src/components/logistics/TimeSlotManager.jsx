import React, { useState } from 'react';
import { api } from '@/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Clock, Calendar } from 'lucide-react';
import { format, addDays, addHours, setHours, setMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

export default function TimeSlotManager({ storeId, onSlotSelected }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDialog, setShowDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: pickupRequests = [] } = useQuery({
    queryKey: ['pickup-requests-slots', storeId],
    queryFn: () => api.entities.PickupRequest.filter({ store_id: storeId }),
    enabled: !!storeId
  });

  // Generate time slots for the next 7 days
  const generateTimeSlots = () => {
    const slots = [];
    const startHour = 9;
    const endHour = 19;
    const slotDuration = 2; // 2 hours

    for (let day = 0; day < 7; day++) {
      const date = addDays(new Date(), day);
      
      for (let hour = startHour; hour < endHour; hour += slotDuration) {
        const slotStart = setMinutes(setHours(date, hour), 0);
        const slotEnd = addHours(slotStart, slotDuration);
        
        const slotKey = `${format(date, 'yyyy-MM-dd')}_${hour}`;
        const bookingsInSlot = pickupRequests.filter(r => {
          if (!r.pickup_time_slot) return false;
          const [start] = r.pickup_time_slot.split(' - ');
          const requestHour = parseInt(start.split(':')[0]);
          return r.pickup_date === format(date, 'yyyy-MM-dd') && requestHour === hour;
        }).length;

        const capacity = 5; // Max 5 pickups per slot
        const available = capacity - bookingsInSlot;

        slots.push({
          key: slotKey,
          date: date,
          start: slotStart,
          end: slotEnd,
          label: `${format(slotStart, 'HH:mm')} - ${format(slotEnd, 'HH:mm')}`,
          bookings: bookingsInSlot,
          available,
          isFull: available === 0,
          isPast: slotStart < new Date()
        });
      }
    }

    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Group slots by date
  const slotsByDate = timeSlots.reduce((acc, slot) => {
    const dateKey = format(slot.date, 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(slot);
    return acc;
  }, {});

  const handleSlotSelect = (slot) => {
    if (slot.isFull || slot.isPast) return;
    
    onSlotSelected({
      pickup_date: format(slot.date, 'yyyy-MM-dd'),
      pickup_time_slot: slot.label,
      available_slots: slot.available
    });
    
    toast.success('Créneau sélectionné');
    setShowDialog(false);
  };

  return (
    <>
      <Button onClick={() => setShowDialog(true)} variant="outline" className="w-full">
        <Calendar className="w-4 h-4 mr-2" />
        Choisir un créneau de retrait
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créneaux de retrait disponibles</DialogTitle>
          </DialogHeader>

          <div className="mt-4 space-y-6">
            {Object.entries(slotsByDate).map(([dateKey, slots]) => {
              const date = new Date(dateKey);
              const isToday = format(new Date(), 'yyyy-MM-dd') === dateKey;
              const isTomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd') === dateKey;

              return (
                <div key={dateKey}>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {isToday ? 'Aujourd\'hui' : isTomorrow ? 'Demain' : format(date, 'EEEE d MMMM', { locale: fr })}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {slots.map((slot) => (
                      <button
                        key={slot.key}
                        onClick={() => handleSlotSelect(slot)}
                        disabled={slot.isFull || slot.isPast}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          slot.isPast
                            ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                            : slot.isFull
                            ? 'bg-red-50 border-red-200 text-red-600 cursor-not-allowed'
                            : slot.available <= 2
                            ? 'bg-orange-50 border-orange-300 hover:border-orange-400 hover:shadow'
                            : 'bg-white border-gray-300 hover:border-emerald-500 hover:shadow'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span className="font-medium">{slot.label}</span>
                          </div>
                          {slot.isFull ? (
                            <Badge className="bg-red-500">Complet</Badge>
                          ) : slot.isPast ? (
                            <Badge variant="outline">Passé</Badge>
                          ) : slot.available <= 2 ? (
                            <Badge className="bg-orange-500">{slot.available} places</Badge>
                          ) : (
                            <Badge className="bg-emerald-500">{slot.available} places</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          {slot.bookings > 0 && (
                            <span>{slot.bookings} réservation(s)</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 Les créneaux se remplissent rapidement. Réservez dès maintenant pour garantir votre retrait.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}