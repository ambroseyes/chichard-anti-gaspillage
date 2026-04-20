import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Clock, Leaf, Star } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import StoreRatingBadge from './StoreRatingBadge';

export default function BasketCard({ basket, onReserve }) {
  const discount = Math.round((1 - basket.discounted_price / basket.original_price) * 100);
  const remaining = basket.quantity_available - (basket.quantity_reserved || 0);
  const isSoldOut = remaining <= 0 || basket.status === 'sold_out';

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <div className="relative">
        {basket.image_url ? (
          <img src={basket.image_url} alt={basket.name} className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-44 bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
            <ShoppingBag className="w-16 h-16 text-emerald-400" />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <Badge className="bg-orange-500 text-white font-bold text-sm">-{discount}%</Badge>
        </div>
        {basket.basket_type === 'surprise_basket' && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-purple-500 text-white">🎁 Surprise</Badge>
          </div>
        )}
        {isSoldOut && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-bold text-lg">Épuisé</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-semibold text-gray-900 leading-tight">{basket.name}</h3>
          {basket.co2_saved_kg && (
            <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium ml-2 shrink-0">
              <Leaf className="w-3 h-3" /> {basket.co2_saved_kg}kg CO₂
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mb-1">
          <p className="text-xs text-gray-500">{basket.store_name}</p>
          <StoreRatingBadge storeId={basket.store_id} />
        </div>
        {basket.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{basket.description}</p>
        )}

        <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
          <Clock className="w-3.5 h-3.5" />
          <span>Retrait le {format(new Date(basket.pickup_date), 'dd MMM', { locale: fr })}</span>
          {basket.pickup_slots?.length > 0 && (
            <span className="text-emerald-600">· {basket.pickup_slots.length} créneaux</span>
          )}
        </div>

        <div className="flex items-center gap-2 mb-1 text-xs text-orange-600">
          {remaining <= 3 && !isSoldOut && (
            <span className="font-semibold">⚡ Plus que {remaining} disponible{remaining > 1 ? 's' : ''}</span>
          )}
        </div>

        <div className="flex items-center justify-between mt-3">
          <div>
            <span className="text-xl font-bold text-gray-900">{basket.discounted_price.toLocaleString()} F</span>
            <span className="text-sm text-gray-400 line-through ml-2">{basket.original_price.toLocaleString()} F</span>
          </div>
          <Button
            onClick={() => onReserve(basket)}
            disabled={isSoldOut}
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
            size="sm"
          >
            Réserver
          </Button>
        </div>
      </div>
    </Card>
  );
}