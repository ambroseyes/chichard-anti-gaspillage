import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Flag, ShieldAlert } from 'lucide-react';
import { api } from '@/api';
import { toast } from 'sonner';

export default function ReportModal({ entityType, entityId, trigger, entityName }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async () => {
    if (!reason) {
      toast.error("Veuillez sélectionner une raison");
      return;
    }

    setLoading(true);
    try {
      const user = await api.auth.me();
      await api.entities.ScamReport.create({
        reporter_email: user.email,
        reported_entity_type: entityType,
        reported_entity_id: entityId,
        reason,
        description: description || `Signalement de ${entityType}: ${entityName}`,
        status: 'pending'
      });

      toast.success("Signalement envoyé. Merci d'aider à sécuriser la communauté.");
      setOpen(false);
      setReason('');
      setDescription('');
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'envoi du signalement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">
            <Flag className="w-4 h-4 mr-2" />
            Signaler
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <ShieldAlert className="w-5 h-5" />
            Signaler un problème
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="bg-red-50 p-3 rounded-lg flex gap-3 items-start">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">
              Votre signalement restera anonyme. Utilisez cette fonction pour signaler des fraudes, des produits contrefaits ou des comportements suspects.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label>Raison du signalement</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez une raison" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fraud">Tentative d'escroquerie / Fraude</SelectItem>
                <SelectItem value="fake_product">Produit contrefait / Non conforme</SelectItem>
                <SelectItem value="harassment">Harcèlement / Comportement abusif</SelectItem>
                <SelectItem value="suspicious_behavior">Comportement suspect</SelectItem>
                <SelectItem value="other">Autre problème</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Détails supplémentaires</Label>
            <Textarea 
              placeholder="Décrivez le problème rencontré..." 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-red-600 hover:bg-red-700 text-white">
            {loading ? "Envoi..." : "Envoyer le signalement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}