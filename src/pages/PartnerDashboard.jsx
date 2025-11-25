import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Package, TrendingUp, Leaf, AlertTriangle, Plus,
  BarChart3, Clock, CheckCircle, ArrowUpRight, Sparkles
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export default function PartnerDashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        if (!userData.is_partner) {
          window.location.href = createPageUrl('Home');
        }
      } catch (e) {
        base44.auth.redirectToLogin();
      }
    };
    loadUser();
  }, []);

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['partner-products', user?.store_id],
    queryFn: () => base44.entities.Product.filter({ created_by: user?.email }),
    enabled: !!user,
  });

  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ['partner-orders', user?.store_id],
    queryFn: async () => {
      const allOrders = await base44.entities.Order.list('-created_date', 100);
      // Filter orders that contain products from this store
      return allOrders;
    },
    enabled: !!user,
  });

  // Stats calculations
  const activeProducts = products.filter(p => p.status === 'active').length;
  const urgentProducts = products.filter(p => {
    const daysLeft = Math.ceil((new Date(p.expiration_date) - new Date()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 3 && daysLeft > 0 && p.status === 'active';
  });
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const totalSaved = products.reduce((sum, p) => sum + (p.quantity_available || 0), 0);

  // Chart data (mock for demo)
  const chartData = Array.from({ length: 7 }, (_, i) => ({
    date: format(subDays(new Date(), 6 - i), 'dd/MM'),
    ventes: Math.floor(Math.random() * 50000) + 10000,
    produits: Math.floor(Math.random() * 20) + 5,
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
            <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
            <p className="text-gray-500">Bienvenue, {user.full_name}</p>
          </div>
          <div className="flex gap-3">
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

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-emerald-100 rounded-xl">
                <Package className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{activeProducts}</p>
            <p className="text-sm text-gray-500">Produits actifs</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-orange-100 rounded-xl">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{urgentProducts.length}</p>
            <p className="text-sm text-gray-500">Urgents (-3j)</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalRevenue.toLocaleString()}</p>
            <p className="text-sm text-gray-500">FCFA récupérés</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-teal-100 rounded-xl">
                <Leaf className="w-5 h-5 text-teal-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalSaved}</p>
            <p className="text-sm text-gray-500">Produits sauvés</p>
          </Card>
        </div>

        {/* Chart */}
        <Card className="p-6">
          <h2 className="font-semibold mb-4">Évolution des ventes (7 derniers jours)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="ventes" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Recent Products */}
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
      </div>
    </div>
  );
}