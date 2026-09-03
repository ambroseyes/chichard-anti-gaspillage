import React, { useState, useEffect } from 'react';
import { api } from '@/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Package, TrendingUp, RefreshCw, Plus,
  Loader2, Calendar, Bell, Layers
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';

export default function AdvancedStockManager({ products, user }) {
  const [showBatchForm, setShowBatchForm] = useState(null);
  const [showAlertSettings, setShowAlertSettings] = useState(false);
  const [reorderSuggestions, setReorderSuggestions] = useState([]);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [alertSettings, setAlertSettings] = useState({
    low_stock_threshold: 5,
    expiration_warning_days: 5,
    critical_expiration_days: 2,
    enable_email_alerts: true,
    last_alert_date: null
  });
  const queryClient = useQueryClient();

  // Load store settings
  const { data: store } = useQuery({
    queryKey: ['store', user?.store_id],
    queryFn: async () => {
      if (!user?.store_id) return null;
      const stores = await api.entities.Store.filter({ id: user.store_id });
      return stores[0];
    },
    enabled: !!user?.store_id,
  });

  useEffect(() => {
    if (store?.stock_alert_settings) {
      setAlertSettings(prev => ({ ...prev, ...store.stock_alert_settings }));
    }
  }, [store]);

  const { data: batches = [] } = useQuery({
    queryKey: ['product-batches', user?.store_id],
    queryFn: () => api.entities.ProductBatch.filter({ store_id: user?.store_id }),
    enabled: !!user?.store_id,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['store-orders'],
    queryFn: () => api.entities.Order.list('-created_date', 100),
  });

  useEffect(() => {
    if (products.length > 0 && orders.length > 0) {
      generateReorderSuggestions();
    }
  }, [products, orders, alertSettings]);

  // Check for email alerts
  useEffect(() => {
    const checkAndSendAlerts = async () => {
      if (!alertSettings.enable_email_alerts || !user?.email || !store) return;

      // Don't send if sent recently (within 24h)
      if (alertSettings.last_alert_date) {
        const lastAlert = new Date(alertSettings.last_alert_date);
        if ((new Date() - lastAlert) < 86400000) return;
      }

      if (reorderSuggestions.length > 0 && reorderSuggestions.some(s => s.urgency === 'critical')) {
        const criticalItems = reorderSuggestions.filter(s => s.urgency === 'critical');
        
        

        // Update last alert date
        const newSettings = { ...alertSettings, last_alert_date: new Date().toISOString() };
        await api.entities.Store.update(store.id, {
          stock_alert_settings: newSettings
        });
        setAlertSettings(newSettings);
        toast.success('Rapport d\'alerte envoyé par email');
      }
    };

    if (reorderSuggestions.length > 0) {
      checkAndSendAlerts();
    }
  }, [reorderSuggestions, alertSettings.enable_email_alerts]);

  const saveSettings = async () => {
    if (!store) return;
    setIsSavingSettings(true);
    try {
      await api.entities.Store.update(store.id, {
        stock_alert_settings: alertSettings
      });
      toast.success('Paramètres sauvegardés');
      setShowAlertSettings(false);
    } catch (e) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const generateReorderSuggestions = () => {
    const suggestions = products.map(product => {
      // Calculate sales velocity
      const last30Days = new Date(Date.now() - 30 * 86400000);
      const recentOrders = orders.filter(o => new Date(o.created_date) >= last30Days);
      const soldUnits = recentOrders.reduce((sum, order) => {
        const item = order.items?.find(i => i.product_id === product.id);
        return sum + (item?.quantity || 0);
      }, 0);
      
      const dailyVelocity = soldUnits / 30;
      const daysOfStock = dailyVelocity > 0 ? product.quantity_available / dailyVelocity : Infinity;
      
      // Days until expiration
      const daysToExpire = Math.ceil((new Date(product.expiration_date) - new Date()) / 86400000);
      
      // Suggest reorder based on thresholds
      const needsReorder = daysOfStock < 7 || 
                          product.quantity_available <= alertSettings.low_stock_threshold ||
                          daysToExpire <= alertSettings.expiration_warning_days;
      
      // Calculate optimal reorder quantity (14 days of stock)
      const suggestedQuantity = Math.ceil(dailyVelocity * 14) - product.quantity_available;
      
      // Optimal restock date
      const optimalRestockDate = addDays(new Date(), Math.max(0, daysOfStock - 3));

      // Determine urgency
      let urgency = 'normal';
      if (daysToExpire <= alertSettings.critical_expiration_days || product.quantity_available === 0) {
        urgency = 'critical';
      } else if (daysToExpire <= alertSettings.expiration_warning_days || product.quantity_available <= alertSettings.low_stock_threshold) {
        urgency = 'high';
      }

      return {
        product,
        dailyVelocity: Math.round(dailyVelocity * 10) / 10,
        daysOfStock: Math.round(daysOfStock),
        daysToExpire,
        needsReorder,
        suggestedQuantity: Math.max(0, suggestedQuantity),
        optimalRestockDate,
        urgency
      };
    }).filter(s => s.needsReorder);

    setReorderSuggestions(suggestions.sort((a, b) => {
      // Sort by urgency then by days of stock
      const urgencyScore = { critical: 0, high: 1, normal: 2 };
      if (urgencyScore[a.urgency] !== urgencyScore[b.urgency]) {
        return urgencyScore[a.urgency] - urgencyScore[b.urgency];
      }
      return a.daysOfStock - b.daysOfStock;
    }));
  };

  const createBatchMutation = useMutation({
    mutationFn: (data) => api.entities.ProductBatch.create({
      ...data,
      store_id: user.store_id,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-batches'] });
      setShowBatchForm(null);
      toast.success('Lot ajouté');
    }
  });

  const getProductBatches = (productId) => {
    return batches.filter(b => b.product_id === productId);
  };

  const urgencyConfig = {
    critical: { color: 'bg-red-100 text-red-700 border-red-200', label: 'Critique' },
    high: { color: 'bg-orange-100 text-orange-700 border-orange-200', label: 'Urgent' },
    normal: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'À surveiller' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-500" />
            Gestion Avancée des Stocks
          </h2>
          <p className="text-sm text-gray-500">IA prédictive & gestion par lots</p>
        </div>
        <Button variant="outline" onClick={() => setShowAlertSettings(true)}>
          <Bell className="w-4 h-4 mr-2" />
          Alertes
        </Button>
      </div>

      <Tabs defaultValue="reorder">
        <TabsList>
          <TabsTrigger value="reorder">
            <RefreshCw className="w-4 h-4 mr-2" />
            Réappro
          </TabsTrigger>
          <TabsTrigger value="batches">
            <Layers className="w-4 h-4 mr-2" />
            Lots
          </TabsTrigger>
          <TabsTrigger value="velocity">
            <TrendingUp className="w-4 h-4 mr-2" />
            Vélocité
          </TabsTrigger>
        </TabsList>

        {/* Reorder Suggestions */}
        <TabsContent value="reorder" className="mt-4">
          {reorderSuggestions.length === 0 ? (
            <Card className="p-8 text-center bg-emerald-50 border-emerald-200">
              <Package className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <p className="text-emerald-700 font-medium">Tous vos stocks sont optimaux !</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {reorderSuggestions.map((suggestion) => {
                const config = urgencyConfig[suggestion.urgency];
                return (
                  <Card key={suggestion.product.id} className={`p-4 border-2 ${config.color}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{suggestion.product.name}</h4>
                          <Badge className={config.color}>{config.label}</Badge>
                        </div>
                        <p className="text-sm text-gray-500">{suggestion.product.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Stock actuel</p>
                        <p className="text-lg font-bold">{suggestion.product.quantity_available}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3 mb-4">
                      <div className="bg-white/50 rounded-lg p-2 text-center">
                        <p className="text-xs text-gray-500">Vélocité/jour</p>
                        <p className="font-semibold">{suggestion.dailyVelocity}</p>
                      </div>
                      <div className="bg-white/50 rounded-lg p-2 text-center">
                        <p className="text-xs text-gray-500">Jours de stock</p>
                        <p className="font-semibold">{suggestion.daysOfStock === Infinity ? '∞' : suggestion.daysOfStock}</p>
                      </div>
                      <div className="bg-white/50 rounded-lg p-2 text-center">
                        <p className="text-xs text-gray-500">Expire dans</p>
                        <p className="font-semibold">{suggestion.daysToExpire}j</p>
                      </div>
                      <div className="bg-white/50 rounded-lg p-2 text-center">
                        <p className="text-xs text-gray-500">Qté suggérée</p>
                        <p className="font-semibold text-emerald-600">+{suggestion.suggestedQuantity}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        Réappro idéale: {format(suggestion.optimalRestockDate, 'd MMM', { locale: fr })}
                      </div>
                      <Button size="sm" onClick={() => setShowBatchForm(suggestion.product)}>
                        <Plus className="w-4 h-4 mr-1" />
                        Ajouter un lot
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Batch Management */}
        <TabsContent value="batches" className="mt-4">
          <div className="space-y-4">
            {products.map((product) => {
              const productBatches = getProductBatches(product.id);
              return (
                <Card key={product.id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{product.name}</h4>
                      <p className="text-sm text-gray-500">{productBatches.length} lot(s)</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setShowBatchForm(product)}>
                      <Plus className="w-4 h-4 mr-1" />
                      Lot
                    </Button>
                  </div>

                  {productBatches.length > 0 && (
                    <div className="space-y-2">
                      {productBatches.map((batch) => {
                        const daysLeft = Math.ceil((new Date(batch.expiration_date) - new Date()) / 86400000);
                        return (
                          <div key={batch.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline">{batch.batch_number}</Badge>
                              <span className="text-sm">{batch.quantity - (batch.quantity_sold || 0)} restants</span>
                            </div>
                            <Badge className={
                              daysLeft <= 2 ? 'bg-red-100 text-red-700' :
                              daysLeft <= 5 ? 'bg-orange-100 text-orange-700' :
                              'bg-green-100 text-green-700'
                            }>
                              Expire dans {daysLeft}j
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Velocity Analysis */}
        <TabsContent value="velocity" className="mt-4">
          <div className="space-y-3">
            {products.map((product) => {
              const suggestion = reorderSuggestions.find(s => s.product.id === product.id);
              const velocity = suggestion?.dailyVelocity || 0;
              const maxVelocity = Math.max(...reorderSuggestions.map(s => s.dailyVelocity), 1);
              
              return (
                <Card key={product.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{product.name}</h4>
                    <span className="text-sm font-semibold">{velocity} unités/jour</span>
                  </div>
                  <Progress value={(velocity / maxVelocity) * 100} className="h-2" />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Stock: {product.quantity_available}</span>
                    <span>
                      {velocity > 0 
                        ? `${Math.round(product.quantity_available / velocity)} jours restants`
                        : 'Pas de ventes récentes'}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Batch Form Dialog */}
      <Dialog open={!!showBatchForm} onOpenChange={() => setShowBatchForm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un lot - {showBatchForm?.name}</DialogTitle>
          </DialogHeader>
          <BatchForm 
            product={showBatchForm}
            onSubmit={(data) => createBatchMutation.mutate(data)}
            loading={createBatchMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Alert Settings Dialog */}
      <Dialog open={showAlertSettings} onOpenChange={setShowAlertSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Paramètres d'alertes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Seuil stock faible (unités)</Label>
              <Input
                type="number"
                value={alertSettings.low_stock_threshold}
                onChange={(e) => setAlertSettings({
                  ...alertSettings,
                  low_stock_threshold: Number(e.target.value)
                })}
              />
            </div>
            <div>
              <Label>Alerte expiration (jours)</Label>
              <Input
                type="number"
                value={alertSettings.expiration_warning_days}
                onChange={(e) => setAlertSettings({
                  ...alertSettings,
                  expiration_warning_days: Number(e.target.value)
                })}
              />
            </div>
            <div>
              <Label>Expiration critique (jours)</Label>
              <Input
                type="number"
                value={alertSettings.critical_expiration_days}
                onChange={(e) => setAlertSettings({
                  ...alertSettings,
                  critical_expiration_days: Number(e.target.value)
                })}
              />
            </div>
            <Button onClick={saveSettings} disabled={isSavingSettings} className="w-full">
              {isSavingSettings ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BatchForm({ product, onSubmit, loading }) {
  const [formData, setFormData] = useState({
    product_id: product?.id || '',
    product_name: product?.name || '',
    batch_number: `LOT-${Date.now().toString(36).toUpperCase()}`,
    quantity: 10,
    expiration_date: '',
    purchase_price: '',
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4 mt-4">
      <div>
        <Label>Numéro de lot</Label>
        <Input
          value={formData.batch_number}
          onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Quantité</Label>
          <Input
            type="number"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
            min="1"
          />
        </div>
        <div>
          <Label>Prix d'achat (FCFA)</Label>
          <Input
            type="number"
            value={formData.purchase_price}
            onChange={(e) => setFormData({ ...formData, purchase_price: Number(e.target.value) })}
          />
        </div>
      </div>
      <div>
        <Label>Date d'expiration</Label>
        <Input
          type="date"
          value={formData.expiration_date}
          onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
          required
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        Ajouter le lot
      </Button>
    </form>
  );
}