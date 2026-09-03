import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Clock, User, ArrowRight } from 'lucide-react';

const statusConfig = {
  verified: { label: 'Vérifié', color: 'bg-emerald-100 text-emerald-700' },
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700' },
  rejected: { label: 'Rejeté', color: 'bg-red-100 text-red-700' },
  suspended: { label: 'Suspendu', color: 'bg-orange-100 text-orange-700' },
};

export default function StatusHistoryModal({ store, isOpen, onClose }) {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['status-history', store?.id],
    queryFn: () => api.entities.PartnerStatusHistory.filter({ store_id: store.id }, '-created_date'),
    enabled: !!store && isOpen
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Historique des statuts - {store?.name}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : history.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Aucun changement de statut enregistré</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((entry, idx) => (
              <div key={entry.id} className="border-l-4 border-emerald-500 pl-4 pb-4 relative">
                <div className="absolute -left-2 top-0 w-4 h-4 bg-emerald-500 rounded-full" />
                
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={statusConfig[entry.previous_status]?.color}>
                      {statusConfig[entry.previous_status]?.label}
                    </Badge>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <Badge className={statusConfig[entry.new_status]?.color}>
                      {statusConfig[entry.new_status]?.label}
                    </Badge>
                  </div>
                  <span className="text-xs text-gray-500">
                    {format(new Date(entry.created_date), 'dd/MM/yyyy HH:mm')}
                  </span>
                </div>

                <div className="text-sm text-gray-600 flex items-center gap-2">
                  <User className="w-3 h-3" />
                  <span>Par: {entry.changed_by_name || entry.changed_by}</span>
                </div>

                {entry.notes && (
                  <div className="mt-2 text-sm text-gray-600 bg-gray-50 rounded p-2">
                    {entry.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}