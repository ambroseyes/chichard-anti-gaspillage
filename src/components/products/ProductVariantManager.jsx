import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from 'sonner';

export default function ProductVariantManager({ product }) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);
  const [formData, setFormData] = useState({
    variant_name: '',
    attributes: { size: '', color: '' },
    sku: '',
    price_adjustment: 0,
    quantity_available: 0,
    image_url: ''
  });
  const queryClient = useQueryClient();

  const { data: variants = [] } = useQuery({
    queryKey: ['variants', product.id],
    queryFn: () => base44.entities.ProductVariant.filter({ product_id: product.id }),
    enabled: !!product.id
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ProductVariant.create({
      ...data,
      product_id: product.id,
      product_name: product.name
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variants'] });
      toast.success('Variante ajoutée');
      closeDialog();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProductVariant.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variants'] });
      toast.success('Variante mise à jour');
      closeDialog();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProductVariant.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variants'] });
      toast.success('Variante supprimée');
    }
  });

  const openDialog = (variant = null) => {
    if (variant) {
      setEditingVariant(variant);
      setFormData({
        variant_name: variant.variant_name || '',
        attributes: variant.attributes || { size: '', color: '' },
        sku: variant.sku || '',
        price_adjustment: variant.price_adjustment || 0,
        quantity_available: variant.quantity_available || 0,
        image_url: variant.image_url || ''
      });
    } else {
      setEditingVariant(null);
      setFormData({
        variant_name: '',
        attributes: { size: '', color: '' },
        sku: '',
        price_adjustment: 0,
        quantity_available: 0,
        image_url: ''
      });
    }
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setEditingVariant(null);
  };

  const handleSubmit = () => {
    if (editingVariant) {
      updateMutation.mutate({ id: editingVariant.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Variantes du produit</h3>
        <Button size="sm" onClick={() => openDialog()}>
          <Plus className="w-4 h-4 mr-1" />
          Ajouter une variante
        </Button>
      </div>

      {variants.length === 0 ? (
        <Card className="p-6 text-center text-gray-500">
          Aucune variante créée. Ajoutez des variantes pour gérer différentes tailles, couleurs, etc.
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {variants.map((variant) => (
            <Card key={variant.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium">{variant.variant_name}</p>
                  <p className="text-xs text-gray-500">SKU: {variant.sku}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openDialog(variant)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(variant.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
              <div className="flex gap-2 mb-2">
                {variant.attributes?.color && (
                  <Badge variant="outline">{variant.attributes.color}</Badge>
                )}
                {variant.attributes?.size && (
                  <Badge variant="outline">{variant.attributes.size}</Badge>
                )}
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Stock: {variant.quantity_available}</span>
                <span className="font-semibold text-emerald-600">
                  {variant.price_adjustment > 0 ? '+' : ''}{variant.price_adjustment} FCFA
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingVariant ? 'Modifier' : 'Ajouter'} une variante</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Nom de la variante</Label>
              <Input
                value={formData.variant_name}
                onChange={(e) => setFormData({ ...formData, variant_name: e.target.value })}
                placeholder="Ex: Rouge - Taille M"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Couleur</Label>
                <Input
                  value={formData.attributes.color}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    attributes: { ...formData.attributes, color: e.target.value }
                  })}
                  placeholder="Rouge"
                />
              </div>
              <div>
                <Label>Taille</Label>
                <Input
                  value={formData.attributes.size}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    attributes: { ...formData.attributes, size: e.target.value }
                  })}
                  placeholder="M"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>SKU</Label>
                <Input
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="SKU-001"
                />
              </div>
              <div>
                <Label>Quantité disponible</Label>
                <Input
                  type="number"
                  value={formData.quantity_available}
                  onChange={(e) => setFormData({ ...formData, quantity_available: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <Label>Ajustement de prix (FCFA)</Label>
              <Input
                type="number"
                value={formData.price_adjustment}
                onChange={(e) => setFormData({ ...formData, price_adjustment: parseFloat(e.target.value) })}
                placeholder="0"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={closeDialog} className="flex-1">
                Annuler
              </Button>
              <Button onClick={handleSubmit} className="flex-1 bg-emerald-500 hover:bg-emerald-600">
                {editingVariant ? 'Mettre à jour' : 'Créer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}