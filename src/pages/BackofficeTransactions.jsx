import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import BackofficeLayout from '@/components/backoffice/BackofficeLayout';
import { Search, Filter, Download, Eye, DollarSign, TrendingUp, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { subDays } from 'date-fns';

const STATUS_CONFIG = {
  pending: { label: 'En attente', color: 'bg-orange-100 text-orange-700', icon: Clock },
  confirmed: { label: 'Confirmée', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  ready: { label: 'Prête', color: 'bg-purple-100 text-purple-700', icon: CheckCircle },
  delivered: { label: 'Livrée', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  cancelled: { label: 'Annulée', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function BackofficeTransactions() {
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => base44.auth.redirectToLogin());
  }, []);

  const { data: orders = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['bo-transactions'],
    queryFn: () => base44.entities.Order.list('-created_date', 200),
    refetchInterval: 20000
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Order.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bo-transactions'] });
      toast.success('Statut mis à jour');
      setSelectedOrder(null);
    }
  });

  const filteredOrders = orders.filter(o => {
    const matchSearch = !search ||
      o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_email?.toLowerCase().includes(search.toLowerCase()) ||
      o.store_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const pagedOrders = filteredOrders.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filteredOrders.length / PAGE_SIZE);

  // KPIs
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;
  const cancelledCount = orders.filter(o => o.status === 'cancelled').length;

  // Trend
  const trendData = [...Array(14)].map((_, i) => {
    const date = subDays(new Date(), 13 - i);
    const ds = date.toISOString().split('T')[0];
    const dayOrders = orders.filter(o => o.created_date?.startsWith(ds));
    return {
      date: format(date, 'dd MMM', { locale: fr }),
      revenue: Math.round(dayOrders.reduce((s, o) => s + (o.total_amount || 0), 0) / 1000),
      orders: dayOrders.length
    };
  });

  const exportCSV = () => {
    const csv = [
      ['ID', 'Client', 'Email', 'Montant', 'Statut', 'Magasin', 'Type', 'Date'].join(','),
      ...filteredOrders.map(o => [
        o.id?.slice(0, 8), o.customer_name, o.customer_email,
        o.total_amount, o.status, o.store_name, o.delivery_type,
        o.created_date?.split('T')[0]
      ].join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    toast.success('Transactions exportées');
  };

  return (
    <BackofficeLayout currentPage="Transactions">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">Transactions</h1>
            <p className="text-sm text-gray-500">{orders.length} commandes au total</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { refetch(); toast.success('Actualisé'); }} disabled={isFetching}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Live
            </Button>
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Revenus totaux', value: (totalRevenue / 1000).toFixed(0) + 'k F', icon: DollarSign, color: 'bg-indigo-100 text-indigo-600' },
            { label: 'Panier moyen', value: avgOrderValue.toFixed(0) + ' F', icon: TrendingUp, color: 'bg-emerald-100 text-emerald-600' },
            { label: 'Livrées', value: deliveredCount, icon: CheckCircle, color: 'bg-blue-100 text-blue-600' },
            { label: 'Annulées', value: cancelledCount, icon: XCircle, color: 'bg-red-100 text-red-600' },
          ].map((kpi, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${kpi.color}`}>
                  <kpi.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{kpi.label}</p>
                  <p className="text-xl font-bold">{kpi.value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Trend chart */}
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Revenus (14 derniers jours)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#colorRev)" strokeWidth={2} name="Revenus (k F)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Filters & status pills */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Rechercher une transaction..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(0); }}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status summary */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
            const count = orders.filter(o => o.status === key).length;
            return (
              <button key={key} onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
                className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${cfg.color} ${statusFilter === key ? 'ring-2 ring-indigo-400' : ''}`}>
                {cfg.label}: {count}
              </button>
            );
          })}
        </div>

        {/* Transactions table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">ID</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Client</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Magasin</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Montant</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Statut</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Date</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b">
                      <td colSpan={7} className="px-4 py-3">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : pagedOrders.map((order) => {
                  const sCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                  const SIcon = sCfg.icon;
                  return (
                    <tr key={order.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">#{order.id?.slice(0, 8)}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{order.customer_name || '—'}</p>
                        <p className="text-xs text-gray-400">{order.customer_email}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{order.store_name || '—'}</td>
                      <td className="px-4 py-3 text-right font-bold">{(order.total_amount || 0).toLocaleString()} F</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${sCfg.color}`}>
                          <SIcon className="w-3 h-3" />
                          {sCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {order.created_date ? format(new Date(order.created_date), 'dd MMM, HH:mm', { locale: fr }) : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => setSelectedOrder(order)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-indigo-600">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
              <p className="text-sm text-gray-500">{page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filteredOrders.length)} sur {filteredOrders.length}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 0}>Précédent</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>Suivant</Button>
              </div>
            </div>
          )}
        </Card>

        {/* Order detail dialog */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Commande #{selectedOrder?.id?.slice(0, 8)}</DialogTitle></DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Client</p>
                    <p className="font-semibold">{selectedOrder.customer_name}</p>
                    <p className="text-xs text-gray-500">{selectedOrder.customer_email}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Montant</p>
                    <p className="font-bold text-indigo-600 text-lg">{(selectedOrder.total_amount || 0).toLocaleString()} F</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-2">Articles ({selectedOrder.items?.length || 0})</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {(selectedOrder.items || []).map((item, i) => (
                      <div key={i} className="flex justify-between text-sm px-2 py-1 bg-gray-50 rounded">
                        <span>{item.product_name}</span>
                        <span className="font-medium">{(item.unit_price * item.quantity).toLocaleString()} F</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-2">Changer le statut</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                      <button
                        key={key}
                        onClick={() => updateMutation.mutate({ id: selectedOrder.id, status: key })}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all hover:shadow ${cfg.color} ${selectedOrder.status === key ? 'ring-2 ring-indigo-400' : ''}`}
                      >
                        {cfg.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </BackofficeLayout>
  );
}