import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { api } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Clock, MapPin, ShoppingCart, Plus, Minus, 
  CheckCircle, Shield, Truck, Store, Share2, Heart,
  Leaf, AlertTriangle
} from 'lucide-react';
import ReportModal from '@/components/safety/ReportModal';
import TrustBadge from '@/components/safety/TrustBadge';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from 'sonner';
import { goToLogin } from '@/lib/navigation';

export default function ProductDetail() {
  const [user, setUser] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await api.auth.me();
        setUser(userData);
      } catch {
        // Visiteur non connecté : la page reste consultable en anonyme.
      }
    };
    loadUser();
  }, []);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => api.entities.Product.filter({ id: productId }),
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
      goToLogin();
      return;
    }

    setIsAddingToCart(true);
    
    const existingItems = await api.entities.CartItem.filter({ 
      user_email: user.email, 
      product_id: product.id 
    });
    
    if (existingItems.length > 0) {
      await api.entities.CartItem.update(existingItems[0].id, {
        quantity: (existingItems[0].quantity || 1) + quantity
      });
    } else {
      await api.entities.CartItem.create({
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
            <ReportModal 
              entityType="product" 
              entityId={product.id} 
              entityName={product.name}
            />
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
            <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                    <TrustBadge 
                        verificationStatus={product.is_verified ? 'verified' : 'unverified'} 
                        trustScore={95} // Mock score for now, would come from store entity
                        showScore={true}
                    />
                </div>
                <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-xl p-3 text-center border">
                    <Shield className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                    <span className="text-xs text-gray-600">Paiement Sécurisé</span>
                </div>
                <div className="bg-white rounded-xl p-3 text-center border">
                    <Clock className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                    <span className="text-xs text-gray-600">Frais garanti</span>
                </div>
                <div className="bg-white rounded-xl p-3 text-center border">
                    <Truck className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                    <span className="text-xs text-gray-600">Suivi Livraison</span>
                </div>
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

            {/* Freshness score */}
            {product.freshness_score && (
              <div className="bg-emerald-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Leaf className="w-4 h-4 text-emerald-500" />
                    Score de fraîcheur
                  </span>
                  <span className="font-bold text-emerald-600">{product.freshness_score}/100</span>
                </div>
                <Progress value={product.freshness_score} className="h-2" />
              </div>
            )}

            {/* CO2 impact */}
            {product.co2_saved && (
              <div className="flex items-center gap-3 p-3 bg-teal-50 rounded-xl">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <Leaf className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-teal-800">Impact écologique</p>
                  <p className="text-xs text-teal-600">En achetant ce produit, vous évitez {product.co2_saved}kg de CO2</p>
                </div>
              </div>
            )}

            {/* Allergens warning */}
            {product.allergens?.length > 0 && (
              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Allergènes</p>
                  <p className="text-xs text-amber-600">{product.allergens.join(', ')}</p>
                </div>
              </div>
            )}

            {/* Additional product info */}
            {product.weight && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Poids / Volume</span>
                <span className="font-medium">{product.weight} {product.weight_unit}</span>
              </div>
            )}

            {product.brand && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Marque</span>
                <span className="font-medium">{product.brand}</span>
              </div>
            )}
          </motion.div>
        </div>

        {/* Store Info Section */}
        <Card className="p-6 mt-6">
          <h3 className="font-bold text-lg mb-4">À propos du magasin</h3>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Store className="w-8 h-8 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-lg">{product.store_name}</h4>
              {product.store_location && (
                <p className="text-gray-500 flex items-center gap-1 mt-1">
                  <MapPin className="w-4 h-4" />
                  {product.store_location}
                </p>
              )}
              <div className="flex gap-2 mt-3">
                <Badge variant="outline">Partenaire vérifié</Badge>
                {product.quantity_available > 10 && (
                  <Badge className="bg-green-100 text-green-700">En stock</Badge>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Nutritional Info */}
        {product.nutritional_info && (
          <Card className="p-6 mt-6">
            <h3 className="font-bold text-lg mb-4">Informations nutritionnelles</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(product.nutritional_info).map(([key, value]) => (
                <div key={key} className="flex justify-between p-2 border-b">
                  <span className="text-gray-600 capitalize">{key}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
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