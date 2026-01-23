import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { CheckCircle, X, Trash2, Shield } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function BulkActionsBar({ selectedStores, onBulkAction, onClear }) {
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [notes, setNotes] = useState('');

  const handleAction = (type) => {
    setActionType(type);
    setShowNotesDialog(true);
  };

  const confirmAction = () => {
    onBulkAction(actionType, notes);
    setShowNotesDialog(false);
    setNotes('');
  };

  if (selectedStores.length === 0) return null;

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-50">
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium text-gray-700">
            {selectedStores.length} sélectionné{selectedStores.length > 1 ? 's' : ''}
          </div>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => handleAction('verified')}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Approuver
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAction('rejected')}
              className="text-red-600 hover:bg-red-50"
            >
              <X className="w-4 h-4 mr-2" />
              Rejeter
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAction('suspended')}
              className="text-orange-600 hover:bg-orange-50"
            >
              <Shield className="w-4 h-4 mr-2" />
              Suspendre
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAction('delete')}
              className="text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </Button>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={onClear}
          >
            Annuler
          </Button>
        </div>
      </div>

      {/* Notes Dialog */}
      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer l'action</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-gray-600">
              Vous êtes sur le point de modifier {selectedStores.length} partenaire{selectedStores.length > 1 ? 's' : ''}.
            </p>
            <div>
              <Label>Notes (optionnel)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Raison du changement..."
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowNotesDialog(false)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={confirmAction}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600"
              >
                Confirmer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}