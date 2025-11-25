import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Clock, MapPin, ShoppingCart, Plus, Minus, 
  CheckCircle, Shield, Truck, Store, Share2, Heart
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from 'sonner';

export default function ProductDetail() {
  const [user, setUser] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {}
    };
    loadUser();
  }, []);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => base44.entities.Product.filter({ id: productId }),
    select: (data) => data[0],
    enabled: !!productId,
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Skeleton className="w-full aspect-square rounded-2xl mb-6" />
        <Skeleton className="h-8 w-3/4 mb-4" />
        <Skeleton className="h-6 w-1/2" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-semibold mb-2">Produit non trouvé</h2>
        <Link to={createPageUrl('Catalog')}>
          <Button>Retour au catalogue</Button>
        </Link>
      </div>
    );
  }

  const daysLeft = Math.ceil((new Date(product.expiration_date) - new Date()) / (1000 * 60 * 60 * 24));
  const discount = Math.round((1 - product.discounted_price / product.original_price) * 100);
  const savings = (product.original_price - product.discounted_price) * quantity;

  const getUrgencyColor = () => {
    if (daysLeft <= 1) return 'bg-red-500';
    if (daysLeft <= 3) return 'bg-orange-500';
    if (daysLeft <= 5) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  const categoryLabels = {
    fruits_legumes: '🥬 Fruits & Légumes',
    produits_laitiers: '🥛 Produits laitiers',
    viandes_poissons: '🥩 Viandes & Poissons',
    boulangerie: '🥖 Boulangerie',
    epicerie: '🛒 Épicerie',
    boissons: '🥤 Boissons',
    surgeles: '❄️ Surgelés',
    hygiene: '🧴 Hygiène'
  };

  const addToCart = async () => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }

    setIsAddingToCart(true);
    
    const existingItems = await base44.entities.CartItem.filter({ 
      user_email: user.email, 
      product_id: product.id 
    });
    
    if (existingItems.length > 0) {
      await base44.entities.CartItem.update(existingItems[0].id, {
        quantity: (existingItems[0].quantity || 1) + quantity
      });
    } else {
      await base44.entities.CartItem.create({
        user_email: user.email,
        product_id: product.id,
        product_name: product.name,
        product_image: product.image_url,
        quantity: quantity,
        unit_price: product.discounted_price,
        original_price: product.original_price,
        store_name: product.store_name,
        expiration_date: product.expiration_date
      });
    }

    setIsAddingToCart(false);
    toast.success('Ajouté au panier !');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-white sticky top-14 md:top-16 z-30 border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to={createPageUrl('Catalog')} className="flex items-center gap-2 text-gray-600">
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden md:inline">Retour</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Share2 className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Heart className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative"
          >
            <div className="aspect-square rounded-2xl overflow-hidden bg-white shadow-sm">
              {product.image_url ? (
                <img 
                  src={product.image_url} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-8xl">
                  {categoryLabels[product.category]?.split(' ')[0] || '🛒'}
                </div>
              )}
            </div>

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <Badge className="bg-orange-500 text-white font-bold text-lg px-3 py-1.5">
                -{discount}%
              </Badge>
              <Badge className={`${getUrgencyColor()} text-white flex items-center gap-1.5`}>
                <Clock className="w-3.5 h-3.5" />
                {daysLeft <= 1 ? "Expire aujourd'hui" : `${daysLeft}j restants`}
              </Badge>
            </div>

            {product.is_verified && (
              <div className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
              </div>
            )}
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div>
              <Badge variant="secondary" className="mb-3">
                {categoryLabels[product.category]}
              </Badge>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>
              <div className="flex items-center gap-2 text-gray-500">
                <Store className="w-4 h-4" />
                <span>{product.store_name}</span>
                {product.store_location && (
                  <>
                    <span>•</span>
                    <MapPin className="w-4 h-4" />
                    <span>{product.store_location}</span>
                  </>
                )}
              </div>
            </div>

            {/* Price */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-3xl font-bold text-emerald-600">
                  {product.discounted_price?.toLocaleString()} FCFA
                </span>
                <span className="text-lg text-gray-400 line-through">
                  {product.original_price?.toLocaleString()} FCFA
                </span>
              </div>
              <p className="text-emerald-700 font-medium">
                Vous économisez {savings.toLocaleString()} FCFA
              </p>
            </div>

            {/* Description */}
            {product.description && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600">{product.description}</p>
              </div>
            )}

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-xl p-3 text-center border">
                <Shield className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                <span className="text-xs text-gray-600">Vérifié</span>
              </div>
              <div className="bg-white rounded-xl p-3 text-center border">
                <Clock className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                <span className="text-xs text-gray-600">Frais garanti</span>
              </div>
              <div className="bg-white rounded-xl p-3 text-center border">
                <Truck className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                <span className="text-xs text-gray-600">Retrait rapide</span>
              </div>
            </div>

            {/* Quantity selector */}
            <div className="flex items-center gap-4">
              <span className="text-gray-700 font-medium">Quantité</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-12 text-center text-lg font-semibold">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.min(product.quantity_available || 10, quantity + 1))}
                  disabled={quantity >= (product.quantity_available || 10)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <span className="text-sm text-gray-500">
                {product.quantity_available || 10} disponibles
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Fixed bottom bar */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white border-t p-4 z-40">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <div className="flex-1">
            <div className="text-sm text-gray-500">Total</div>
            <div className="text-xl font-bold text-gray-900">
              {(product.discounted_price * quantity).toLocaleString()} FCFA
            </div>
          </div>
          <Button
            size="lg"
            onClick={addToCart}
            disabled={isAddingToCart}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 rounded-xl"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            {isAddingToCart ? 'Ajout...' : 'Ajouter au panier'}
          </Button>
        </div>
      </div>
    </div>
  );
}