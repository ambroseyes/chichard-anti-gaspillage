import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tag, Plus, Trash2, Edit, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

export default function PromotionManager({ storeId, storeEmail }) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [promoData, setPromoData] = useState({
    title: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    start_date: new Date(),
    end_date: new Date(),
    applicable_products: []
  });
  const [selectedProducts, setSelectedProducts] = useState([]);
  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ['partner-products', storeEmail],
    queryFn: () => base44.entities.Product.filter({ created_by: storeEmail }),
    enabled: !!storeEmail,
  });

  const { data: promotions = [] } = useQuery({
    queryKey: ['promotions', storeId],
    queryFn: () => base44.entities.Promotion.filter({ store_id: storeId }),
    enabled: !!storeId,
  });

  const createPromoMutation = useMutation({
    mutationFn: async (data) => {
      if (editingPromo) {
        return base44.entities.Promotion.update(editingPromo.id, data);
      }
      return base44.entities.Promotion.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      toast.success(editingPromo ? 'Promotion mise à jour' : 'Promotion créée');
      setShowDialog(false);
      resetForm();
    }
  });

  const deletePromoMutation = useMutation({
    mutationFn: (id) => base44.entities.Promotion.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      toast.success('Promotion supprimée');
    }
  });

  const resetForm = () => {
    setPromoData({
      title: '',
      description: '',
      discount_type: 'percentage',
      discount_value: '',
      start_date: new Date(),
      end_date: new Date(),
      applicable_products: []
    });
    setSelectedProducts([]);
    setEditingPromo(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createPromoMutation.mutate({
      ...promoData,
      store_id: storeId,
      discount_value: parseFloat(promoData.discount_value),
      start_date: format(promoData.start_date, 'yyyy-MM-dd'),
      end_date: format(promoData.end_date, 'yyyy-MM-dd'),
      applicable_products: selectedProducts.map(p => p.id)
    });
  };

  const isActive = (promo) => {
    const now = new Date();
    const start = new Date(promo.start_date);
    const end = new Date(promo.end_date);
    return now >= start && now <= end && promo.is_active;
  };

  const activePromotions = promotions.filter(isActive);
  const scheduledPromotions = promotions.filter(p => new Date(p.start_date) > new Date());
  const expiredPromotions = promotions.filter(p => new Date(p.end_date) < new Date());

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-xl">
            <Tag className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Promotions</h3>
            <p className="text-xs text-gray-500">{activePromotions.length} active(s)</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setShowDialog(true)} className="bg-orange-600 hover:bg-orange-700">
          <Plus className="w-4 h-4 mr-2" />
          Créer une promotion
        </Button>
      </div>

      <div className="space-y-4">
        {activePromotions.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Actives</h4>
            <div className="space-y-2">
              {activePromotions.map((promo) => (
                <PromotionCard key={promo.id} promo={promo} onEdit={setEditingPromo} onDelete={deletePromoMutation.mutate} />
              ))}
            </div>
          </div>
        )}

        {scheduledPromotions.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Programmées</h4>
            <div className="space-y-2">
              {scheduledPromotions.map((promo) => (
                <PromotionCard key={promo.id} promo={promo} onEdit={setEditingPromo} onDelete={deletePromoMutation.mutate} />
              ))}
            </div>
          </div>
        )}

        {promotions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm">Aucune promotion créée</p>
          </div>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPromo ? 'Modifier la promotion' : 'Créer une promotion'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <Label>Titre *</Label>
              <Input
                value={promoData.title}
                onChange={(e) => setPromoData({ ...promoData, title: e.target.value })}
                placeholder="Ex: -20% sur tous les fruits"
                required
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={promoData.description}
                onChange={(e) => setPromoData({ ...promoData, description: e.target.value })}
                placeholder="Détails de la promotion..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type de réduction *</Label>
                <Select value={promoData.discount_type} onValueChange={(v) => setPromoData({ ...promoData, discount_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Pourcentage</SelectItem>
                    <SelectItem value="fixed_amount">Montant fixe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valeur *</Label>
                <Input
                  type="number"
                  value={promoData.discount_value}
                  onChange={(e) => setPromoData({ ...promoData, discount_value: e.target.value })}
                  placeholder={promoData.discount_type === 'percentage' ? '20' : '5000'}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date de début *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {format(promoData.start_date, 'dd/MM/yyyy', { locale: fr })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <Calendar
                      mode="single"
                      selected={promoData.start_date}
                      onSelect={(date) => setPromoData({ ...promoData, start_date: date })}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Date de fin *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {format(promoData.end_date, 'dd/MM/yyyy', { locale: fr })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <Calendar
                      mode="single"
                      selected={promoData.end_date}
                      onSelect={(date) => setPromoData({ ...promoData, end_date: date })}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Produits concernés (optionnel)</Label>
              <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                {products.filter(p => p.status === 'active').map((product) => (
                  <label key={product.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedProducts.find(p => p.id === product.id)}
                      onChange={() => {
                        const isSelected = selectedProducts.find(p => p.id === product.id);
                        setSelectedProducts(isSelected ? selectedProducts.filter(p => p.id !== product.id) : [...selectedProducts, product]);
                      }}
                      className="w-4 h-4"
                    />
                    <span className="flex-1 text-sm">{product.name}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">Laissez vide pour appliquer à tous les produits</p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => { setShowDialog(false); resetForm(); }} className="flex-1">
                Annuler
              </Button>
              <Button type="submit" disabled={createPromoMutation.isPending} className="flex-1 bg-orange-600 hover:bg-orange-700">
                {createPromoMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editingPromo ? 'Mettre à jour' : 'Créer'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function PromotionCard({ promo, onEdit, onDelete }) {
  const isActive = new Date() >= new Date(promo.start_date) && new Date() <= new Date(promo.end_date) && promo.is_active;
  
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-gray-900">{promo.title}</h4>
            <Badge className={isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
              {isActive ? 'Active' : 'Programmée'}
            </Badge>
          </div>
          {promo.description && <p className="text-sm text-gray-600 mb-2">{promo.description}</p>}
          <div className="flex items-center gap-4 text-sm">
            <span className="font-semibold text-orange-600">
              {promo.discount_type === 'percentage' ? `-${promo.discount_value}%` : `-${promo.discount_value.toLocaleString()} FCFA`}
            </span>
            <span className="text-gray-500">
              {format(new Date(promo.start_date), 'dd/MM', { locale: fr })} - {format(new Date(promo.end_date), 'dd/MM', { locale: fr })}
            </span>
            {promo.applicable_products?.length > 0 && (
              <Badge variant="outline">{promo.applicable_products.length} produits</Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => onEdit(promo)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => onDelete(promo.id)}>
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      </div>
    </div>
  );
}