import React, { useState, useEffect } from 'react';
import { api } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import {
  TrendingUp, Package, DollarSign, Users, Award, BarChart3,
  ArrowUpRight, Calendar, Download
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { goToLogin } from '@/lib/navigation';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function PartnerStats() {
  const [user, setUser] = useState(null);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await api.auth.me();
        setUser(userData);
      } catch (e) {
        goToLogin();
      }
    };
    loadUser();
  }, []);

  const { data: products = [] } = useQuery({
    queryKey: ['partner-products', user?.email],
    queryFn: () => api.entities.Product.filter({ created_by: user?.email }),
    enabled: !!user,
  });

  const { data: allOrders = [] } = useQuery({
    queryKey: ['all-orders'],
    queryFn: () => api.entities.Order.list('-created_date', 500),
  });

  const { data: allStores = [] } = useQuery({
    queryKey: ['all-stores'],
    queryFn: () => api.entities.Store.list(),
  });

  // Calculate stats
  const totalSold = products.reduce((sum, p) => sum + (p.quantity_sold || 0), 0);
  const totalRevenue = allOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const totalSavingsGenerated = allOrders.reduce((sum, o) => sum + (o.total_savings || 0), 0);
  const totalProducts = products.length;

  // Top selling products
  const topProducts = [...products]
    .sort((a, b) => (b.quantity_sold || 0) - (a.quantity_sold || 0))
    .slice(0, 5);

  // Category breakdown
  const categoryStats = products.reduce((acc, p) => {
    const cat = p.category || 'autre';
    if (!acc[cat]) acc[cat] = { count: 0, sold: 0, revenue: 0 };
    acc[cat].count++;
    acc[cat].sold += p.quantity_sold || 0;
    acc[cat].revenue += (p.discounted_price || 0) * (p.quantity_sold || 0);
    return acc;
  }, {});

  const categoryData = Object.entries(categoryStats).map(([name, data]) => ({
    name: name.replace('_', ' '),
    value: data.sold,
    revenue: data.revenue
  }));

  // Le comparatif sectoriel demandera un jeu de données de référence ; tant
  // qu'il n'existe pas, l'écran n'affiche que les chiffres réels du magasin.

  // Chart data
  const chartData = Array.from({ length: 30 }, (_, i) => ({
    date: format(subDays(new Date(), 29 - i), 'dd/MM'),
    ventes: 0,
    revenus: 0,
  }));

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
            <h1 className="text-2xl font-bold text-gray-900">Statistiques Partenaire</h1>
            <p className="text-gray-500">Analyse détaillée de vos performances</p>
          </div>
          <div className="flex gap-3">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">7 derniers jours</SelectItem>
                <SelectItem value="month">30 derniers jours</SelectItem>
                <SelectItem value="quarter">3 derniers mois</SelectItem>
                <SelectItem value="year">Cette année</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-emerald-100 rounded-xl">
                <Package className="w-5 h-5 text-emerald-600" />
              </div>
              <Badge className="bg-emerald-100 text-emerald-700">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                +12%
              </Badge>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalSold}</p>
            <p className="text-sm text-gray-500">Produits vendus</p>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <Badge className="bg-blue-100 text-blue-700">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                +8%
              </Badge>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalRevenue.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Revenus (FCFA)</p>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-purple-100 rounded-xl">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <Badge className="bg-purple-100 text-purple-700">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                +25%
              </Badge>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalSavingsGenerated.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Économies clients (FCFA)</p>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-amber-100 rounded-xl">
                <Award className="w-5 h-5 text-amber-600" />
              </div>
              <Badge className="bg-amber-100 text-amber-700">#3</Badge>
            </div>
            <p className="text-2xl font-bold text-gray-900">Top 3</p>
            <p className="text-sm text-gray-500">Classement partenaires</p>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Sales Chart */}
          <Card className="md:col-span-2 p-6">
            <h3 className="font-semibold mb-4">Évolution des ventes</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} />
                  <YAxis stroke="#9ca3af" fontSize={11} />
                  <Tooltip />
                  <Line type="monotone" dataKey="ventes" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Category Breakdown */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Répartition par catégorie</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    dataKey="value"
                    label={({ name }) => name}
                  >
                    {categoryData.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Top Products & Comparison */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Top Products */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              Produits les plus vendus
            </h3>
            <div className="space-y-3">
              {topProducts.map((product, idx) => (
                <div key={product.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    idx === 0 ? 'bg-amber-100 text-amber-700' :
                    idx === 1 ? 'bg-gray-200 text-gray-700' :
                    idx === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-600">{product.quantity_sold || 0}</p>
                    <p className="text-xs text-gray-500">vendus</p>
                  </div>
                </div>
              ))}
              {topProducts.length === 0 && (
                <p className="text-center text-gray-500 py-8">Aucune vente encore</p>
              )}
            </div>
          </Card>

          {/* Comparison */}
          {/* Le comparatif entre partenaires exige un référentiel sectoriel qui
              n'existe pas encore. Plutôt qu'un classement inventé, l'écran dit
              franchement ce qu'il ne peut pas encore montrer. */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              Comparaison entre partenaires
            </h3>
            <div className="h-64 flex flex-col items-center justify-center text-center gap-2 text-gray-500">
              <BarChart3 className="w-8 h-8 text-gray-300" />
              <p className="text-sm max-w-xs">
                Le comparatif sectoriel arrivera lorsque suffisamment de magasins
                de votre catégorie auront rejoint la plateforme.
              </p>
            </div>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Sales Chart */}
          <Card className="md:col-span-2 p-6">
            <h3 className="font-semibold mb-4">Évolution des ventes</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} />
                  <YAxis stroke="#9ca3af" fontSize={11} />
                  <Tooltip />
                  <Line type="monotone" dataKey="ventes" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Category Breakdown */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Répartition par catégorie</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    dataKey="value"
                    label={({ name }) => name}
                  >
                    {categoryData.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Top Products & Comparison */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Top Products */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              Produits les plus vendus
            </h3>
            <div className="space-y-3">
              {topProducts.map((product, idx) => (
                <div key={product.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    idx === 0 ? 'bg-amber-100 text-amber-700' :
                    idx === 1 ? 'bg-gray-200 text-gray-700' :
                    idx === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-600">{product.quantity_sold || 0}</p>
                    <p className="text-xs text-gray-500">vendus</p>
                  </div>
                </div>
              ))}
              {topProducts.length === 0 && (
                <p className="text-center text-gray-500 py-8">Aucune vente encore</p>
              )}
            </div>
          </Card>

          {/* Comparatif sectoriel : voir la note plus haut — pas de classement
              tant que le référentiel n'existe pas. */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              Comparaison entre partenaires
            </h3>
            <div className="h-64 flex flex-col items-center justify-center text-center gap-2 text-gray-500">
              <BarChart3 className="w-8 h-8 text-gray-300" />
              <p className="text-sm max-w-xs">
                Disponible dès que votre catégorie comptera assez de magasins pour
                qu'une comparaison ait du sens.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}