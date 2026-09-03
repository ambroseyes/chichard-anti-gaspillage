import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Clock, Phone, CheckCircle2, XCircle, Package } from 'lucide-react';

const STATUS_CONFIG = {
  reserved: { label: 'Réservée', color: 'bg-blue-100 text-blue-700', next: 'confirmed' },
  confirmed: { label: 'Confirmée', color: 'bg-emerald-100 text-emerald-700', next: 'ready' },
  ready: { label: 'Prête !', color: 'bg-green-100 text-green-700', next: 'collected' },
  collected: { label: 'Retirée', color: 'bg-gray-100 text-gray-500', next: null },
  cancelled: { label: 'Annulée', color: 'bg-red-100 text-red-500', next: null },
  no_show: { label: 'No show', color: 'bg-orange-100 text-orange-600', next: null },
};

const NEXT_LABELS = {
  confirmed: 'Confirmer',
  ready: 'Marquer prête',
  collected: '✅ Retirée',
};

export default function ReservationsList({ reservations }) {
  const [filter, setFilter] = useState('active');
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => api.entities.ClickCollectReservation.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-reservations'] });
      toast.success('Statut mis à jour');
    },
  });

  const filters = [
    { key: 'active', label: 'En cours', fn: r => ['reserved', 'confirmed', 'ready'].includes(r.status) },
    { key: 'collected', label: 'Retirées', fn: r => r.status === 'collected' },
    { key: 'cancelled', label: 'Annulées', fn: r => ['cancelled', 'no_show'].includes(r.status) },
    { key: 'all', label: 'Toutes', fn: () => true },
  ];

  const current = filters.find(f => f.key === filter);
  const displayed = reservations.filter(current.fn);

  if (reservations.length === 0) {
    return (
      <Card className="py-16 text-center">
        <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500 font-medium">Aucune réservation</p>
        <p className="text-sm text-gray-400">Les réservations de vos clients apparaîtront ici</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {filters.map(f => {
          const count = reservations.filter(f.fn).length;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                filter === f.key
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white text-gray-600 border hover:bg-gray-50'
              }`}
            >
              {f.label} ({count})
            </button>
          );
        })}
      </div>

      {/* List */}
      {displayed.length === 0 ? (
        <p className="text-center text-gray-400 py-8">Aucune réservation dans cette catégorie</p>
      ) : (
        <div className="space-y-3">
          {displayed.map(r => {
            const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.reserved;
            const nextStatus = cfg.next;
            return (
              <Card key={r.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-gray-900 truncate">{r.customer_name || r.customer_email}</p>
                      <Badge className={cfg.color}>{cfg.label}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{r.basket_name}</p>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {r.pickup_date} · {r.pickup_slot}
                      </span>
                      {r.customer_phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" /> {r.customer_phone}
                        </span>
                      )}
                      {r.confirmation_code && (
                        <span className="font-mono font-bold text-emerald-700">#{r.confirmation_code}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-emerald-700">{r.total_amount?.toLocaleString()} F</p>
                    <p className="text-xs text-gray-400">{r.quantity} panier(s)</p>
                  </div>
                </div>

                {nextStatus && (
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-sm h-8"
                      onClick={() => updateMutation.mutate({ id: r.id, status: nextStatus })}
                      disabled={updateMutation.isPending}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      {NEXT_LABELS[nextStatus]}
                    </Button>
                    {r.status !== 'collected' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-red-400 border-red-200 hover:bg-red-50"
                        onClick={() => updateMutation.mutate({ id: r.id, status: 'no_show' })}
                        disabled={updateMutation.isPending}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" /> No show
                      </Button>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}