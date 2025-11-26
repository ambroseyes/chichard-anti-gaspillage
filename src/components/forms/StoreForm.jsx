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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Nom du magasin *</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Super Marché Express"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Ville *</Label>
          <Input
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder="Douala"
            required
          />
        </div>
        <div>
          <Label>Téléphone *</Label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="6XX XX XX XX"
            required
          />
        </div>
      </div>

      <div>
        <Label>Adresse complète *</Label>
        <Input
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Rue, quartier..."
          required
        />
      </div>

      <div>
        <Label>Email</Label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="contact@magasin.cm"
        />
      </div>

      <div>
        <Label>Horaires d'ouverture</Label>
        <Input
          value={formData.opening_hours}
          onChange={(e) => setFormData({ ...formData, opening_hours: e.target.value })}
          placeholder="Lun-Sam: 8h-20h, Dim: 9h-14h"
        />
      </div>

      <div>
        <Label>Description</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Présentez votre magasin..."
          rows={3}
        />
      </div>

      <div>
        <Label>Logo du magasin</Label>
        <Input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files[0])} />
      </div>

      <div className="flex gap-3 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Annuler
          </Button>
        )}
        <Button type="submit" disabled={loading} className="flex-1 bg-emerald-500 hover:bg-emerald-600">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Store className="w-4 h-4 mr-2" />}
          {store?.id ? 'Mettre à jour' : 'Enregistrer le magasin'}
        </Button>
      </div>
    </form>
  );
}