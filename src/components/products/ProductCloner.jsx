import React, { useState } from 'react';
import { api } from '@/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Copy, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from 'sonner';

export default function ProductCloner({ product, onCloneSuccess }) {
  const [showDialog, setShowDialog] = useState(false);
  const [newName, setNewName] = useState('');
  const queryClient = useQueryClient();

  const cloneMutation = useMutation({
    mutationFn: async () => {
      const clonedProduct = {
        ...product,
        name: newName || `${product.name} (Copie)`,
        quantity_sold: 0,
        views_count: 0,
        favorites_count: 0,
        status: 'active'
      };
      
      // Remove ID and timestamps
      delete clonedProduct.id;
      delete clonedProduct.created_date;
      delete clonedProduct.updated_date;
      
      return api.entities.Product.create(clonedProduct);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['partner-products'] });
      toast.success('Produit cloné avec succès');
      setShowDialog(false);
      setNewName('');
      if (onCloneSuccess) onCloneSuccess(data);
    }
  });

  const handleClone = () => {
    cloneMutation.mutate();
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          setNewName(`${product.name} (Copie)`);
          setShowDialog(true);
        }}
      >
        <Copy className="w-4 h-4 mr-1" />
        Cloner
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cloner le produit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Nom du nouveau produit</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={`${product.name} (Copie)`}
              />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
              <p className="text-blue-900 font-medium mb-1">Information</p>
              <p className="text-blue-700">
                Ce produit sera cloné avec toutes ses caractéristiques (prix, catégorie, description, etc.).
                Les compteurs (vues, favoris, ventes) seront réinitialisés.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowDialog(false)} className="flex-1">
                Annuler
              </Button>
              <Button 
                onClick={handleClone}
                disabled={cloneMutation.isPending}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600"
              >
                {cloneMutation.isPending ? (
                  <>Clonage...</>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Cloner le produit
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}