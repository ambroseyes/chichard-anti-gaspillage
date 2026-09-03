import React, { useState } from 'react';
import { api } from '@/api';
import { useQueryClient } from '@tanstack/react-query';
import { Download, Check,
  Loader2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';

export default function BulkProductManager({ products, user }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [discountPercent, setDiscountPercent] = useState(20);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedIds(selectedIds.length === products.length ? [] : products.map(p => p.id));
  };

  const executeBulkAction = async () => {
    if (selectedIds.length === 0) {
      toast.error('Sélectionnez au moins un produit');
      return;
    }

    setLoading(true);
    const selectedProducts = products.filter(p => selectedIds.includes(p.id));

    try {
      switch (bulkAction) {
        case 'discount':
          for (const product of selectedProducts) {
            const newPrice = Math.round(product.original_price * (1 - discountPercent / 100));
            await api.entities.Product.update(product.id, { discounted_price: newPrice });
          }
          toast.success(`${selectedIds.length} produit(s) mis à jour avec -${discountPercent}%`);
          break;

        case 'deactivate':
          for (const product of selectedProducts) {
            await api.entities.Product.update(product.id, { status: 'expired' });
          }
          toast.success(`${selectedIds.length} produit(s) désactivé(s)`);
          break;

        case 'delete':
          for (const product of selectedProducts) {
            await api.entities.Product.delete(product.id);
          }
          toast.success(`${selectedIds.length} produit(s) supprimé(s)`);
          break;

        case 'activate':
          for (const product of selectedProducts) {
            await api.entities.Product.update(product.id, { status: 'active' });
          }
          toast.success(`${selectedIds.length} produit(s) activé(s)`);
          break;
      }

      queryClient.invalidateQueries({ queryKey: ['partner-products'] });
      setSelectedIds([]);
      setBulkAction('');
    } catch (e) {
      toast.error('Erreur lors de la mise à jour');
    }
    setLoading(false);
  };

  const exportCSV = () => {
    const headers = ['Nom', 'Catégorie', 'Prix Original', 'Prix Réduit', 'Quantité', 'Expiration', 'Statut'];
    const rows = products.map(p => [
      p.name, p.category, p.original_price, p.discounted_price, 
      p.quantity_available, p.expiration_date, p.status
    ]);
    
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `produits_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Export CSV téléchargé');
  };

  return (
    <Card className="p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Checkbox 
            checked={selectedIds.length === products.length && products.length > 0}
            onCheckedChange={selectAll}
          />
          <span className="text-sm text-gray-600">
            {selectedIds.length} sélectionné(s) sur {products.length}
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="w-4 h-4 mr-1" />
          Exporter CSV
        </Button>
      </div>

      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <Select value={bulkAction} onValueChange={setBulkAction}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Action groupée" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="discount">Appliquer réduction</SelectItem>
              <SelectItem value="activate">Activer</SelectItem>
              <SelectItem value="deactivate">Désactiver</SelectItem>
              <SelectItem value="delete">Supprimer</SelectItem>
            </SelectContent>
          </Select>

          {bulkAction === 'discount' && (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                className="w-20"
                min="1"
                max="90"
              />
              <span className="text-sm">%</span>
            </div>
          )}

          <Button 
            onClick={executeBulkAction}
            disabled={!bulkAction || loading}
            className={bulkAction === 'delete' ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
            Appliquer
          </Button>
        </div>
      )}

      {/* Product List with Checkboxes */}
      <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
        {products.map((product) => {
          const daysLeft = Math.ceil((new Date(product.expiration_date) - new Date()) / 86400000);
          return (
            <div 
              key={product.id}
              className={`flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 ${
                selectedIds.includes(product.id) ? 'bg-emerald-50' : ''
              }`}
            >
              <Checkbox 
                checked={selectedIds.includes(product.id)}
                onCheckedChange={() => toggleSelect(product.id)}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{product.name}</p>
                <p className="text-xs text-gray-500">
                  {product.quantity_available} dispo • {daysLeft}j restants
                </p>
              </div>
              <span className="text-sm font-medium text-emerald-600">
                {product.discounted_price?.toLocaleString()} F
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}