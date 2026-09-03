import React, { useState } from 'react';
import { api } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BackofficeLayout from '@/components/backoffice/BackofficeLayout';
import { Search, Filter, Download, ShieldCheck, AlertTriangle, Info, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

const ACTION_TYPES = {
  create: { label: 'Création', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  update: { label: 'Modification', color: 'bg-orange-100 text-orange-700', icon: Info },
  delete: { label: 'Suppression', color: 'bg-red-100 text-red-700', icon: XCircle },
  login: { label: 'Connexion', color: 'bg-emerald-100 text-emerald-700', icon: ShieldCheck },
  export: { label: 'Export', color: 'bg-purple-100 text-purple-700', icon: Download },
  error: { label: 'Erreur', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
};

export default function BackofficeLogs() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  /**
   * Journal réel : chaque ligne a été écrite par le serveur au moment de
   * l'action. L'ancien écran reconstituait un journal à partir des commandes,
   * avec des adresses IP tirées au hasard — y compris dans l'export CSV.
   */
  const { data, isFetching, refetch } = useQuery({
    queryKey: ['audit-logs', search, actionFilter, page],
    queryFn: () =>
      api.backoffice.auditLogs({
        search: search || undefined,
        action: actionFilter,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      }),
    placeholderData: (previous) => previous,
    refetchInterval: 60_000,
  });

  const pagedLogs = data?.data ?? [];
  const totalLogs = data?.meta?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalLogs / PAGE_SIZE));

  const exportLogs = () => {
    const rows = [
      ['Date', 'Action', 'Module', 'Description', 'Utilisateur', 'Rôle', 'IP', 'Succès'],
      ...pagedLogs.map((l) => [
        l.created_date,
        l.action,
        l.module,
        `"${(l.description ?? '').replace(/"/g, '""')}"`,
        l.actor_email ?? '',
        l.actor_role ?? '',
        l.ip ?? '',
        l.success ? 'oui' : 'non',
      ]),
    ];
    const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `journal-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`${pagedLogs.length} lignes exportées`);
  };

  // Comptés sur la page affichée ; `total` vient du serveur.
  const stats = {
    total: totalLogs,
    errors: pagedLogs.filter((l) => !l.success).length,
    creates: pagedLogs.filter((l) => l.action === 'create').length,
    updates: pagedLogs.filter((l) => l.action === 'update').length,
  };

  return (
    <BackofficeLayout currentPage="Audit & Logs">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">Audit & Journaux</h1>
            <p className="text-sm text-gray-500">{totalLogs} événements enregistrés</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { refetch(); toast.success('Logs actualisés'); }} disabled={isFetching}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Button variant="outline" size="sm" onClick={exportLogs}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total événements', value: stats.total, color: 'text-gray-900', bg: 'bg-gray-50', border: 'border-gray-200' },
            { label: 'Créations', value: stats.creates, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
            { label: 'Modifications', value: stats.updates, color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
            { label: 'Erreurs', value: stats.errors, color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
          ].map((s, i) => (
            <div key={i} className={`p-4 rounded-xl border ${s.bg} ${s.border}`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Rechercher dans les logs..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} className="pl-9" />
          </div>
          <Select value={actionFilter} onValueChange={v => { setActionFilter(v); setPage(0); }}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Type d'action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les actions</SelectItem>
              {Object.entries(ACTION_TYPES).map(([key, t]) => (
                <SelectItem key={key} value={key}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Logs table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Action</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Module</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Description</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Utilisateur</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Date</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {pagedLogs.map((log) => {
                  const actionInfo = ACTION_TYPES[log.action] || ACTION_TYPES.update;
                  const ActionIcon = actionInfo.icon;
                  return (
                    <tr key={log.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${actionInfo.color}`}>
                          <ActionIcon className="w-3 h-3" />
                          {actionInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{log.module}</td>
                      <td className="px-4 py-3 text-gray-800 max-w-xs truncate">{log.description}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{log.user_email || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {log.timestamp ? format(new Date(log.timestamp), 'dd MMM, HH:mm', { locale: fr }) : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {log.success ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500 inline" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500 inline" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
              <p className="text-sm text-gray-500">
                {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalLogs)} sur {totalLogs}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 0}>Précédent</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>Suivant</Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </BackofficeLayout>
  );
}