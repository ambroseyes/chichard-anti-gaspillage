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
    { id: 'stats', name: 'Statistiques globales', icon: '📊', description: 'Vue d\'ensemble des métriques clés' },
    { id: 'revenue', name: 'Graphique revenus', icon: '💰', description: 'Évolution des ventes dans le temps' },
    { id: 'products', name: 'Produits récents', icon: '📦', description: 'Liste des derniers produits ajoutés' },
    { id: 'alerts', name: 'Alertes intelligentes', icon: '⚠️', description: 'Notifications basées sur vos seuils' },
    { id: 'predictions', name: 'Prédictions IA', icon: '🔮', description: 'Prévisions de stock et ventes' },
    { id: 'bundles', name: 'Suggestions bundles', icon: '🎁', description: 'Recommandations de packs produits' },
    { id: 'forecast', name: 'Prévisions ventes', icon: '📈', description: 'Tendances futures des ventes' },
    { id: 'performance', name: 'Performance produits', icon: '🎯', description: 'Analyse des produits performants' },
    { id: 'recommendations', name: 'Recommandations IA', icon: '✨', description: 'Produits tendance à ajouter' },
    { id: 'promotions', name: 'Gestion promotions', icon: '🏷️', description: 'Vos promotions actives' }
  ],
  driver: [
    { id: 'stats', name: 'Statistiques du jour', icon: '📊', description: 'Résumé de votre activité' },
    { id: 'map', name: 'Carte temps réel', icon: '🗺️', description: 'Carte interactive des livraisons' },
    { id: 'orders', name: 'Liste des commandes', icon: '📋', description: 'Commandes en attente' },
    { id: 'earnings', name: 'Gains journaliers', icon: '💵', description: 'Revenus du jour' },
    { id: 'routes', name: 'Optimisation routes', icon: '🛣️', description: 'Itinéraires optimisés' },
    { id: 'history', name: 'Historique', icon: '📜', description: 'Vos livraisons passées' },
    { id: 'performance', name: 'Performance', icon: '⭐', description: 'Votre évaluation et statistiques' }
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
                <div 
                  key={widget.id} 
                  className={`p-3 border rounded-lg transition-all ${
                    visibleWidgets.includes(widget.id) ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-2xl">{widget.icon}</span>
                      <div className="flex-1">
                        <p className="font-medium">{widget.name}</p>
                        <p className="text-xs text-gray-500">{widget.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={visibleWidgets.includes(widget.id)}
                      onCheckedChange={() => toggleWidget(widget.id)}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {visibleWidgets.length} widget(s) activé(s)
            </p>
          </div>

          {/* Alerts Configuration */}
          <div className="border-t pt-6">
            <h3 className="font-semibold mb-3">Configuration des alertes</h3>
            <div className="space-y-4">
              {dashboardType === 'partner' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="flex items-center gap-2">
                        Stock faible (unités)
                        <Badge variant="outline" className="text-xs">⚠️</Badge>
                      </Label>
                      <Input
                        type="number"
                        value={alertsConfig.low_stock_threshold}
                        onChange={(e) => setAlertsConfig({
                          ...alertsConfig,
                          low_stock_threshold: parseInt(e.target.value)
                        })}
                        className="mt-1"
                        min="1"
                      />
                      <p className="text-xs text-gray-500 mt-1">Alerte si stock ≤ ce seuil</p>
                    </div>
                    <div>
                      <Label className="flex items-center gap-2">
                        Jours avant expiration
                        <Badge variant="outline" className="text-xs">🕐</Badge>
                      </Label>
                      <Input
                        type="number"
                        value={alertsConfig.expiration_warning_days || 5}
                        onChange={(e) => setAlertsConfig({
                          ...alertsConfig,
                          expiration_warning_days: parseInt(e.target.value)
                        })}
                        className="mt-1"
                        min="1"
                      />
                      <p className="text-xs text-gray-500 mt-1">Alerte produits expirant bientôt</p>
                    </div>
                  </div>
                  <div>
                    <Label className="flex items-center gap-2">
                      Objectif ventes quotidien (FCFA)
                      <Badge variant="outline" className="text-xs">🎯</Badge>
                    </Label>
                    <Input
                      type="number"
                      value={alertsConfig.daily_sales_target}
                      onChange={(e) => setAlertsConfig({
                        ...alertsConfig,
                        daily_sales_target: parseInt(e.target.value)
                      })}
                      className="mt-1"
                      step="1000"
                    />
                    <p className="text-xs text-gray-500 mt-1">Recevez une alerte lorsque cet objectif est atteint</p>
                  </div>
                </>
              )}
              
              {dashboardType === 'driver' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="flex items-center gap-2">
                        Livraison urgente (min)
                        <Badge variant="outline" className="text-xs">⏰</Badge>
                      </Label>
                      <Input
                        type="number"
                        value={alertsConfig.urgent_delivery_minutes}
                        onChange={(e) => setAlertsConfig({
                          ...alertsConfig,
                          urgent_delivery_minutes: parseInt(e.target.value)
                        })}
                        className="mt-1"
                        min="5"
                      />
                      <p className="text-xs text-gray-500 mt-1">Alerte si commande en attente ≥ ce délai</p>
                    </div>
                    <div>
                      <Label className="flex items-center gap-2">
                        Objectif livraisons/jour
                        <Badge variant="outline" className="text-xs">📦</Badge>
                      </Label>
                      <Input
                        type="number"
                        value={alertsConfig.daily_delivery_target || 20}
                        onChange={(e) => setAlertsConfig({
                          ...alertsConfig,
                          daily_delivery_target: parseInt(e.target.value)
                        })}
                        className="mt-1"
                        min="1"
                      />
                      <p className="text-xs text-gray-500 mt-1">Votre objectif quotidien de livraisons</p>
                    </div>
                  </div>
                </>
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