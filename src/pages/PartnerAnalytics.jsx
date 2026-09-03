import React, { useState, useEffect } from 'react';
import { api } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TrendingUp, Users, Package, DollarSign, Download,
  Calendar as CalendarIcon
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { goToLogin } from '@/lib/navigation';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function PartnerAnalytics() {
  const [user, setUser] = useState(null);
  const [store, setStore] = useState(null);
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [selectedCampaign, setSelectedCampaign] = useState('all');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await api.auth.me();
        setUser(userData);
        const stores = await api.entities.Store.filter({ owner_email: userData.email });
        setStore(stores[0]);
      } catch (e) {
        goToLogin();
      }
    };
    loadUser();
  }, []);

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaign-metrics', store?.id],
    queryFn: () => api.entities.CampaignMetrics.filter({ store_id: store.id }, '-created_date'),
    enabled: !!store
  });

  const { data: products = [] } = useQuery({
    queryKey: ['store-products-analytics', store?.id],
    queryFn: () => api.entities.Product.filter({ store_id: store.id }),
    enabled: !!store
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['store-orders-analytics', store?.id],
    queryFn: () => api.entities.Order.filter({ store_id: store.id }, '-created_date', 200),
    enabled: !!store
  });

  const { data: segments = [] } = useQuery({
    queryKey: ['customer-segments'],
    queryFn: () => api.entities.CustomerSegment.list(),
    enabled: !!store
  });

  // Calculate campaign ROI data
  const campaignROIData = campaigns.map(c => ({
    name: c.campaign_name,
    revenue: c.revenue / 1000,
    cost: c.cost / 1000,
    roi: c.roi,
    conversions: c.conversions
  }));

  // Product performance data
  const productPerformanceData = products
    .sort((a, b) => (b.quantity_sold || 0) - (a.quantity_sold || 0))
    .slice(0, 10)
    .map(p => ({
      name: p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
      sold: p.quantity_sold || 0,
      revenue: ((p.discounted_price || 0) * (p.quantity_sold || 0)) / 1000
    }));

  // Customer segmentation data
  const segmentData = [
    { name: 'Nouveaux', value: segments.filter(s => s.segment_type === 'new').length },
    { name: 'Réguliers', value: segments.filter(s => s.segment_type === 'regular').length },
    { name: 'VIP', value: segments.filter(s => s.segment_type === 'vip').length },
    { name: 'À risque', value: segments.filter(s => s.segment_type === 'at_risk').length },
    { name: 'Dormants', value: segments.filter(s => s.segment_type === 'dormant').length }
  ].filter(d => d.value > 0);

  // Orders trend (last 30 days)
  const last30Days = [...Array(30)].map((_, i) => {
    const date = subDays(new Date(), 29 - i);
    return date.toISOString().split('T')[0];
  });

  const ordersTrendData = last30Days.map(date => {
    const dayOrders = orders.filter(o => o.created_date?.startsWith(date));
    return {
      date: format(new Date(date), 'dd MMM', { locale: fr }),
      orders: dayOrders.length,
      revenue: dayOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0) / 1000
    };
  });

  // Promotion effectiveness
  const promotionData = campaigns.map(c => ({
    campaign: c.campaign_name,
    impressions: c.impressions,
    clicks: c.clicks,
    conversions: c.conversions,
    conversion_rate: c.conversion_rate * 100
  }));

  // Export report
  const exportReport = () => {
    const reportData = {
      store: store.name,
      period: `${format(dateRange.from, 'dd/MM/yyyy')} - ${format(dateRange.to, 'dd/MM/yyyy')}`,
      campaigns: campaigns.length,
      total_revenue: campaigns.reduce((sum, c) => sum + c.revenue, 0),
      total_roi: campaigns.reduce((sum, c) => sum + c.roi, 0) / campaigns.length,
      products_sold: products.reduce((sum, p) => sum + (p.quantity_sold || 0), 0)
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-analytics-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
  };

  if (!store) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Analytics avancées</h1>
            <p className="text-gray-500">Analyses détaillées de vos performances</p>
          </div>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  {format(dateRange.from, 'dd MMM', { locale: fr })} - {format(dateRange.to, 'dd MMM', { locale: fr })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            <Button onClick={exportReport} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Revenus totaux</p>
                <p className="text-xl font-bold">
                  {(campaigns.reduce((sum, c) => sum + c.revenue, 0) / 1000).toFixed(0)}k F
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">ROI moyen</p>
                <p className="text-xl font-bold">
                  {campaigns.length > 0 
                    ? (campaigns.reduce((sum, c) => sum + c.roi, 0) / campaigns.length).toFixed(1) 
                    : 0}%
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Clients segments</p>
                <p className="text-xl font-bold">{segments.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Package className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Produits vendus</p>
                <p className="text-xl font-bold">
                  {products.reduce((sum, p) => sum + (p.quantity_sold || 0), 0)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="campaigns" className="space-y-6">
          <TabsList>
            <TabsTrigger value="campaigns">Campagnes</TabsTrigger>
            <TabsTrigger value="products">Produits</TabsTrigger>
            <TabsTrigger value="customers">Clients</TabsTrigger>
            <TabsTrigger value="trends">Tendances</TabsTrigger>
          </TabsList>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">ROI des campagnes</h3>
                <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les campagnes</SelectItem>
                    {campaigns.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.campaign_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={campaignROIData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="revenue" fill="#10b981" name="Revenus (k FCFA)" />
                  <Bar yAxisId="left" dataKey="cost" fill="#ef4444" name="Coûts (k FCFA)" />
                  <Bar yAxisId="right" dataKey="roi" fill="#3b82f6" name="ROI %" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h3 className="font-bold mb-4">Efficacité des promotions</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={promotionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="campaign" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="impressions" stroke="#8b5cf6" name="Impressions" />
                  <Line type="monotone" dataKey="clicks" stroke="#3b82f6" name="Clics" />
                  <Line type="monotone" dataKey="conversions" stroke="#10b981" name="Conversions" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <Card className="p-6">
              <h3 className="font-bold mb-4">Top 10 produits par ventes</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={productPerformanceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sold" fill="#10b981" name="Quantité vendue" />
                  <Bar dataKey="revenue" fill="#3b82f6" name="Revenus (k FCFA)" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="font-bold mb-4">Taux d'écoulement par catégorie</h3>
                <div className="space-y-3">
                  {['fruits_legumes', 'produits_laitiers', 'viandes_poissons', 'boulangerie'].map(cat => {
                    const catProducts = products.filter(p => p.category === cat);
                    const sold = catProducts.reduce((sum, p) => sum + (p.quantity_sold || 0), 0);
                    const total = catProducts.reduce((sum, p) => sum + (p.quantity_available || 0) + (p.quantity_sold || 0), 0);
                    const rate = total > 0 ? (sold / total) * 100 : 0;

                    return (
                      <div key={cat}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm capitalize">{cat.replace(/_/g, ' ')}</span>
                          <span className="text-sm font-bold">{rate.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-emerald-500 h-2 rounded-full"
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold mb-4">Statut des produits</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Actifs', value: products.filter(p => p.status === 'active').length },
                        { name: 'Rupture', value: products.filter(p => p.status === 'sold_out').length },
                        { name: 'Expirés', value: products.filter(p => p.status === 'expired').length }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="font-bold mb-4">Segmentation clients</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={segmentData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {segmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold mb-4">Analyse comportementale</h3>
                <div className="space-y-4">
                  {['new', 'regular', 'vip', 'at_risk'].map(type => {
                    const typeSegments = segments.filter(s => s.segment_type === type);
                    const avgSpent = typeSegments.reduce((sum, s) => sum + (s.total_spent || 0), 0) / (typeSegments.length || 1);
                    const avgOrders = typeSegments.reduce((sum, s) => sum + (s.total_orders || 0), 0) / (typeSegments.length || 1);

                    return (
                      <div key={type} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold capitalize">{type.replace('_', ' ')}</span>
                          <Badge>{typeSegments.length} clients</Badge>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Panier moyen: {avgSpent.toFixed(0)} FCFA</p>
                          <p>Commandes moyennes: {avgOrders.toFixed(1)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <Card className="p-6">
              <h3 className="font-bold mb-4">Évolution des ventes (30 jours)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={ordersTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="orders" stackId="1" stroke="#3b82f6" fill="#3b82f6" name="Commandes" />
                  <Area type="monotone" dataKey="revenue" stackId="2" stroke="#10b981" fill="#10b981" name="Revenus (k FCFA)" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}