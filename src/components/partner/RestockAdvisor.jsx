import React, { useMemo, useState } from 'react';
import { differenceInDays } from 'date-fns';
import { TrendingUp, AlertTriangle, PackagePlus, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

// Velocity = units sold per day
// Days of stock = quantity_available / velocity
// Suggest reorder if daysOfStock < REORDER_THRESHOLD or quantity_available < MIN_STOCK

const REORDER_DAYS_THRESHOLD = 7;  // reorder if stock < 7 days worth
const MIN_STOCK = 5;               // always flag below 5 units
const MIN_VELOCITY = 0.1;         // minimum 0.1 unit/day to consider meaningful

function computeAdvisory(product) {
  const createdDaysAgo = Math.max(1, differenceInDays(new Date(), new Date(product.created_date || Date.now())));
  const sold = product.quantity_sold || 0;
  const available = product.quantity_available || 0;
  const velocity = sold / createdDaysAgo; // units/day

  const daysOfStock = velocity >= MIN_VELOCITY ? available / velocity : null;

  let urgency = null;
  let reason = '';
  let suggestedQty = 0;

  if (available <= 0) {
    urgency = 'critical';
    reason = 'Rupture de stock';
    suggestedQty = Math.max(10, Math.round(velocity * 14));
  } else if (available <= MIN_STOCK) {
    urgency = 'high';
    reason = `Stock critique (${available} unité${available > 1 ? 's' : ''})`;
    suggestedQty = Math.max(10, Math.round(velocity * 14));
  } else if (daysOfStock !== null && daysOfStock < REORDER_DAYS_THRESHOLD) {
    urgency = 'medium';
    reason = `Stock pour ~${Math.round(daysOfStock)} jour${daysOfStock > 1 ? 's' : ''} seulement`;
    suggestedQty = Math.round(velocity * 14);
  }

  return { velocity, daysOfStock, urgency, reason, suggestedQty };
}

const urgencyConfig = {
  critical: { color: 'bg-red-100 text-red-700 border-red-200',   dot: 'bg-red-500',    label: 'Rupture' },
  high:     { color: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500', label: 'Critique' },
  medium:   { color: 'bg-amber-100 text-amber-700 border-amber-200',   dot: 'bg-amber-500',  label: 'Bientôt' },
};

export default function RestockAdvisor({ products, onRestock }) {
  const [collapsed, setCollapsed] = useState(false);
  const [restocking, setRestocking] = useState({});

  const advisories = useMemo(() => {
    return products
      .map(p => ({ product: p, ...computeAdvisory(p) }))
      .filter(a => a.urgency !== null)
      .sort((a, b) => {
        const order = { critical: 0, high: 1, medium: 2 };
        return order[a.urgency] - order[b.urgency];
      });
  }, [products]);

  if (advisories.length === 0) return null;

  const handleRestock = async (advisory) => {
    setRestocking(prev => ({ ...prev, [advisory.product.id]: true }));
    // Create a notification / log for the partner
    await base44.entities.Notification.create({
      user_email: advisory.product.created_by,
      title: `Réappro suggéré: ${advisory.product.name}`,
      message: `Commandez ~${advisory.suggestedQty} unités (${advisory.reason})`,
      type: 'system',
      action_url: '/PartnerProducts',
    });
    toast.success(`Alerte réapprovisionnement créée pour "${advisory.product.name}" (+${advisory.suggestedQty} unités suggérées)`);
    setRestocking(prev => ({ ...prev, [advisory.product.id]: false }));
    onRestock?.(advisory.product, advisory.suggestedQty);
  };

  return (
    <Card className="border-l-4 border-amber-400 overflow-hidden">
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-amber-500" />
          <span className="font-semibold text-gray-800">Réapprovisionnement automatique</span>
          <Badge className="bg-amber-100 text-amber-700">{advisories.length} suggestion{advisories.length > 1 ? 's' : ''}</Badge>
        </div>
        {collapsed ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 space-y-2">
          <p className="text-xs text-gray-500 mb-3">
            Basé sur la vélocité de vente de chaque produit (unités vendues / jour depuis la création)
          </p>
          {advisories.map(({ product, urgency, reason, suggestedQty, velocity, daysOfStock }) => {
            const cfg = urgencyConfig[urgency];
            return (
              <div key={product.id} className={`rounded-xl border p-3 flex items-center gap-3 ${cfg.color}`}>
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{product.name}</p>
                  <p className="text-xs opacity-80">{reason}</p>
                  <div className="flex items-center gap-3 mt-1 text-[11px] opacity-70">
                    <span>Stock: {product.quantity_available ?? 0}</span>
                    <span>Vélocité: {velocity.toFixed(2)} u/j</span>
                    {daysOfStock !== null && <span>~{Math.round(daysOfStock)}j de stock</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <Badge variant="outline" className="text-xs font-bold">+{suggestedQty} u.</Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    disabled={restocking[product.id]}
                    onClick={() => handleRestock({ product, urgency, reason, suggestedQty })}
                  >
                    {restocking[product.id]
                      ? <RefreshCw className="w-3 h-3 animate-spin" />
                      : <><PackagePlus className="w-3 h-3 mr-1" />Commander</>
                    }
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}