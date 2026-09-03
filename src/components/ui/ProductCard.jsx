import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, ShoppingCart, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const getUrgencyConfig = (expirationDate) => {
  const today = new Date();
  const expDate = new Date(expirationDate);
  const daysLeft = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
  
  if (daysLeft <= 1) return { level: 'critical', color: 'bg-red-500', text: 'Expire aujourd\'hui', textColor: 'text-red-600' };
  if (daysLeft <= 3) return { level: 'urgent', color: 'bg-orange-500', text: `${daysLeft}j restants`, textColor: 'text-orange-600' };
  if (daysLeft <= 5) return { level: 'soon', color: 'bg-yellow-500', text: `${daysLeft}j restants`, textColor: 'text-yellow-600' };
  return { level: 'normal', color: 'bg-emerald-500', text: `${daysLeft}j restants`, textColor: 'text-emerald-600' };
};

const getDiscountPercent = (original, discounted) => {
  return Math.round((1 - discounted / original) * 100);
};

export default function ProductCard({ product, onAddToCart, compact = false }) {
  const urgency = getUrgencyConfig(product.expiration_date);
  const discount = getDiscountPercent(product.original_price, product.discounted_price);
  
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group"
    >
      <Link to={createPageUrl(`ProductDetail?id=${product.id}`)}>
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          {product.image_url ? (
            <img 
              src={product.image_url} 
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">
              {categoryLabels[product.category]?.split(' ')[0] || '🛒'}
            </div>
          )}
          
          {/* Discount Badge */}
          <div className="absolute top-3 left-3">
            <Badge className="bg-orange-500 text-white font-bold text-sm px-2.5 py-1 shadow-lg">
              -{discount}%
            </Badge>
          </div>
          
          {/* Urgency Badge */}
          <div className="absolute top-3 right-3">
            <Badge className={`${urgency.color} text-white text-xs px-2 py-1 flex items-center gap-1`}>
              <Clock className="w-3 h-3" />
              {urgency.text}
            </Badge>
          </div>
          
          {/* Verified Badge */}
          {product.is_verified && (
            <div className="absolute bottom-3 right-3">
              <div className="bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-sm">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              </div>
            </div>
          )}
        </div>
      </Link>
      
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-gray-900 line-clamp-2 leading-tight">
            {product.name}
          </h3>
        </div>
        
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
          <MapPin className="w-3.5 h-3.5" />
          <span className="truncate">{product.store_name}</span>
        </div>
        
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs text-gray-400 line-through">
              {product.original_price?.toLocaleString()} FCFA
            </div>
            <div className="text-lg font-bold text-emerald-600">
              {product.discounted_price?.toLocaleString()} FCFA
            </div>
          </div>
          
          <Button 
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAddToCart?.(product);
            }}
            className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-9 px-3"
          >
            <ShoppingCart className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}