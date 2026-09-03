import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Leaf, Plus, X } from 'lucide-react';

const EMPTY = {
  name: '',
  basket_type: 'surprise_basket',
  description: '',
  original_price: '',
  discounted_price: '',
  quantity_available: 5,
  pickup_date: new Date().toISOString().split('T')[0],
  pickup_slots: ['17:00-18:00', '18:00-19:00'],
  status: 'active',
  co2_saved_kg: '',
  category: '',
};

export default function BasketEditorModal({ open, basket, user, onClose }) {
  const [form, setForm] = useState(EMPTY);
  const [newSlot, setNewSlot] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    if (basket) {
      setForm({ ...EMPTY, ...basket });
    } else {
      setForm(EMPTY);
    }
  }, [basket, open]);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (basket?.id) {
        return api.entities.ClickCollectBasket.update(basket.id, data);
      } else {
        return api.entities.ClickCollectBasket.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-baskets'] });
      toast.success(basket?.id ? 'Panier mis à jour !' : 'Panier créé !');
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...form,
      store_id: user.email,
      store_name: user.full_name || user.email,
      original_price: parseFloat(form.original_price) || 0,
      discounted_price: parseFloat(form.discounted_price) || 0,
      quantity_available: parseInt(form.quantity_available) || 0,
      co2_saved_kg: parseFloat(form.co2_saved_kg) || 0,
    };
    saveMutation.mutate(data);
  };

  const addSlot = () => {
    if (newSlot && !form.pickup_slots?.includes(newSlot)) {
      setForm(f => ({ ...f, pickup_slots: [...(f.pickup_slots || []), newSlot] }));
      setNewSlot('');
    }
  };

  const removeSlot = (slot) => {
    setForm(f => ({ ...f, pickup_slots: f.pickup_slots.filter(s => s !== slot) }));
  };

  const discountPct = form.original_price && form.discounted_price
    ? Math.round((1 - parseFloat(form.discounted_price) / parseFloat(form.original_price)) * 100)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{basket?.id ? 'Modifier le panier' : 'Créer un panier'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Nom du panier *</label>
            <Input
              placeholder="Ex: Panier du soir - Boulangerie"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
          </div>

          {/* Type */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Type</label>
            <Select value={form.basket_type} onValueChange={v => setForm(f => ({ ...f, basket_type: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="surprise_basket">🎁 Panier surprise</SelectItem>
                <SelectItem value="specific_products">📦 Produits spécifiques</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
            <Input
              placeholder="Décrivez le contenu du panier..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Prix original (F) *</label>
              <Input
                type="number"
                placeholder="5000"
                value={form.original_price}
                onChange={e => setForm(f => ({ ...f, original_price: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Prix réduit (F) *
                {discountPct > 0 && (
                  <span className="ml-1 text-xs bg-emerald-100 text-emerald-700 px-1.5 rounded">-{discountPct}%</span>
                )}
              </label>
              <Input
                type="number"
                placeholder="2000"
                value={form.discounted_price}
                onChange={e => setForm(f => ({ ...f, discounted_price: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Quantity + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Quantité disponible *</label>
              <Input
                type="number"
                min={0}
                value={form.quantity_available}
                onChange={e => setForm(f => ({ ...f, quantity_available: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Date de retrait *</label>
              <Input
                type="date"
                value={form.pickup_date}
                onChange={e => setForm(f => ({ ...f, pickup_date: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Pickup slots */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Créneaux de retrait</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(form.pickup_slots || []).map(slot => (
                <div key={slot} className="flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs px-2 py-1 rounded-full">
                  {slot}
                  <button type="button" onClick={() => removeSlot(slot)}>
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: 19:00-20:00"
                value={newSlot}
                onChange={e => setNewSlot(e.target.value)}
                className="text-sm"
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSlot())}
              />
              <Button type="button" variant="outline" size="sm" onClick={addSlot}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* CO2 */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Leaf className="w-3.5 h-3.5 text-green-500" /> CO₂ évité (kg)
            </label>
            <Input
              type="number"
              step="0.1"
              placeholder="0.5"
              value={form.co2_saved_kg}
              onChange={e => setForm(f => ({ ...f, co2_saved_kg: e.target.value }))}
            />
          </div>

          {/* Status */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Statut</label>
            <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">✅ Actif</SelectItem>
                <SelectItem value="sold_out">❌ Épuisé</SelectItem>
                <SelectItem value="expired">🕐 Expiré</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Annuler
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-emerald-500 hover:bg-emerald-600"
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Enregistrement...' : basket?.id ? 'Mettre à jour' : 'Créer le panier'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}