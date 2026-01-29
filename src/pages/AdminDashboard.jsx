import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard, Store, Package, Users, TrendingUp, Clock,
  CheckCircle, AlertTriangle, DollarSign, ShoppingBag, Truck, BarChart3
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        if (userData.role !== 'admin') {
          navigate(createPageUrl('Home'));
        }
      } catch (e) {
        base44.auth.redirectToLogin();
      }
    };
    loadUser();
  }, []);

  const { data: stores = [] } = useQuery({
    queryKey: ['all-stores'],
    queryFn: () => base44.entities.Store.list(),
    enabled: !!user
  });

  const { data: products = [] } = useQuery({
    queryKey: ['all-products'],
    queryFn: () => base44.entities.Product.list(),
    enabled: !!user
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['all-orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 100),
    enabled: !!user
  });

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
    enabled: !!user
  });

  // Calculate stats
  const pendingStores = stores.filter(s => s.status === 'pending').length;
  const verifiedStores = stores.filter(s => s.status === 'verified').length;
  const activeProducts = products.filter(p => p.status === 'active').length;
  const expiringSoon = products.filter(p => {
    const daysLeft = Math.ceil((new Date(p.expiration_date) - new Date()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 3 && p.status === 'active';
  }).length;

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;

  // Chart data - Orders per day (last 7 days)
  const last7Days = [...Array(7)].map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  const ordersChartData = last7Days.map(date => {
    const dayOrders = orders.filter(o => o.created_date?.startsWith(date));
    return {
      date: new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
      orders: dayOrders.length,
      revenue: dayOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0) / 1000
    };
  });

  const quickActions = [
    { label: 'Gérer les partenaires', icon: Store, href: 'AdminPartners', color: 'bg-blue-500' },
    { label: 'Valider les magasins', icon: CheckCircle, href: 'AdminPartners', badge: pendingStores, color: 'bg-orange-500' },
    { label: 'Produits urgents', icon: AlertTriangle, href: 'StockGuardian', badge: expiringSoon, color: 'bg-red-500' },
    { label: 'Gestion livraisons', icon: Truck, href: 'DeliveryOptimization', color: 'bg-purple-500' }
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-white/20 rounded-xl">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Tableau de bord administrateur</h1>
              <p className="text-indigo-100">Vue d'ensemble de la plateforme CHICHARD</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-4">
              <div className="flex items-center gap-3">
                <Store className="w-8 h-8" />
                <div>
                  <p className="text-2xl font-bold">{stores.length}</p>
                  <p className="text-sm text-indigo-100">Magasins</p>
                </div>
              </div>
            </Card>
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-4">
              <div className="flex items-center gap-3">
                <Package className="w-8 h-8" />
                <div>
                  <p className="text-2xl font-bold">{products.length}</p>
                  <p className="text-sm text-indigo-100">Produits</p>
                </div>
              </div>
            </Card>
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-4">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-8 h-8" />
                <div>
                  <p className="text-2xl font-bold">{orders.length}</p>
                  <p className="text-sm text-indigo-100">Commandes</p>
                </div>
              </div>
            </Card>
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8" />
                <div>
                  <p className="text-2xl font-bold">{users.length}</p>
                  <p className="text-sm text-indigo-100">Utilisateurs</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Quick Actions */}
        <div className="grid md:grid-cols-4 gap-4">
          {quickActions.map((action, idx) => (
            <Link key={idx} to={createPageUrl(action.href)}>
              <Card className={`p-4 hover:shadow-lg transition-all cursor-pointer ${action.color} text-white`}>
                <div className="flex items-center justify-between mb-2">
                  <action.icon className="w-6 h-6" />
                  {action.badge > 0 && (
                    <Badge className="bg-white text-gray-900">{action.badge}</Badge>
                  )}
                </div>
                <p className="font-semibold">{action.label}</p>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Revenue & Orders Chart */}
          <Card className="p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-500" />
              Commandes & Revenus (7 derniers jours)
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={ordersChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="orders" fill="#6366f1" name="Commandes" />
                <Bar dataKey="revenue" fill="#10b981" name="Revenus (k FCFA)" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Key Metrics */}
          <Card className="p-6">
            <h3 className="font-bold mb-4">Métriques clés</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-8 h-8 text-emerald-600" />
                  <div>
                    <p className="text-sm text-gray-600">Revenus totaux</p>
                    <p className="text-xl font-bold text-emerald-600">{totalRevenue.toLocaleString()} F</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Commandes livrées</p>
                    <p className="text-xl font-bold text-blue-600">{deliveredOrders}</p>
                  </div>
                </div>
                <Badge variant="outline">{Math.round((deliveredOrders / orders.length) * 100)}%</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="w-8 h-8 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-600">En attente</p>
                    <p className="text-xl font-bold text-orange-600">{pendingOrders}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Store className="w-8 h-8 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Magasins actifs</p>
                    <p className="text-xl font-bold text-purple-600">{verifiedStores}</p>
                  </div>
                </div>
                <Badge variant="outline">{pendingStores} en attente</Badge>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="p-6">
          <h3 className="font-bold mb-4">Activité récente</h3>
          <div className="space-y-3">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{order.customer_name}</p>
                    <p className="text-sm text-gray-500">{order.items?.length} article(s)</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-600">{order.total_amount?.toLocaleString()} F</p>
                  <Badge className={
                    order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                    order.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-100 text-blue-700'
                  }>
                    {order.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}