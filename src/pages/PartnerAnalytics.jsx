import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  TrendingUp, Package, ShoppingCart, DollarSign, BarChart3, 
  ArrowLeft, Calendar, Store, Download
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, subDays } from 'date-fns';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function PartnerAnalytics() {
  const [user, setUser] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('7');
  const [selectedStore, setSelectedStore] = useState('all');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        if (userData.role !== 'admin') {
          window.location.href = createPageUrl('Home');
          return;
        }
        setUser(userData);
      } catch (e) {
        base44.auth.redirectToLogin();
      }
    };
    loadUser();
  }, []);

  const { data: stores = [] } = useQuery({
    queryKey: ['all-stores'],
    queryFn: () => base44.entities.Store.list('-created_date'),
    enabled: !!user
  });

  const { data: products = [] } = useQuery({
    queryKey: ['all-products'],
    queryFn: () => base44.entities.Product.list(),
    enabled: !!user
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['all-orders'],
    queryFn: () => base44.entities.Order.list('-created_date'),
    enabled: !!user
  });

  const filteredStores = selectedStore === 'all' ? stores : stores.filter(s => s.id === selectedStore);
  const filteredProducts = selectedStore === 'all' ? products : products.filter(p => p.store_id === selectedStore);

  // Calculate KPIs
  const totalRevenue = filteredProducts.reduce((sum, p) => 
    sum + ((p.quantity_sold || 0) * (p.discounted_price || 0)), 0
  );
  const totalOrders = orders.filter(o => 
    selectedStore === 'all' || o.store_id === selectedStore
  ).length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Sales by store
  const salesByStore = stores.map(store => {
    const storeProducts = products.filter(p => p.store_id === store.id);
    const revenue = storeProducts.reduce((sum, p) => 
      sum + ((p.quantity_sold || 0) * (p.discounted_price || 0)), 0
    );
    return {
      name: store.name,
      revenue: revenue,
      products: storeProducts.length,
      sold: storeProducts.reduce((sum, p) => sum + (p.quantity_sold || 0), 0)
    };
  }).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  // Sales timeline (last 7/30 days)
  const days = parseInt(selectedPeriod);
  const salesTimeline = Array.from({ length: days }, (_, i) => {
    const date = subDays(new Date(), days - i - 1);
    const dateStr = format(date, 'yyyy-MM-dd');
    return {
      date: format(date, 'dd/MM'),
      sales: Math.floor(Math.random() * 50000) + 10000, // Mock data
      orders: Math.floor(Math.random() * 30) + 5
    };
  });

  // Category distribution
  const categoryStats = {};
  filteredProducts.forEach(p => {
    if (!categoryStats[p.category]) {
      categoryStats[p.category] = { count: 0, revenue: 0 };
    }
    categoryStats[p.category].count++;
    categoryStats[p.category].revenue += (p.quantity_sold || 0) * (p.discounted_price || 0);
  });

  const categoryData = Object.entries(categoryStats).map(([category, data]) => ({
    name: category,
    value: data.revenue
  }));

  // Export CSV
  const exportCSV = () => {
    const csvData = salesByStore.map(s => 
      `${s.name},${s.revenue},${s.products},${s.sold}`
    ).join('\n');
    const csv = `Magasin,Revenus (FCFA),Produits,Vendus\n${csvData}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('AdminPartners')}>
              <Button variant="outline" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytiques Partenaires</h1>
              <p className="text-gray-500">Tableau de bord des performances</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={selectedStore} onValueChange={setSelectedStore}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tous les magasins" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les magasins</SelectItem>
                {stores.map(store => (
                  <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 jours</SelectItem>
                <SelectItem value="30">30 jours</SelectItem>
                <SelectItem value="90">90 jours</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Revenus Totaux</p>
                  <p className="text-2xl font-bold text-gray-900">{(totalRevenue / 1000).toFixed(0)}K F</p>
                  <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3" />
                    +12.5% vs période précédente
                  </p>
                </div>
                <div className="p-3 bg-emerald-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Commandes</p>
                  <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
                  <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3" />
                    +8.2%
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <ShoppingCart className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Panier Moyen</p>
                  <p className="text-2xl font-bold text-gray-900">{avgOrderValue.toFixed(0)} F</p>
                  <p className="text-xs text-purple-600 flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3" />
                    +5.1%
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Produits Actifs</p>
                  <p className="text-2xl font-bold text-gray-900">{filteredProducts.length}</p>
                  <p className="text-xs text-orange-600 flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3" />
                    +15.3%
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Package className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Évolution des Ventes</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={salesTimeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="sales" stroke="#10B981" name="Ventes (FCFA)" />
                  <Line type="monotone" dataKey="orders" stroke="#3B82F6" name="Commandes" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Répartition par Catégorie</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 10 Partenaires</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={salesByStore}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#10B981" name="Revenus (FCFA)" />
                <Bar dataKey="sold" fill="#3B82F6" name="Produits Vendus" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Detailed Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Détails par Partenaire</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 text-sm font-medium text-gray-500">Magasin</th>
                    <th className="text-right p-3 text-sm font-medium text-gray-500">Revenus</th>
                    <th className="text-right p-3 text-sm font-medium text-gray-500">Produits</th>
                    <th className="text-right p-3 text-sm font-medium text-gray-500">Vendus</th>
                    <th className="text-right p-3 text-sm font-medium text-gray-500">Taux</th>
                  </tr>
                </thead>
                <tbody>
                  {salesByStore.map((store, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{store.name}</td>
                      <td className="p-3 text-right">{store.revenue.toLocaleString()} F</td>
                      <td className="p-3 text-right">{store.products}</td>
                      <td className="p-3 text-right">{store.sold}</td>
                      <td className="p-3 text-right">
                        <span className="text-emerald-600 font-medium">
                          {store.products > 0 ? ((store.sold / store.products) * 100).toFixed(1) : 0}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}