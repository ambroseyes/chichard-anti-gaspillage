import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { differenceInHours, format, startOfWeek, endOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';
import {
  AlertTriangle, TrendingDown, BarChart3, Leaf, Clock, Package,
  Check, X, RefreshCw, Download, Loader2, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';

// --- Pricing suggestion engine (rule-based, no external API needed) ---
function getSuggestedPrice(product) {
  if (!product.expiration_date) return null;
  const hoursLeft = differenceInHours(new Date(product.expiration_date), new Date());
  if (hoursLeft > 48 || hoursLeft < 0) return null;
  const base = product.original_price || product.discounted_price;
  if (!base) return null;
  let discount = 0.20;
  if (hoursLeft <= 12) discount = 0.40;
  else if (hoursLeft <= 24) discount = 0.30;
  const suggested = Math.round(base * (1 - discount));
  return { suggested, discount, hoursLeft, current: product.discounted_price || base };
}

function getDLCColor(expirationDate) {
  if (!expirationDate) return 'gray';
  const h = differenceInHours(new Date(expirationDate), new Date());
  if (h < 0) return 'expired';
  if (h < 48) return 'red';
  if (h < 72) return 'orange';
  return 'green';
}

const colorConfig = {
  green:   { badge: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-200', label: 'Frais' },
  orange:  { badge: 'bg-orange-100 text-orange-700',  border: 'border-orange-200',  label: 'Bientôt' },
  red:     { badge: 'bg-red-100 text-red-700',         border: 'border-red-200',     label: 'Urgent' },
  expired: { badge: 'bg-gray-200 text-gray-500',       border: 'border-gray-200',    label: 'Expiré' },
  gray:    { badge: 'bg-gray-100 text-gray-500',       border: 'border-gray-100',    label: 'Sans DLC' },
};

export default function PartnerPredictiveDashboard() {
  const [user, setUser] = useState(null);
  const [store, setStore] = useState(null);
  const [filterColor, setFilterColor] = useState('all');
  const [generatingReport, setGeneratingReport] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(async u => {
      setUser(u);
      const stores = await base44.entities.Store.filter({ owner_email: u.email });
      if (stores[0]) setStore(stores[0]);
    }).catch(() => base44.auth.redirectToLogin());
  }, []);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['partner-products-predictive', store?.id],
    queryFn: () => base44.entities.Product.filter({ store_id: store.id }, 'expiration_date', 200),
    enabled: !!store?.id,
    refetchInterval: 60000,
  });

  // Sorted: rouge d'abord, puis orange, puis vert
  const sortedProducts = useMemo(() => {
    const order = { red: 0, orange: 1, green: 2, gray: 3, expired: 4 };
    const filtered = filterColor === 'all' ? products : products.filter(p => getDLCColor(p.expiration_date) === filterColor);
    return [...filtered].sort((a, b) => order[getDLCColor(a.expiration_date)] - order[getDLCColor(b.expiration_date)]);
  }, [products, filterColor]);

  const pricingSuggestions = useMemo(() =>
    products.filter(p => getSuggestedPrice(p) !== null && p.status !== 'expired'),
  [products]);

  // KPIs
  const stats = useMemo(() => {
    const now = new Date();
    const urgent = products.filter(p => { const h = differenceInHours(new Date(p.expiration_date || 0), now); return h >= 0 && h < 48; });
    const atRisk = products.filter(p => { const h = differenceInHours(new Date(p.expiration_date || 0), now); return h >= 0 && h < 72; });
    const totalQty = products.reduce((s, p) => s + (p.quantity_available || 0), 0);
    return { urgent: urgent.length, atRisk: atRisk.length, totalProducts: products.length, totalQty };
  }, [products]);

  const applyPriceMutation = useMutation({
    mutationFn: async ({ product, newPrice }) => {
      await base44.entities.Product.update(product.id, { discounted_price: newPrice });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-products-predictive'] });
      toast.success('Prix mis à jour et catalogue synchronisé ✓');
    },
  });

  const generateWeeklyReport = async () => {
    if (!store) return;
    setGeneratingReport(true);
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
    const weekOrders = await base44.entities.Order.filter({ store_id: store.id, status: 'delivered' });
    const weekProductsAtRisk = products.filter(p => p.expiration_date);
    const atRiskQty = weekProductsAtRisk.reduce((s, p) => s + (p.quantity_available || 0), 0);
    const soldQty = weekOrders.reduce((s, o) => s + (o.items?.reduce((ss, i) => ss + (i.quantity || 1), 0) || 0), 0);
    const totalSavingsGenerated = weekOrders.reduce((s, o) => s + (o.total_savings || 0), 0);
    const wasteAvoidedRate = atRiskQty > 0 ? Math.min(1, soldQty / atRiskQty) : 0;
    setWeeklyReport({
      weekStart: format(weekStart, 'd MMM', { locale: fr }),
      weekEnd: format(weekEnd, 'd MMM', { locale: fr }),
      atRiskQty, soldQty, wasteAvoidedRate,
      totalSavingsGenerated,
      ordersCount: weekOrders.length,
    });
    setGeneratingReport(false);
  };

  if (!user || !store) return (
    <div className="min-h-screen flex items-center justify-center">
      {!store && user ? (
        <Card className="p-8 text-center max-w-sm">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
          <p className="font-semibold">Aucun magasin associé à votre compte</p>
        </Card>
      ) : <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-xl"><BarChart3 className="w-6 h-6" /></div>
            <div>
              <h1 className="text-xl font-bold">Dashboard Prédictif</h1>
              <p className="text-emerald-100 text-sm">{store.name}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Produits actifs', val: stats.totalProducts, icon: Package },
              { label: 'Urgents (<48h)', val: stats.urgent, icon: AlertTriangle, alert: stats.urgent > 0 },
              { label: 'À risque (<72h)', val: stats.atRisk, icon: Clock },
            ].map(({ label, val, icon: Icon, alert }) => (
              <Card key={label} className={`bg-white/10 border-white/20 p-3 text-center ${alert ? 'bg-red-400/30' : ''}`}>
                <p className="text-2xl font-bold">{val}</p>
                <p className="text-xs text-emerald-100">{label}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <Tabs defaultValue="products">
          <TabsList className="mb-6">
            <TabsTrigger value="products"><Package className="w-4 h-4 mr-1" />Inventaire DLC</TabsTrigger>
            <TabsTrigger value="pricing">
              <TrendingDown className="w-4 h-4 mr-1" />
              Suggestions prix
              {pricingSuggestions.length > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{pricingSuggestions.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="report"><Leaf className="w-4 h-4 mr-1" />Rapport hebdo</TabsTrigger>
          </TabsList>

          {/* ── Products DLC ── */}
          <TabsContent value="products">
            {/* Color filter */}
            <div className="flex gap-2 flex-wrap mb-4">
              {['all', 'red', 'orange', 'green', 'expired'].map(c => (
                <button key={c}
                  onClick={() => setFilterColor(c)}
                  className={`px-3 py-1.5 rounded-full text-xs border font-medium transition-all ${filterColor === c ? 'bg-gray-800 text-white border-gray-800' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                  {c === 'all' ? 'Tous' : c === 'red' ? '🔴 Urgent' : c === 'orange' ? '🟠 Bientôt' : c === 'green' ? '🟢 Frais' : '⚫ Expiré'}
                </button>
              ))}
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-400" /></div>
            ) : (
              <div className="space-y-2">
                {sortedProducts.map(product => {
                  const color = getDLCColor(product.expiration_date);
                  const cfg = colorConfig[color];
                  const hoursLeft = product.expiration_date ? differenceInHours(new Date(product.expiration_date), new Date()) : null;
                  const suggestion = getSuggestedPrice(product);
                  return (
                    <motion.div key={product.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <Card className={`p-4 border-l-4 ${cfg.border}`}>
                        <div className="flex items-center gap-3">
                          {product.image_url && <img src={product.image_url} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" alt="" />}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-gray-900 truncate">{product.name}</p>
                              <Badge className={cfg.badge}>{cfg.label}</Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                              <span>Stock: {product.quantity_available ?? '—'}</span>
                              {product.expiration_date && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {hoursLeft != null && hoursLeft >= 0 ? `${hoursLeft}h restantes` : 'Expiré'}
                                </span>
                              )}
                              <span>{product.discounted_price?.toLocaleString()} FCFA</span>
                            </div>
                          </div>
                          {suggestion && (
                            <Button size="sm" variant="outline"
                              className="text-amber-600 border-amber-300 hover:bg-amber-50 flex-shrink-0"
                              onClick={() => applyPriceMutation.mutate({ product, newPrice: suggestion.suggested })}>
                              <TrendingDown className="w-3 h-3 mr-1" />
                              -{Math.round(suggestion.discount * 100)}% → {suggestion.suggested.toLocaleString()}
                            </Button>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
                {sortedProducts.length === 0 && (
                  <Card className="p-10 text-center text-gray-400">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    Aucun produit dans cette catégorie
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          {/* ── Pricing Suggestions ── */}
          <TabsContent value="pricing">
            <div className="space-y-3">
              {pricingSuggestions.length === 0 ? (
                <Card className="p-10 text-center text-gray-400">
                  <Check className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  Aucune suggestion de prix pour le moment
                </Card>
              ) : pricingSuggestions.map(product => {
                const s = getSuggestedPrice(product);
                if (!s) return null;
                return (
                  <Card key={product.id} className="p-4 border-l-4 border-amber-300">
                    <div className="flex items-center gap-3">
                      {product.image_url && <img src={product.image_url} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" alt="" />}
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{product.name}</p>
                        <p className="text-xs text-amber-700 mt-0.5">
                          ⏰ {s.hoursLeft}h restantes — Stock: {product.quantity_available}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-sm text-gray-400 line-through">{s.current.toLocaleString()} FCFA</span>
                          <span className="text-base font-bold text-emerald-600">{s.suggested.toLocaleString()} FCFA</span>
                          <Badge className="bg-red-100 text-red-700">-{Math.round(s.discount * 100)}%</Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {s.hoursLeft <= 12 ? 'Réduction agressive recommandée (<12h)' : s.hoursLeft <= 24 ? 'Remise forte recommandée (<24h)' : 'Remise modérée recommandée (<48h)'}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600"
                          disabled={applyPriceMutation.isPending}
                          onClick={() => applyPriceMutation.mutate({ product, newPrice: s.suggested })}>
                          <Check className="w-3 h-3 mr-1" />Appliquer
                        </Button>
                        <Button size="sm" variant="ghost" className="text-gray-400 text-xs">
                          <X className="w-3 h-3 mr-1" />Ignorer
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* ── Weekly Report ── */}
          <TabsContent value="report">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-semibold text-gray-900">Rapport hebdomadaire anti-gaspi</h2>
                <Button onClick={generateWeeklyReport} disabled={generatingReport} variant="outline">
                  {generatingReport ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                  Générer
                </Button>
              </div>

              {weeklyReport ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <Card className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
                    <p className="text-sm text-gray-500 mb-3">Semaine du {weeklyReport.weekStart} au {weeklyReport.weekEnd}</p>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: 'Commandes livrées', val: weeklyReport.ordersCount, icon: '📦' },
                        { label: 'Articles vendus', val: weeklyReport.soldQty, icon: '🛒' },
                        { label: 'Économies générées', val: `${weeklyReport.totalSavingsGenerated?.toLocaleString()} FCFA`, icon: '💰' },
                        { label: 'Taux gaspillage évité', val: `${Math.round(weeklyReport.wasteAvoidedRate * 100)}%`, icon: '♻️', highlight: true },
                      ].map(({ label, val, icon, highlight }) => (
                        <div key={label} className={`p-3 rounded-xl ${highlight ? 'bg-emerald-500 text-white' : 'bg-white'}`}>
                          <p className="text-xl">{icon}</p>
                          <p className={`text-xl font-bold ${highlight ? 'text-white' : 'text-gray-900'}`}>{val}</p>
                          <p className={`text-xs ${highlight ? 'text-emerald-100' : 'text-gray-500'}`}>{label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Gaspillage évité</span>
                        <span>{Math.round(weeklyReport.wasteAvoidedRate * 100)}%</span>
                      </div>
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all"
                          style={{ width: `${weeklyReport.wasteAvoidedRate * 100}%` }}
                        />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ) : (
                <Card className="p-10 text-center text-gray-400">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Cliquez sur "Générer" pour calculer le rapport de la semaine en cours</p>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}