import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { api } from '@/api';
import { formatShortDate } from '@/lib/format';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Package, AlertTriangle, Plus,
  BarChart3, ArrowUpRight, Sparkles
} from 'lucide-react';
import SalesForecast from '@/components/partner/SalesForecast';
import BundlingAnalysis from '@/components/partner/BundlingAnalysis';
import CustomKPIs from '@/components/partner/CustomKPIs';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import WidgetCustomizer from '@/components/dashboard/WidgetCustomizer';
import SmartAlert from '@/components/dashboard/SmartAlert';
import AdvancedChart from '@/components/dashboard/AdvancedChart';


import AdvancedStockManager from '@/components/partner/AdvancedStockManager';
import StockPredictions from '@/components/partner/StockPredictions';
import SmartBundles from '@/components/partner/SmartBundles';
import AIProductRecommendations from '@/components/partner/AIProductRecommendations';
import ProductBundleManager from '@/components/partner/ProductBundleManager';
import PromotionManager from '@/components/partner/PromotionManager';
import PartnerChatbot from '@/components/partner/PartnerChatbot';
import FoodSavingsDashboard from '@/components/partner/FoodSavingsDashboard';
import { goToLogin } from '@/lib/navigation';

export default function PartnerDashboard() {
  const [user, setUser] = useState(null);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await api.auth.me();
        setUser(userData);
        if (!userData.is_partner) {
          navigate(createPageUrl('Home'));
        }
      } catch (e) {
        goToLogin();
      }
    };
    loadUser();
  }, []);

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['partner-products', user?.store_id],
    queryFn: () => api.entities.Product.filter({ created_by: user?.email }),
    enabled: !!user,
  });

  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ['partner-orders', user?.store_id],
    queryFn: async () => {
      const allOrders = await api.entities.Order.list('-created_date', 100);
      return allOrders;
    },
    enabled: !!user,
  });

  const { data: preferences } = useQuery({
    queryKey: ['dashboard-preferences', user?.email],
    queryFn: async () => {
      const prefs = await api.entities.DashboardPreference.filter({ 
        user_email: user.email, 
        dashboard_type: 'partner' 
      });
      return prefs[0];
    },
    enabled: !!user
  });

  const savePrefsMutation = useMutation({
    mutationFn: async (data) => {
      if (preferences?.id) {
        return api.entities.DashboardPreference.update(preferences.id, data);
      }
      return api.entities.DashboardPreference.create({
        user_email: user.email,
        dashboard_type: 'partner',
        ...data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-preferences'] });
    }
  });

  /**
   * Tous les indicateurs viennent d'agrégats calculés en base sur la période
   * demandée. Le graphique de ventes n'est plus un tirage aléatoire.
   */
  const { data: dashboard, isLoading: loadingDashboard } = useQuery({
    queryKey: ['partner-dashboard', 30],
    queryFn: () => api.partner.dashboard(30),
    enabled: Boolean(user?.is_partner),
  });

  const activeProducts = dashboard?.active_products ?? 0;
  const urgentProducts = dashboard?.urgent_products ?? [];
  const totalRevenue = dashboard?.revenue ?? 0;
  const totalSaved = dashboard?.units_in_stock ?? 0;

  const chartData = (dashboard?.daily ?? []).map((d) => ({
    date: formatShortDate(d.date),
    ventes: d.ventes,
    commandes: d.commandes,
  }));

  // Generate smart alerts
  useEffect(() => {
    if (!products.length || !preferences) return;

    const newAlerts = [];
    const config = preferences.alerts_config || {};

    // Low stock alert
    const lowStock = products.filter(p => 
      p.quantity_available <= (config.low_stock_threshold || 5) && p.status === 'active'
    );
    if (lowStock.length > 0) {
      newAlerts.push({
        id: 'low_stock',
        type: 'low_stock',
        priority: 'high',
        title: 'Stock faible',
        message: `${lowStock.length} produit(s) ont un stock inférieur au seuil (${config.low_stock_threshold || 5} unités)`,
        action: {
          label: 'Voir les produits',
          onClick: () => navigate(createPageUrl('PartnerProducts'))
        }
      });
    }

    // Expiration warning
    const expiringDays = config.expiration_warning_days || 5;
    const expiringSoon = products.filter(p => {
      if (!p.expiration_date || p.status !== 'active') return false;
      const daysLeft = Math.ceil((new Date(p.expiration_date) - new Date()) / (1000 * 60 * 60 * 24));
      return daysLeft > 0 && daysLeft <= expiringDays;
    });
    if (expiringSoon.length > 0) {
      newAlerts.push({
        id: 'expiring_soon',
        type: 'expiration_warning',
        priority: 'medium',
        title: 'Produits à promouvoir',
        message: `${expiringSoon.length} produit(s) expirent dans moins de ${expiringDays} jours`,
        action: {
          label: 'Voir',
          onClick: () => navigate(createPageUrl('PartnerProducts'))
        }
      });
    }

    // Sales target
    if (config.daily_sales_target && totalRevenue >= config.daily_sales_target) {
      newAlerts.push({
        id: 'target_reached',
        type: 'target_reached',
        priority: 'low',
        title: '🎉 Objectif atteint!',
        message: `Vous avez dépassé votre objectif de ${config.daily_sales_target.toLocaleString()} FCFA`
      });
    }

    // Urgent products
    if (urgentProducts.length > 0) {
      newAlerts.push({
        id: 'urgent_expiry',
        type: 'urgent_delivery',
        priority: 'critical',
        title: 'Produits urgents',
        message: `${urgentProducts.length} produit(s) expirent dans moins de 3 jours`
      });
    }

    setAlerts(newAlerts);
  }, [products, preferences, totalRevenue, urgentProducts.length]);

  const visibleWidgets = preferences?.visible_widgets || ['stats', 'revenue', 'products', 'alerts'];

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
            <p className="text-gray-500">Bienvenue, {user.full_name}</p>
          </div>
          <div className="flex gap-3">
              <Button 
                variant="outline"
                onClick={() => setShowCustomizer(true)}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Personnaliser
              </Button>
              <Link to={createPageUrl('StockGuardian')}>
                <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
                  <Sparkles className="w-4 h-4 mr-2" />
                  StockGuardian IA
                </Button>
              </Link>
              <Link to={createPageUrl('PartnerProducts')}>
                <Button className="bg-emerald-500 hover:bg-emerald-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un produit
                </Button>
              </Link>
            </div>
        </div>

        {/* Urgent Alert */}
        {urgentProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-4 text-white"
          >
            <div className="flex items-center gap-4">
              <AlertTriangle className="w-8 h-8" />
              <div className="flex-1">
                <h3 className="font-bold">{urgentProducts.length} produit{urgentProducts.length > 1 ? 's' : ''} urgent{urgentProducts.length > 1 ? 's' : ''}</h3>
                <p className="text-orange-100 text-sm">Ces produits expirent dans moins de 3 jours</p>
              </div>
              <Link to={createPageUrl('PartnerProducts')}>
                <Button variant="secondary" size="sm">
                  Voir <ArrowUpRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </motion.div>
        )}

        {/* Smart Alerts */}
        {visibleWidgets.includes('alerts') && alerts.length > 0 && (
          <SmartAlert alerts={alerts} onDismiss={(id) => setAlerts(alerts.filter(a => a.id !== id))} />
        )}

        {/* Custom KPIs */}
        {visibleWidgets.includes('stats') && <CustomKPIs />}

        {/* AI Product Recommendations */}
        <AIProductRecommendations 
          storeId={user.store_id} 
          onAddProduct={(rec) => navigate(createPageUrl('PartnerProducts'))}
        />

        {/* Product Bundle Manager */}
        <ProductBundleManager storeEmail={user.email} />

        {/* Promotion Manager */}
        <PromotionManager storeId={user.store_id} storeEmail={user.email} />

        {/* Food Savings Analytics */}
        <FoodSavingsDashboard products={products} />

        {/* Advanced Sales Chart */}
        {visibleWidgets.includes('revenue') && (
          <Card className="p-6">
            <AdvancedChart
              title="Performance des ventes"
              data={chartData}
              dataKeys={['ventes', 'produits', 'commandes']}
              type="line"
              onPeriodChange={(period) => console.log('Period changed:', period)}
            />
          </Card>
        )}

        {/* Prediction & Bundling Row */}
        {(visibleWidgets.includes('predictions') || visibleWidgets.includes('bundles')) && (
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <StockPredictions products={products} />
            </Card>
            <Card className="p-6">
              <SmartBundles products={products} />
            </Card>
          </div>
        )}

        {/* Advanced Stock Manager */}
        <Card className="p-6">
          <AdvancedStockManager products={products} user={user} />
        </Card>

        {/* Forecast & Bundling Row */}
        <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
                <SalesForecast />
            </Card>
            <Card className="p-6">
                <BundlingAnalysis />
            </Card>
        </div>

        {/* Recent Products */}
        {visibleWidgets.includes('products') && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Produits récents</h2>
            <Link to={createPageUrl('PartnerProducts')} className="text-emerald-600 text-sm font-medium">
              Voir tout
            </Link>
          </div>

          {loadingProducts ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucun produit ajouté</p>
              <Link to={createPageUrl('PartnerProducts')}>
                <Button variant="outline" className="mt-3">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un produit
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {products.slice(0, 5).map((product) => {
                const daysLeft = Math.ceil(
                  (new Date(product.expiration_date) - new Date()) / (1000 * 60 * 60 * 24)
                );
                const discount = Math.round(
                  (1 - product.discounted_price / product.original_price) * 100
                );

                return (
                  <div
                    key={product.id}
                    className="flex items-center gap-4 p-3 rounded-xl bg-gray-50"
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200">
                      {product.image_url ? (
                        <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">🛒</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{product.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">-{discount}%</Badge>
                        <Badge className={`text-xs ${
                          daysLeft <= 1 ? 'bg-red-100 text-red-700' :
                          daysLeft <= 3 ? 'bg-orange-100 text-orange-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {daysLeft <= 0 ? 'Expiré' : `${daysLeft}j`}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-emerald-600">
                        {product.discounted_price?.toLocaleString()} F
                      </p>
                      <p className="text-xs text-gray-500">
                        {product.quantity_available} dispo.
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </Card>
        )}

        {/* Widget Customizer */}
        <WidgetCustomizer
          open={showCustomizer}
          onClose={() => setShowCustomizer(false)}
          dashboardType="partner"
          preferences={preferences}
          onSave={(data) => savePrefsMutation.mutate(data)}
        />

        {/* AI Chatbot */}
        <PartnerChatbot />
      </div>
    </div>
  );
}