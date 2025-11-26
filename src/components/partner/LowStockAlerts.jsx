import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { 
  AlertTriangle, Package, TrendingDown, Clock, Bell, Settings,
  ChevronRight, Zap
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from 'framer-motion';

export default function LowStockAlerts({ products }) {
  const [showSettings, setShowSettings] = useState(false);
  const [thresholds, setThresholds] = useState({
    low_quantity: 5,
    critical_days: 2,
    urgent_days: 5,
  });

  // Calculate velocity and alerts
  const analyzeProduct = (product) => {
    const daysListed = Math.ceil((new Date() - new Date(product.created_date)) / 86400000) || 1;
    const sold = product.quantity_sold || 0;
    const velocity = sold / daysListed; // units per day
    const daysLeft = Math.ceil((new Date(product.expiration_date) - new Date()) / 86400000);
    const remaining = product.quantity_available || 0;
    
    const daysToSellout = velocity > 0 ? remaining / velocity : Infinity;
    const willExpireBeforeSellout = daysToSellout > daysLeft;
    
    let alertLevel = 'ok';
    let alertReason = '';
    
    if (daysLeft <= thresholds.critical_days) {
      alertLevel = 'critical';
      alertReason = 'Expire très bientôt';
    } else if (daysLeft <= thresholds.urgent_days) {
      alertLevel = 'urgent';
      alertReason = 'Expire bientôt';
    } else if (remaining <= thresholds.low_quantity) {
      alertLevel = 'low';
      alertReason = 'Stock faible';
    } else if (willExpireBeforeSellout && remaining > 0) {
      alertLevel = 'warning';
      alertReason = 'Risque d\'invendus';
    }

    return { ...product, velocity, daysLeft, daysToSellout, alertLevel, alertReason };
  };

  const analyzedProducts = products.map(analyzeProduct);
  
  const criticalAlerts = analyzedProducts.filter(p => p.alertLevel === 'critical');
  const urgentAlerts = analyzedProducts.filter(p => p.alertLevel === 'urgent');
  const warningAlerts = analyzedProducts.filter(p => ['low', 'warning'].includes(p.alertLevel));

  const alertConfig = {
    critical: { color: 'bg-red-100 text-red-700 border-red-200', icon: AlertTriangle },
    urgent: { color: 'bg-orange-100 text-orange-700 border-orange-200', icon: Clock },
    low: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Package },
    warning: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: TrendingDown },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Bell className="w-5 h-5 text-orange-500" />
          Alertes Stock
        </h3>
        <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>
          <Settings className="w-4 h-4 mr-1" />
          Seuils
        </Button>
      </div>

      {criticalAlerts.length === 0 && urgentAlerts.length === 0 && warningAlerts.length === 0 ? (
        <Card className="p-6 text-center bg-emerald-50 border-emerald-200">
          <Package className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <p className="text-emerald-700 font-medium">Tous vos stocks sont OK !</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Critical */}
          {criticalAlerts.length > 0 && (
            <Card className="p-4 border-red-200 bg-red-50">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="font-semibold text-red-700">Critique ({criticalAlerts.length})</span>
              </div>
              {criticalAlerts.map((p) => (
                <AlertItem key={p.id} product={p} config={alertConfig.critical} />
              ))}
            </Card>
          )}

          {/* Urgent */}
          {urgentAlerts.length > 0 && (
            <Card className="p-4 border-orange-200 bg-orange-50">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-orange-600" />
                <span className="font-semibold text-orange-700">Urgent ({urgentAlerts.length})</span>
              </div>
              {urgentAlerts.map((p) => (
                <AlertItem key={p.id} product={p} config={alertConfig.urgent} />
              ))}
            </Card>
          )}

          {/* Warnings */}
          {warningAlerts.length > 0 && (
            <Card className="p-4 border-yellow-200 bg-yellow-50">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-5 h-5 text-yellow-600" />
                <span className="font-semibold text-yellow-700">Attention ({warningAlerts.length})</span>
              </div>
              {warningAlerts.slice(0, 5).map((p) => (
                <AlertItem key={p.id} product={p} config={alertConfig.warning} />
              ))}
            </Card>
          )}
        </div>
      )}

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurer les seuils d'alerte</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium">Quantité faible (unités)</label>
              <Input
                type="number"
                value={thresholds.low_quantity}
                onChange={(e) => setThresholds({ ...thresholds, low_quantity: Number(e.target.value) })}
                min="1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Jours critiques</label>
              <Input
                type="number"
                value={thresholds.critical_days}
                onChange={(e) => setThresholds({ ...thresholds, critical_days: Number(e.target.value) })}
                min="1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Jours urgents</label>
              <Input
                type="number"
                value={thresholds.urgent_days}
                onChange={(e) => setThresholds({ ...thresholds, urgent_days: Number(e.target.value) })}
                min="1"
              />
            </div>
            <Button onClick={() => setShowSettings(false)} className="w-full">
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AlertItem({ product, config }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center justify-between p-2 rounded-lg bg-white/50 mb-2"
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{product.name}</p>
        <p className="text-xs text-gray-600">{product.alertReason}</p>
      </div>
      <div className="text-right">
        <Badge variant="secondary" className="text-xs">
          {product.daysLeft}j • {product.quantity_available} u.
        </Badge>
      </div>
    </motion.div>
  );
}