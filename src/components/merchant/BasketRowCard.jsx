import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Pencil, Trash2, Package, Users, ChevronDown, ChevronUp,
  Minus, Plus, Eye, EyeOff, AlertTriangle, Clock
} from 'lucide-react';

export default function BasketRowCard({ basket, reservations, onEdit, onDelete, onToggleStatus }) {
  const [expanded, setExpanded] = useState(false);
  const [editingQty, setEditingQty] = useState(false);
  const [editingPrice, setEditingPrice] = useState(false);
  const [qty, setQty] = useState(basket.quantity_available);
  const [price, setPrice] = useState(basket.discounted_price);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.ClickCollectBasket.update(basket.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-baskets'] });
      toast.success('Mis à jour !');
      setEditingQty(false);
      setEditingPrice(false);
    },
  });

  const reserved = reservations.filter(r => ['reserved', 'confirmed'].includes(r.status)).length;
  const collected = reservations.filter(r => r.status === 'collected').length;
  const available = Math.max(0, basket.quantity_available - (basket.quantity_reserved || 0));
  const discountPct = basket.original_price > 0
    ? Math.round((1 - basket.discounted_price / basket.original_price) * 100)
    : 0;

  const statusColors = {
    active: 'bg-emerald-100 text-emerald-700',
    sold_out: 'bg-red-100 text-red-700',
    expired: 'bg-gray-100 text-gray-500',
  };

  const handleQtySave = () => {
    const newQty = parseInt(qty);
    if (isNaN(newQty) || newQty < 0) return;
    updateMutation.mutate({ quantity_available: newQty });
  };

  const handlePriceSave = () => {
    const newPrice = parseFloat(price);
    if (isNaN(newPrice) || newPrice <= 0) return;
    updateMutation.mutate({ discounted_price: newPrice });
  };

  const adjustQty = (delta) => {
    const newQty = Math.max(0, (basket.quantity_available || 0) + delta);
    setQty(newQty);
    updateMutation.mutate({ quantity_available: newQty });
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Image / Icon */}
          <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
            {basket.image_url ? (
              <img src={basket.image_url} alt={basket.name} className="w-full h-full object-cover" />
            ) : (
              <Package className="w-7 h-7 text-gray-400" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-gray-900 truncate">{basket.name}</p>
              <Badge className={statusColors[basket.status] || statusColors.active}>
                {basket.status === 'active' ? 'Actif' : basket.status === 'sold_out' ? 'Épuisé' : 'Expiré'}
              </Badge>
              {basket.basket_type === 'surprise_basket' && (
                <Badge variant="outline" className="text-xs">🎁 Surprise</Badge>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">Retrait : {basket.pickup_date}</p>

            {/* Price + Quantity inline controls */}
            <div className="flex flex-wrap items-center gap-4 mt-2">
              {/* Price */}
              <div className="flex items-center gap-1">
                {editingPrice ? (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      className="w-24 h-7 text-sm"
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                    />
                    <Button size="sm" className="h-7 px-2 text-xs bg-emerald-500 hover:bg-emerald-600"
                      onClick={handlePriceSave} disabled={updateMutation.isPending}>
                      OK
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs"
                      onClick={() => { setEditingPrice(false); setPrice(basket.discounted_price); }}>
                      ✕
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingPrice(true)}
                    className="flex items-center gap-1 group"
                  >
                    <span className="font-bold text-emerald-700">{basket.discounted_price?.toLocaleString()} F</span>
                    <span className="text-xs text-gray-400 line-through">{basket.original_price?.toLocaleString()} F</span>
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-1 rounded">-{discountPct}%</span>
                    <Pencil className="w-3 h-3 text-gray-300 group-hover:text-gray-600 ml-1" />
                  </button>
                )}
              </div>

              {/* Quantity stepper */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => adjustQty(-1)}
                  disabled={basket.quantity_available <= 0 || updateMutation.isPending}
                  className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center disabled:opacity-40"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <div className="min-w-[60px] text-center">
                  <span className="font-bold text-gray-900">{basket.quantity_available}</span>
                  <span className="text-xs text-gray-400 ml-1">dispo</span>
                </div>
                <button
                  onClick={() => adjustQty(+1)}
                  disabled={updateMutation.isPending}
                  className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Reservation count */}
          <div className="text-right flex-shrink-0">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="font-semibold">{reserved}</span>
            </div>
            <p className="text-xs text-gray-400">réservations</p>
          </div>
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
          {basket.status === 'active' ? (
            <Button size="sm" variant="outline" className="text-xs h-7 text-red-500 border-red-200 hover:bg-red-50"
              onClick={() => onToggleStatus('sold_out')}>
              <EyeOff className="w-3.5 h-3.5 mr-1" /> Marquer épuisé
            </Button>
          ) : basket.status === 'sold_out' ? (
            <Button size="sm" variant="outline" className="text-xs h-7 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
              onClick={() => onToggleStatus('active')}>
              <Eye className="w-3.5 h-3.5 mr-1" /> Réactiver
            </Button>
          ) : null}
          <Button size="sm" variant="outline" className="text-xs h-7" onClick={onEdit}>
            <Pencil className="w-3.5 h-3.5 mr-1" /> Modifier
          </Button>
          <Button size="sm" variant="ghost" className="text-xs h-7 text-red-400 hover:text-red-600 hover:bg-red-50 ml-auto"
            onClick={onDelete}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {reservations.length} réservations
          </button>
        </div>
      </div>

      {/* Expanded reservations */}
      {expanded && (
        <div className="border-t bg-gray-50 px-4 py-3">
          {reservations.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-3">Aucune réservation pour ce panier</p>
          ) : (
            <div className="space-y-2">
              {reservations.slice(0, 5).map(r => (
                <div key={r.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-800">{r.customer_name || r.customer_email}</span>
                    <span className="text-gray-400 ml-2 text-xs">{r.pickup_slot}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-emerald-700">{r.total_amount?.toLocaleString()} F</span>
                    <ReservationStatusBadge status={r.status} />
                  </div>
                </div>
              ))}
              {reservations.length > 5 && (
                <p className="text-xs text-gray-400 text-center">+ {reservations.length - 5} autres</p>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function ReservationStatusBadge({ status }) {
  const map = {
    reserved: 'bg-blue-100 text-blue-700',
    confirmed: 'bg-emerald-100 text-emerald-700',
    ready: 'bg-green-100 text-green-700',
    collected: 'bg-gray-100 text-gray-500',
    cancelled: 'bg-red-100 text-red-500',
    no_show: 'bg-orange-100 text-orange-600',
  };
  const labels = {
    reserved: 'Réservée', confirmed: 'Confirmée', ready: 'Prête',
    collected: 'Retirée', cancelled: 'Annulée', no_show: 'No show',
  };
  return <Badge className={map[status] || map.reserved}>{labels[status] || status}</Badge>;
}