import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, TrendingDown, Store, Sparkles, Check, MapPin } from 'lucide-react';
import { toast } from 'sonner';

export default function SmartShoppingList({ userEmail }) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [selectedList, setSelectedList] = useState(null);
  const [newItemName, setNewItemName] = useState('');
  const queryClient = useQueryClient();

  const { data: lists = [] } = useQuery({
    queryKey: ['shopping-lists', userEmail],
    queryFn: () => base44.entities.ShoppingList.filter({ user_email: userEmail }, '-created_date'),
    enabled: !!userEmail
  });

  const { data: products = [] } = useQuery({
    queryKey: ['active-products-list'],
    queryFn: () => base44.entities.Product.filter({ status: 'active' }, '-created_date', 100),
  });

  const createListMutation = useMutation({
    mutationFn: (data) => base44.entities.ShoppingList.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-lists'] });
      setShowCreateDialog(false);
      setNewListName('');
      toast.success('Liste créée');
    }
  });

  const updateListMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ShoppingList.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-lists'] });
      toast.success('Liste mise à jour');
    }
  });

  const deleteListMutation = useMutation({
    mutationFn: (id) => base44.entities.ShoppingList.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-lists'] });
      toast.success('Liste supprimée');
      setSelectedList(null);
    }
  });

  const handleCreateList = () => {
    if (!newListName.trim()) return;
    
    createListMutation.mutate({
      user_email: userEmail,
      name: newListName,
      items: [],
      status: 'active'
    });
  };

  const handleAddItem = () => {
    if (!newItemName.trim() || !selectedList) return;

    const updatedItems = [
      ...selectedList.items,
      {
        product_name: newItemName,
        quantity: 1,
        is_checked: false,
        priority: 'medium'
      }
    ];

    updateListMutation.mutate({
      id: selectedList.id,
      data: { items: updatedItems }
    });

    setNewItemName('');
  };

  const toggleItem = (itemIndex) => {
    if (!selectedList) return;

    const updatedItems = selectedList.items.map((item, idx) =>
      idx === itemIndex ? { ...item, is_checked: !item.is_checked } : item
    );

    updateListMutation.mutate({
      id: selectedList.id,
      data: { items: updatedItems }
    });
  };

  const removeItem = (itemIndex) => {
    if (!selectedList) return;

    const updatedItems = selectedList.items.filter((_, idx) => idx !== itemIndex);

    updateListMutation.mutate({
      id: selectedList.id,
      data: { items: updatedItems }
    });
  };

  const optimizeList = async () => {
    if (!selectedList) return;

    // Find matching products and suggest stores
    const itemsWithProducts = selectedList.items.map(item => {
      const matching = products.filter(p =>
        p.name.toLowerCase().includes(item.product_name.toLowerCase())
      );
      return { ...item, matching_products: matching };
    });

    // Group by stores
    const storeScores = {};
    itemsWithProducts.forEach(item => {
      item.matching_products?.forEach(product => {
        if (!storeScores[product.store_id]) {
          storeScores[product.store_id] = {
            store_name: product.store_name,
            store_location: product.store_location,
            items_count: 0,
            total_price: 0,
            total_savings: 0
          };
        }
        storeScores[product.store_id].items_count++;
        storeScores[product.store_id].total_price += product.discounted_price;
        storeScores[product.store_id].total_savings += (product.original_price - product.discounted_price);
      });
    });

    // Sort stores by items count and savings
    const suggestedStores = Object.values(storeScores)
      .sort((a, b) => b.items_count - a.items_count || b.total_savings - a.total_savings)
      .slice(0, 3)
      .map(s => s.store_name);

    const totalSavings = Object.values(storeScores).reduce((sum, s) => sum + s.total_savings, 0);

    updateListMutation.mutate({
      id: selectedList.id,
      data: {
        stores_suggested: suggestedStores,
        savings_potential: totalSavings
      }
    });

    toast.success('Liste optimisée !');
  };

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Mes listes de courses</h2>
          <Button onClick={() => setShowCreateDialog(true)} className="bg-emerald-500">
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle liste
          </Button>
        </div>

        {lists.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              📝
            </div>
            <p className="text-gray-500 mb-4">Aucune liste de courses</p>
            <Button onClick={() => setShowCreateDialog(true)} variant="outline">
              Créer ma première liste
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {lists.map((list) => (
              <Card
                key={list.id}
                className={`p-4 cursor-pointer transition-all ${
                  selectedList?.id === list.id ? 'ring-2 ring-emerald-500' : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedList(list)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{list.name}</h3>
                    <p className="text-sm text-gray-500">
                      {list.items?.length || 0} article{(list.items?.length || 0) > 1 ? 's' : ''}
                    </p>
                    {list.savings_potential > 0 && (
                      <Badge className="mt-2 bg-emerald-500">
                        <TrendingDown className="w-3 h-3 mr-1" />
                        {list.savings_potential.toLocaleString()} F d'économies
                      </Badge>
                    )}
                  </div>
                  {list.status === 'completed' && (
                    <Badge className="bg-green-500">
                      <Check className="w-3 h-3 mr-1" />
                      Complétée
                    </Badge>
                  )}
                </div>

                {list.stores_suggested?.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-gray-500 mb-1">Magasins recommandés:</p>
                    <div className="flex flex-wrap gap-1">
                      {list.stores_suggested.map((store, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          <Store className="w-3 h-3 mr-1" />
                          {store}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Selected List Details */}
      {selectedList && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">{selectedList.name}</h3>
            <div className="flex gap-2">
              <Button
                onClick={optimizeList}
                variant="outline"
                size="sm"
                className="text-purple-600 border-purple-200"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Optimiser
              </Button>
              <Button
                onClick={() => deleteListMutation.mutate(selectedList.id)}
                variant="outline"
                size="sm"
                className="text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Add Item */}
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Ajouter un article..."
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
            />
            <Button onClick={handleAddItem}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Items List */}
          <div className="space-y-2">
            {selectedList.items?.map((item, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  item.is_checked ? 'bg-gray-50 opacity-60' : 'bg-white'
                }`}
              >
                <Checkbox
                  checked={item.is_checked}
                  onCheckedChange={() => toggleItem(idx)}
                />
                <div className="flex-1">
                  <p className={`font-medium ${item.is_checked ? 'line-through' : ''}`}>
                    {item.product_name}
                  </p>
                  {item.category && (
                    <Badge variant="outline" className="text-xs mt-1">
                      {item.category}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(idx)}
                  className="text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          {selectedList.items?.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Ajoutez des articles à votre liste
            </div>
          )}
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle liste de courses</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Input
              placeholder="Nom de la liste..."
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateList()}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleCreateList}
                disabled={!newListName.trim()}
                className="flex-1 bg-emerald-500"
              >
                Créer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}