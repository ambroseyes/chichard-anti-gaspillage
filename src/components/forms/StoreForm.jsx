import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { 
  Store, MapPin, Phone, Mail, Clock, Image, Loader2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';

export default function StoreForm({ store, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    name: store?.name || '',
    address: store?.address || '',
    city: store?.city || '',
    phone: store?.phone || '',
    email: store?.email || '',
    description: store?.description || '',
    opening_hours: store?.opening_hours || '',
  });
  const [logoFile, setLogoFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let logo_url = store?.logo_url;
      
      if (logoFile) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: logoFile });
        logo_url = file_url;
      }

      const storeData = {
        ...formData,
        logo_url,
        is_partner: true,
        status: store?.status || 'pending',
      };

      if (store?.id) {
        await base44.entities.Store.update(store.id, storeData);
        toast.success('Magasin mis à jour');
      } else {
        const newStore = await base44.entities.Store.create(storeData);
        // Update user with store_id
        await base44.auth.updateMe({ store_id: newStore.id, is_partner: true });
        toast.success('Magasin enregistré ! En attente de validation.');
      }
      
      onSuccess?.();
    } catch (e) {
      toast.error('Erreur lors de l\'enregistrement');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-blue-900">
          <strong>⚡ Astuce :</strong> Remplissez uniquement les champs obligatoires (*) pour une inscription rapide. 
          Vous pourrez compléter les autres informations plus tard depuis votre tableau de bord.
        </p>
      </div>

      <div>
        <Label className="text-base font-semibold">Nom du magasin *</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ex: Super Marché Express, Boulangerie du Coin..."
          required
          className="mt-1"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label className="text-base font-semibold">Ville *</Label>
          <Input
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder="Ex: Douala, Yaoundé..."
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-base font-semibold">Téléphone *</Label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="6XX XX XX XX"
            required
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label className="text-base font-semibold">Adresse complète *</Label>
        <Input
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Ex: Avenue de la Liberté, Quartier Akwa..."
          required
          className="mt-1"
        />
      </div>

      <div className="border-t pt-4">
        <p className="text-sm text-gray-500 mb-4">
          <strong>Informations optionnelles</strong> - Complétez maintenant ou plus tard
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label>Email de contact</Label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="contact@magasin.cm"
            className="mt-1"
          />
        </div>
        <div>
          <Label>Horaires d'ouverture</Label>
          <Input
            value={formData.opening_hours}
            onChange={(e) => setFormData({ ...formData, opening_hours: e.target.value })}
            placeholder="Ex: Lun-Sam: 8h-20h"
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label>Description du magasin</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Présentez brièvement votre magasin et vos spécialités..."
          rows={3}
          className="mt-1"
        />
      </div>

      <div>
        <Label>Logo du magasin (optionnel)</Label>
        <Input 
          type="file" 
          accept="image/*" 
          onChange={(e) => setLogoFile(e.target.files[0])}
          className="mt-1"
        />
        <p className="text-xs text-gray-500 mt-1">Format recommandé : JPG ou PNG, max 2MB</p>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mt-6">
        <div className="flex items-start gap-3">
          <div className="text-2xl">✓</div>
          <div className="flex-1 text-sm">
            <p className="font-semibold text-emerald-900 mb-1">Validation rapide garantie</p>
            <p className="text-emerald-700">
              Votre demande sera examinée sous 24h. Vous recevrez un email de confirmation 
              dès que votre compte sera activé.
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Annuler
          </Button>
        )}
        <Button type="submit" disabled={loading} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-base py-6">
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Inscription en cours...
            </>
          ) : (
            <>
              <Store className="w-5 h-5 mr-2" />
              {store?.id ? 'Mettre à jour' : 'Créer mon compte partenaire'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}