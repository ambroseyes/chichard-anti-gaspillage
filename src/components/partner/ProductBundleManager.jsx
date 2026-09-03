import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Package, Plus, Trash2, Edit, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ProductBundleManager({ storeEmail }) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingBundle, setEditingBundle] = useState(null);
  const [bundleData, setBundleData] = useState({
    name: '',
    description: '',
    discounted_price: '',
    original_price: '',
    bundle_products: []
  });
  const [selectedProducts, setSelectedProducts] = useState([]);
  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ['partner-products', storeEmail],
    queryFn: () => api.entities.Product.filter({ created_by: storeEmail }),
    enabled: !!storeEmail,
  });

  const { data: bundles = [] } = useQuery({
    queryKey: ['product-bundles', storeEmail],
    queryFn: () => api.entities.Product.filter({ created_by: storeEmail, is_bundle: true }),
    enabled: !!storeEmail,
  });

  const createBundleMutation = useMutation({
    mutationFn: async (data) => {
      if (editingBundle) {
        return api.entities.Product.update(editingBundle.id, data);
      }
      return api.entities.Product.create({
        ...data,
        store_name: products[0]?.store_name,
        category: 'bundle',
        is_bundle: true,
        status: 'active',
        quantity_available: Math.min(...selectedProducts.map(p => p.quantity_available || 1)),
        expiration_date: selectedProducts.sort((a, b) => new Date(a.expiration_date) - new Date(b.expiration_date))[0]?.expiration_date
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-bundles'] });
      queryClient.invalidateQueries({ queryKey: ['partner-products'] });
      toast.success(editingBundle ? 'Pack mis à jour' : 'Pack créé avec succès');
      setShowDialog(false);
      resetForm();
    }
  });

  const deleteBundleMutation = useMutation({
    mutationFn: (id) => api.entities.Product.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-bundles'] });
      toast.success('Pack supprimé');
    }
  });

  const resetForm = () => {
    setBundleData({ name: '', description: '', discounted_price: '', original_price: '', bundle_products: [] });
    setSelectedProducts([]);
    setEditingBundle(null);
  };

  const handleProductToggle = (product) => {
    const isSelected = selectedProducts.find(p => p.id === product.id);
    if (isSelected) {
      setSelectedProducts(selectedProducts.filter(p => p.id !== product.id));
    } else {
      setSelectedProducts([...selectedProducts, product]);
    }
  };

  const calculateTotal = () => {
    return selectedProducts.reduce((sum, p) => sum + (p.discounted_price || 0), 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedProducts.length < 2) {
      toast.error('Sélectionnez au moins 2 produits');
      return;
    }

    createBundleMutation.mutate({
      ...bundleData,
      bundle_products: selectedProducts.map(p => p.id),
      original_price: parseFloat(bundleData.original_price) || calculateTotal(),
      discounted_price: parseFloat(bundleData.discounted_price)
    });
  };

  const availableProducts = products.filter(p => !p.is_bundle && p.status === 'active');

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-xl">
            <Package className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Packs & Offres groupées</h3>
            <p className="text-xs text-gray-500">{bundles.length} pack(s) actif(s)</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setShowDialog(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Créer un pack
        </Button>
      </div>

      <div className="space-y-3">
        {bundles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm">Aucun pack créé</p>
          </div>
        ) : (
          bundles.map((bundle) => (
            <div key={bundle.id} className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900">{bundle.name}</h4>
                    <Badge className="bg-indigo-100 text-indigo-700">
                      {bundle.bundle_products?.length || 0} produits
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{bundle.description}</p>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-emerald-600">
                      {bundle.discounted_price?.toLocaleString()} FCFA
                    </span>
                    <span className="text-sm text-gray-500 line-through">
                      {bundle.original_price?.toLocaleString()} FCFA
                    </span>
                    <Badge className="bg-orange-100 text-orange-700">
                      -{Math.round((1 - bundle.discounted_price / bundle.original_price) * 100)}%
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => {
                    setEditingBundle(bundle);
                    setBundleData(bundle);
                    setShowDialog(true);
                  }}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => deleteBundleMutation.mutate(bundle.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBundle ? 'Modifier le pack' : 'Créer un pack'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <Label>Nom du pack *</Label>
              <Input
                value={bundleData.name}
                onChange={(e) => setBundleData({ ...bundleData, name: e.target.value })}
                placeholder="Ex: Pack Petit-déjeuner"
                required
              />
            </div>

            <div>
              <Label>Description</Label>
              <Input
                value={bundleData.description}
                onChange={(e) => setBundleData({ ...bundleData, description: e.target.value })}
                placeholder="Décrivez le pack..."
              />
            </div>

            <div>
              <Label className="mb-2 block">Sélectionner les produits *</Label>
              <div className="border rounded-lg p-3 max-h-60 overflow-y-auto space-y-2">
                {availableProducts.map((product) => (
                  <label key={product.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedProducts.find(p => p.id === product.id)}
                      onChange={() => handleProductToggle(product)}
                      className="w-4 h-4"
                    />
                    <span className="flex-1 text-sm">{product.name}</span>
                    <span className="text-sm font-semibold text-emerald-600">
                      {product.discounted_price?.toLocaleString()} F
                    </span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {selectedProducts.length} produit(s) sélectionné(s) • Total: {calculateTotal().toLocaleString()} FCFA
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Prix original</Label>
                <Input
                  type="number"
                  value={bundleData.original_price}
                  onChange={(e) => setBundleData({ ...bundleData, original_price: e.target.value })}
                  placeholder={calculateTotal().toString()}
                />
              </div>
              <div>
                <Label>Prix du pack *</Label>
                <Input
                  type="number"
                  value={bundleData.discounted_price}
                  onChange={(e) => setBundleData({ ...bundleData, discounted_price: e.target.value })}
                  placeholder="Prix réduit"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => { setShowDialog(false); resetForm(); }} className="flex-1">
                Annuler
              </Button>
              <Button type="submit" disabled={createBundleMutation.isPending} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                {createBundleMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editingBundle ? 'Mettre à jour' : 'Créer le pack'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}