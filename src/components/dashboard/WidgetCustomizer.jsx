import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Settings, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

const availableWidgets = {
  partner: [
    { id: 'stats', name: 'Statistiques globales', icon: '📊' },
    { id: 'revenue', name: 'Graphique revenus', icon: '💰' },
    { id: 'products', name: 'Produits récents', icon: '📦' },
    { id: 'alerts', name: 'Alertes stock', icon: '⚠️' },
    { id: 'predictions', name: 'Prédictions IA', icon: '🔮' },
    { id: 'bundles', name: 'Suggestions bundles', icon: '🎁' },
    { id: 'forecast', name: 'Prévisions ventes', icon: '📈' },
    { id: 'performance', name: 'Performance produits', icon: '🎯' }
  ],
  driver: [
    { id: 'stats', name: 'Statistiques du jour', icon: '📊' },
    { id: 'map', name: 'Carte interactive', icon: '🗺️' },
    { id: 'orders', name: 'Liste des commandes', icon: '📋' },
    { id: 'earnings', name: 'Gains journaliers', icon: '💵' },
    { id: 'routes', name: 'Optimisation routes', icon: '🛣️' },
    { id: 'history', name: 'Historique', icon: '📜' }
  ]
};

export default function WidgetCustomizer({ open, onClose, dashboardType, preferences, onSave }) {
  const [visibleWidgets, setVisibleWidgets] = useState(preferences?.visible_widgets || []);
  const [alertsConfig, setAlertsConfig] = useState(preferences?.alerts_config || {
    low_stock_threshold: 5,
    urgent_delivery_minutes: 30,
    daily_sales_target: 100000,
    enable_push_notifications: true
  });

  const widgets = availableWidgets[dashboardType] || [];

  const toggleWidget = (widgetId) => {
    setVisibleWidgets(prev => 
      prev.includes(widgetId) 
        ? prev.filter(id => id !== widgetId)
        : [...prev, widgetId]
    );
  };

  const handleSave = () => {
    onSave({
      visible_widgets: visibleWidgets,
      alerts_config: alertsConfig
    });
    toast.success('Préférences sauvegardées');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Personnaliser le tableau de bord
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Widgets */}
          <div>
            <h3 className="font-semibold mb-3">Widgets visibles</h3>
            <div className="grid gap-3">
              {widgets.map((widget) => (
                <div key={widget.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{widget.icon}</span>
                    <span className="font-medium">{widget.name}</span>
                  </div>
                  <Switch
                    checked={visibleWidgets.includes(widget.id)}
                    onCheckedChange={() => toggleWidget(widget.id)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Alerts Configuration */}
          <div className="border-t pt-6">
            <h3 className="font-semibold mb-3">Configuration des alertes</h3>
            <div className="space-y-4">
              {dashboardType === 'partner' && (
                <>
                  <div>
                    <Label>Seuil stock faible (unités)</Label>
                    <Input
                      type="number"
                      value={alertsConfig.low_stock_threshold}
                      onChange={(e) => setAlertsConfig({
                        ...alertsConfig,
                        low_stock_threshold: parseInt(e.target.value)
                      })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Objectif ventes quotidien (FCFA)</Label>
                    <Input
                      type="number"
                      value={alertsConfig.daily_sales_target}
                      onChange={(e) => setAlertsConfig({
                        ...alertsConfig,
                        daily_sales_target: parseInt(e.target.value)
                      })}
                      className="mt-1"
                    />
                  </div>
                </>
              )}
              
              {dashboardType === 'driver' && (
                <div>
                  <Label>Livraison urgente (minutes)</Label>
                  <Input
                    type="number"
                    value={alertsConfig.urgent_delivery_minutes}
                    onChange={(e) => setAlertsConfig({
                      ...alertsConfig,
                      urgent_delivery_minutes: parseInt(e.target.value)
                    })}
                    className="mt-1"
                  />
                </div>
              )}

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <Label>Notifications push</Label>
                <Switch
                  checked={alertsConfig.enable_push_notifications}
                  onCheckedChange={(checked) => setAlertsConfig({
                    ...alertsConfig,
                    enable_push_notifications: checked
                  })}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Annuler
            </Button>
            <Button className="flex-1" onClick={handleSave}>
              Sauvegarder
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}