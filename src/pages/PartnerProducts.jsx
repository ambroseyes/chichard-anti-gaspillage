import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import ProductVariantManager from '@/components/products/ProductVariantManager';
import StockHistoryViewer from '@/components/products/StockHistoryViewer';
import ProductCloner from '@/components/products/ProductCloner';
import PartnerChatbot from '@/components/partner/PartnerChatbot';
import { format } from 'date-fns';
import {
  Plus, Search, Edit2, Trash2, Clock, Package,
  AlertTriangle, CheckCircle, X, Upload, Sparkles
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from 'sonner';

const categories = [
  { id: 'fruits_legumes', label: 'Fruits & Légumes', emoji: '🥬' },
  { id: 'produits_laitiers', label: 'Produits laitiers', emoji: '🥛' },
  { id: 'viandes_poissons', label: 'Viandes & Poissons', emoji: '🥩' },
  { id: 'boulangerie', label: 'Boulangerie', emoji: '🥖' },
  { id: 'epicerie', label: 'Épicerie', emoji: '🛒' },
  { id: 'boissons', label: 'Boissons', emoji: '🥤' },
  { id: 'surgeles', label: 'Surgelés', emoji: '❄️' },
  { id: 'hygiene', label: 'Hygiène', emoji: '🧴' },
];

const emptyProduct = {
  name: '',
  description: '',
  category: '',
  original_price: '',
  discounted_price: '',
  expiration_date: '',
  quantity_available: '',
  image_url: '',
};

export default function PartnerProducts() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState(emptyProduct);
  const [isUploading, setIsUploading] = useState(false);
  const [showVariantsDialog, setShowVariantsDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {
        base44.auth.redirectToLogin();
      }
    };
    loadUser();
  }, []);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['partner-products', user?.email],
    queryFn: () => base44.entities.Product.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Product.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-products'] });
      toast.success('Produit ajouté');
      closeDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Product.update(id, data),
    onSuccess: async (_, { id, data }) => {
      queryClient.invalidateQueries({ queryKey: ['partner-products'] });
      toast.success('Produit mis à jour');
      
      // Check for low stock alert
      if (data.quantity_available && data.quantity_available <= 5) {
        await sendLowStockAlert(data);
      }
      
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Product.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-products'] });
      toast.success('Produit supprimé');
    },
  });

  const openCreateDialog = () => {
    setEditingProduct(null);
    setFormData(emptyProduct);
    setShowDialog(true);
  };

  const openEditDialog = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      description: product.description || '',
      category: product.category || '',
      original_price: product.original_price || '',
      discounted_price: product.discounted_price || '',
      expiration_date: product.expiration_date || '',
      quantity_available: product.quantity_available || '',
      image_url: product.image_url || '',
    });
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setEditingProduct(null);
    setFormData(emptyProduct);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFormData({ ...formData, image_url: file_url });
    setIsUploading(false);
  };

  const handleSubmit = () => {
    const productData = {
      ...formData,
      original_price: Number(formData.original_price),
      discounted_price: Number(formData.discounted_price),
      quantity_available: Number(formData.quantity_available),
      store_name: user.full_name,
      status: 'active',
      is_verified: true,
    };

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: productData });
    } else {
      createMutation.mutate(productData);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDaysLeft = (date) => {
    return Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
  };

  const sendLowStockAlert = async (product) => {
    try {
      // Send email to partner
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: `⚠️ Stock faible - ${product.name}`,
        body: `
          <h2>Alerte stock faible</h2>
          <p>Bonjour,</p>
          <p>Le stock du produit <strong>${product.name}</strong> est faible.</p>
          <p><strong>Quantité restante:</strong> ${product.quantity_available} unités</p>
          <p>Pensez à réapprovisionner pour éviter les ruptures de stock.</p>
          <br>
          <a href="${window.location.origin}/PartnerProducts" style="display: inline-block; padding: 12px 24px; background-color: #10B981; color: white; text-decoration: none; border-radius: 8px;">
            Voir mes produits
          </a>
        `
      });

      // Create notification
      await base44.entities.Notification.create({
        user_email: user.email,
        title: 'Stock faible',
        message: `Le produit "${product.name}" n'a plus que ${product.quantity_available} unités en stock`,
        type: 'system',
        action_url: '/PartnerProducts'
      });
    } catch (error) {
      console.error('Failed to send low stock alert:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mes produits</h1>
            <p className="text-gray-500">{products.length} produit{products.length > 1 ? 's' : ''}</p>
          </div>
          <Button onClick={openCreateDialog} className="bg-emerald-500 hover:bg-emerald-600">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un produit
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Rechercher un produit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11"
          />
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="p-4 animate-pulse">
                <div className="w-full aspect-video bg-gray-200 rounded-lg mb-4" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </Card>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">Aucun produit</h3>
            <p className="text-gray-500 mb-4">Commencez par ajouter vos premiers produits</p>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un produit
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredProducts.map((product) => {
                const daysLeft = getDaysLeft(product.expiration_date);
                const discount = Math.round(
                  (1 - product.discounted_price / product.original_price) * 100
                );

                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <Card className="overflow-hidden">
                      <div className="relative aspect-video bg-gray-100">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl">
                            {categories.find(c => c.id === product.category)?.emoji || '🛒'}
                          </div>
                        )}
                        <div className="absolute top-2 left-2 flex gap-2">
                          <Badge className="bg-orange-500">-{discount}%</Badge>
                          <Badge className={
                            daysLeft <= 1 ? 'bg-red-500' :
                            daysLeft <= 3 ? 'bg-orange-500' :
                            'bg-emerald-500'
                          }>
                            {daysLeft <= 0 ? 'Expiré' : `${daysLeft}j`}
                          </Badge>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="font-semibold text-gray-900 flex-1">{product.name}</h3>
                          {product.quantity_available <= 5 && (
                            <AlertTriangle className="w-5 h-5 text-orange-500 ml-2" />
                          )}
                        </div>
                        <p className={`text-sm mb-3 ${
                          product.quantity_available <= 5 ? 'text-orange-600 font-medium' : 'text-gray-500'
                        }`}>
                          {product.quantity_available} disponible{product.quantity_available > 1 ? 's' : ''}
                          {product.quantity_available <= 5 && ' - Stock faible!'}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <ProductCloner product={product} />
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedProduct(product);
                              setShowVariantsDialog(true);
                            }}
                          >
                            Variantes
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedProduct(product);
                              setShowHistoryDialog(true);
                            }}
                          >
                            Historique
                          </Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-emerald-600">
                              {product.discounted_price?.toLocaleString()} F
                            </span>
                            <span className="text-sm text-gray-400 line-through ml-2">
                              {product.original_price?.toLocaleString()} F
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => openEditDialog(product)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="text-red-500 hover:text-red-600"
                              onClick={() => deleteMutation.mutate(product.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Modifier le produit' : 'Ajouter un produit'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Image Upload */}
            <div>
              <Label>Image du produit</Label>
              <div className="mt-2">
                {formData.image_url ? (
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => setFormData({ ...formData, image_url: '' })}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">
                      {isUploading ? 'Chargement...' : 'Cliquez pour ajouter'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                    />
                  </label>
                )}
              </div>
            </div>

            <div>
              <Label>Nom du produit</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Yaourt nature"
              />
            </div>

            <div>
              <Label>Catégorie</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => setFormData({ ...formData, category: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.emoji} {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Prix original (FCFA)</Label>
                <Input
                  type="number"
                  value={formData.original_price}
                  onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                  placeholder="5000"
                />
              </div>
              <div>
                <Label>Prix réduit (FCFA)</Label>
                <Input
                  type="number"
                  value={formData.discounted_price}
                  onChange={(e) => setFormData({ ...formData, discounted_price: e.target.value })}
                  placeholder="2500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date d'expiration</Label>
                <Input
                  type="date"
                  value={formData.expiration_date}
                  onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Quantité disponible</Label>
                <Input
                  type="number"
                  value={formData.quantity_available}
                  onChange={(e) => setFormData({ ...formData, quantity_available: e.target.value })}
                  placeholder="10"
                />
              </div>
            </div>

            <div>
              <Label>Description (optionnel)</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description du produit..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={closeDialog} className="flex-1">
                Annuler
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!formData.name || !formData.category || !formData.original_price || !formData.discounted_price || !formData.expiration_date}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600"
              >
                {editingProduct ? 'Mettre à jour' : 'Ajouter'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Variants Dialog */}
      <Dialog open={showVariantsDialog} onOpenChange={setShowVariantsDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Variantes - {selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <ProductVariantManager product={selectedProduct} />
          )}
        </DialogContent>
      </Dialog>

      {/* Stock History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Historique du stock - {selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <StockHistoryViewer productId={selectedProduct.id} />
          )}
        </DialogContent>
      </Dialog>

      {/* AI Chatbot */}
      <PartnerChatbot />
    </div>
  );
}