import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Zap, Plus, Edit2, Trash2, Clock, Package, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

const categories = [
  { id: 'fruits_legumes', label: 'Fruits & Légumes' },
  { id: 'produits_laitiers', label: 'Produits laitiers' },
  { id: 'viandes_poissons', label: 'Viandes & Poissons' },
  { id: 'boulangerie', label: 'Boulangerie' },
  { id: 'epicerie', label: 'Épicerie' },
  { id: 'boissons', label: 'Boissons' },
  { id: 'surgeles', label: 'Surgelés' },
  { id: 'hygiene', label: 'Hygiène' },
];

export default function PromotionAutomation({ storeId }) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [formData, setFormData] = useState({
    rule_name: '',
    trigger_type: 'dlc_based',
    conditions: {
      days_before_dlc: 3,
      stock_threshold: 10
    },
    discount_action: {
      discount_type: 'percentage',
      discount_value: 30
    },
    applies_to: 'all_products',
    target_categories: []
  });
  const queryClient = useQueryClient();

  const { data: rules = [] } = useQuery({
    queryKey: ['promotion-rules', storeId],
    queryFn: () => base44.entities.PromotionRule.filter({ store_id: storeId }),
    enabled: !!storeId
  });

  const createRuleMutation = useMutation({
    mutationFn: (data) => base44.entities.PromotionRule.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotion-rules'] });
      toast.success('Règle créée');
      closeDialog();
    }
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PromotionRule.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotion-rules'] });
      toast.success('Règle mise à jour');
      closeDialog();
    }
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (id) => base44.entities.PromotionRule.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotion-rules'] });
      toast.success('Règle supprimée');
    }
  });

  const toggleRuleMutation = useMutation({
    mutationFn: ({ id, isActive }) => 
      base44.entities.PromotionRule.update(id, { is_active: isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotion-rules'] });
    }
  });

  const openCreateDialog = () => {
    setEditingRule(null);
    setFormData({
      rule_name: '',
      trigger_type: 'dlc_based',
      conditions: {
        days_before_dlc: 3,
        stock_threshold: 10
      },
      discount_action: {
        discount_type: 'percentage',
        discount_value: 30
      },
      applies_to: 'all_products',
      target_categories: []
    });
    setShowDialog(true);
  };

  const openEditDialog = (rule) => {
    setEditingRule(rule);
    setFormData({
      rule_name: rule.rule_name,
      trigger_type: rule.trigger_type,
      conditions: rule.conditions || {},
      discount_action: rule.discount_action || {},
      applies_to: rule.applies_to,
      target_categories: rule.target_categories || []
    });
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setEditingRule(null);
  };

  const handleSubmit = () => {
    const ruleData = {
      store_id: storeId,
      ...formData,
      is_active: true
    };

    if (editingRule) {
      updateRuleMutation.mutate({ id: editingRule.id, data: ruleData });
    } else {
      createRuleMutation.mutate(ruleData);
    }
  };

  const getTriggerLabel = (type) => {
    switch (type) {
      case 'dlc_based': return 'Basé sur DLC';
      case 'stock_based': return 'Basé sur stock';
      case 'time_based': return 'Basé sur le temps';
      default: return 'Manuel';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-500" />
            Automatisation des promotions
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Créez des règles pour automatiser vos réductions
          </p>
        </div>
        <Button onClick={openCreateDialog} className="bg-purple-500">
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle règle
        </Button>
      </div>

      {/* Rules List */}
      <div className="space-y-3">
        {rules.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Zap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">Aucune règle d'automatisation</p>
            <Button onClick={openCreateDialog} variant="outline">
              Créer ma première règle
            </Button>
          </div>
        ) : (
          rules.map((rule) => (
            <Card key={rule.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{rule.rule_name}</h3>
                    <Badge variant="outline">{getTriggerLabel(rule.trigger_type)}</Badge>
                    {rule.is_active ? (
                      <Badge className="bg-green-500">Actif</Badge>
                    ) : (
                      <Badge variant="outline">Inactif</Badge>
                    )}
                  </div>

                  <div className="space-y-1 text-sm text-gray-600">
                    {rule.trigger_type === 'dlc_based' && rule.conditions?.days_before_dlc && (
                      <p className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {rule.conditions.days_before_dlc} jours avant expiration
                      </p>
                    )}
                    {rule.trigger_type === 'stock_based' && rule.conditions?.stock_threshold && (
                      <p className="flex items-center gap-1">
                        <Package className="w-4 h-4" />
                        Stock inférieur à {rule.conditions.stock_threshold} unités
                      </p>
                    )}
                    {rule.discount_action && (
                      <p className="flex items-center gap-1">
                        <TrendingDown className="w-4 h-4" />
                        Réduction de {rule.discount_action.discount_value}
                        {rule.discount_action.discount_type === 'percentage' ? '%' : ' FCFA'}
                      </p>
                    )}
                  </div>

                  {rule.execution_count > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      Exécutée {rule.execution_count} fois
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={rule.is_active}
                    onCheckedChange={(checked) =>
                      toggleRuleMutation.mutate({ id: rule.id, isActive: checked })
                    }
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => openEditDialog(rule)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-red-500"
                    onClick={() => deleteRuleMutation.mutate(rule.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? 'Modifier la règle' : 'Nouvelle règle d\'automatisation'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label>Nom de la règle</Label>
              <Input
                value={formData.rule_name}
                onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
                placeholder="Ex: Réduction DLC -30%"
              />
            </div>

            <div>
              <Label>Type de déclencheur</Label>
              <Select
                value={formData.trigger_type}
                onValueChange={(value) => setFormData({ ...formData, trigger_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dlc_based">Basé sur DLC</SelectItem>
                  <SelectItem value="stock_based">Basé sur stock</SelectItem>
                  <SelectItem value="time_based">Basé sur le temps</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.trigger_type === 'dlc_based' && (
              <div>
                <Label>Jours avant expiration</Label>
                <Input
                  type="number"
                  value={formData.conditions.days_before_dlc || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    conditions: { ...formData.conditions, days_before_dlc: parseInt(e.target.value) }
                  })}
                  placeholder="3"
                />
              </div>
            )}

            {formData.trigger_type === 'stock_based' && (
              <div>
                <Label>Seuil de stock (unités)</Label>
                <Input
                  type="number"
                  value={formData.conditions.stock_threshold || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    conditions: { ...formData.conditions, stock_threshold: parseInt(e.target.value) }
                  })}
                  placeholder="10"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type de réduction</Label>
                <Select
                  value={formData.discount_action.discount_type}
                  onValueChange={(value) => setFormData({
                    ...formData,
                    discount_action: { ...formData.discount_action, discount_type: value }
                  })}
                >
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
                <Label>Valeur</Label>
                <Input
                  type="number"
                  value={formData.discount_action.discount_value || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    discount_action: { ...formData.discount_action, discount_value: parseInt(e.target.value) }
                  })}
                  placeholder="30"
                />
              </div>
            </div>

            <div>
              <Label>Appliquer à</Label>
              <Select
                value={formData.applies_to}
                onValueChange={(value) => setFormData({ ...formData, applies_to: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_products">Tous les produits</SelectItem>
                  <SelectItem value="specific_category">Catégories spécifiques</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.applies_to === 'specific_category' && (
              <div>
                <Label>Catégories ciblées</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {categories.map((cat) => (
                    <label key={cat.id} className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={formData.target_categories.includes(cat.id)}
                        onChange={(e) => {
                          const newCategories = e.target.checked
                            ? [...formData.target_categories, cat.id]
                            : formData.target_categories.filter(c => c !== cat.id);
                          setFormData({ ...formData, target_categories: newCategories });
                        }}
                      />
                      <span className="text-sm">{cat.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={closeDialog} className="flex-1">
                Annuler
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!formData.rule_name || !formData.discount_action.discount_value}
                className="flex-1 bg-purple-500"
              >
                {editingRule ? 'Mettre à jour' : 'Créer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}