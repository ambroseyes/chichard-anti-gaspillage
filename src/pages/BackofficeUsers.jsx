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
import { Search, Filter, MoreVertical, Shield, User, UserCheck, Download, Plus, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const ROLES = {
  super_admin: { label: 'Super Admin', color: 'bg-red-100 text-red-700 border-red-200', icon: '🔴' },
  admin: { label: 'Admin', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: '🟠' },
  operator: { label: 'Opérateur', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: '🔵' },
  user: { label: 'Utilisateur', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: '⚪' },
};

const PERMISSIONS_MATRIX = [
  { module: 'Tableau de bord', read: ['super_admin', 'admin', 'operator'], write: ['super_admin', 'admin'], update: ['super_admin', 'admin'], delete: [], validate: [], export: ['super_admin', 'admin'] },
  { module: 'Utilisateurs', read: ['super_admin', 'admin'], write: ['super_admin'], update: ['super_admin', 'admin'], delete: ['super_admin'], validate: ['super_admin'], export: ['super_admin'] },
  { module: 'Transactions', read: ['super_admin', 'admin', 'operator'], write: ['super_admin', 'admin', 'operator'], update: ['super_admin', 'admin'], delete: ['super_admin'], validate: ['super_admin', 'admin'], export: ['super_admin', 'admin'] },
  { module: 'Commerciaux', read: ['super_admin', 'admin', 'operator'], write: ['super_admin', 'admin', 'operator'], update: ['super_admin', 'admin', 'operator'], delete: ['super_admin', 'admin'], validate: ['super_admin', 'admin'], export: ['super_admin', 'admin'] },
  { module: 'Logs & Audit', read: ['super_admin', 'admin'], write: [], update: [], delete: ['super_admin'], validate: [], export: ['super_admin'] },
  { module: 'Paramètres', read: ['super_admin'], write: ['super_admin'], update: ['super_admin'], delete: ['super_admin'], validate: ['super_admin'], export: ['super_admin'] },
];

export default function BackofficeUsers() {
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('users');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (!['super_admin', 'admin'].includes(u?.backoffice_role || u?.role)) {
        toast.error('Accès refusé');
      }
    });
  }, []);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['bo-users-list'],
    queryFn: () => base44.entities.User.list('-created_date', 100)
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }) => base44.entities.User.update(userId, { backoffice_role: role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bo-users-list'] });
      toast.success('Rôle mis à jour');
    }
  });

  const filteredUsers = users.filter(u => {
    const matchSearch = !search || u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || (u.backoffice_role || u.role) === roleFilter;
    return matchSearch && matchRole;
  });

  const exportCSV = () => {
    const csv = [
      ['Nom', 'Email', 'Rôle', 'Inscrit le'].join(','),
      ...filteredUsers.map(u => [u.full_name, u.email, u.backoffice_role || u.role, u.created_date?.split('T')[0]].join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    toast.success('Export CSV téléchargé');
  };

  return (
    <BackofficeLayout currentPage="Utilisateurs & RBAC">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Gestion des utilisateurs</h1>
            <p className="text-sm text-gray-500">{users.length} utilisateurs enregistrés</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {['users', 'rbac'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'users' ? 'Utilisateurs' : 'Permissions RBAC'}
            </button>
          ))}
        </div>

        {activeTab === 'users' && (
          <>
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Rechercher un utilisateur..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les rôles</SelectItem>
                  {Object.entries(ROLES).map(([key, r]) => (
                    <SelectItem key={key} value={key}>{r.icon} {r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Summary badges */}
            <div className="flex flex-wrap gap-2">
              {Object.entries(ROLES).map(([key, r]) => {
                const count = users.filter(u => (u.backoffice_role || u.role) === key).length;
                return (
                  <div key={key} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${r.color}`}>
                    <span>{r.icon}</span>
                    <span>{r.label}</span>
                    <span className="font-bold">{count}</span>
                  </div>
                );
              })}
            </div>

            {/* Users Table */}
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left px-4 py-3 text-gray-500 font-medium">Utilisateur</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-medium">Email</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-medium">Rôle backoffice</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-medium">Inscrit le</th>
                      <th className="text-right px-4 py-3 text-gray-500 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      [...Array(5)].map((_, i) => (
                        <tr key={i} className="border-b">
                          <td colSpan={5} className="px-4 py-3">
                            <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                          </td>
                        </tr>
                      ))
                    ) : filteredUsers.map((u) => {
                      const role = u.backoffice_role || u.role || 'user';
                      const roleInfo = ROLES[role] || ROLES.user;
                      return (
                        <tr key={u.id} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {u.full_name?.charAt(0) || '?'}
                              </div>
                              <span className="font-medium text-gray-900">{u.full_name || '—'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-500">{u.email}</td>
                          <td className="px-4 py-3">
                            <Select
                              value={role}
                              onValueChange={(newRole) => updateRoleMutation.mutate({ userId: u.id, role: newRole })}
                            >
                              <SelectTrigger className={`w-36 h-7 text-xs border ${roleInfo.color}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(ROLES).map(([key, r]) => (
                                  <SelectItem key={key} value={key} className="text-xs">
                                    {r.icon} {r.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-4 py-3 text-gray-500">
                            {u.created_date ? format(new Date(u.created_date), 'dd MMM yyyy', { locale: fr }) : '—'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => { setSelectedUser(u); setShowUserDialog(true); }}
                              className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}

        {activeTab === 'rbac' && (
          <Card className="overflow-x-auto">
            <div className="p-4 border-b">
              <h3 className="font-semibold">Matrice des permissions par rôle</h3>
              <p className="text-sm text-gray-500 mt-1">Vue d'ensemble des droits par module</p>
            </div>
            <table className="w-full text-xs md:text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Module</th>
                  {['read', 'write', 'update', 'delete', 'validate', 'export'].map(perm => (
                    <th key={perm} className="px-3 py-3 font-medium text-gray-700 text-center capitalize">{perm}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSIONS_MATRIX.map((row, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{row.module}</td>
                    {['read', 'write', 'update', 'delete', 'validate', 'export'].map(perm => (
                      <td key={perm} className="px-3 py-3">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {row[perm]?.map(role => {
                            const ri = ROLES[role];
                            return (
                              <span key={role} className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${ri?.color}`}>
                                {ri?.icon}
                              </span>
                            );
                          })}
                          {!row[perm]?.length && <span className="text-gray-300">—</span>}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-4 border-t bg-gray-50 flex flex-wrap gap-3">
              {Object.entries(ROLES).map(([key, r]) => (
                <div key={key} className={`flex items-center gap-1.5 px-2 py-1 rounded border text-xs ${r.color}`}>
                  <span>{r.icon}</span>
                  <span>{r.label}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* User Detail Dialog */}
        <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Détails utilisateur</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                    {selectedUser.full_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="font-bold text-lg">{selectedUser.full_name}</p>
                    <p className="text-gray-500 text-sm">{selectedUser.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Rôle backoffice</p>
                    <p className="font-semibold">{ROLES[selectedUser.backoffice_role || selectedUser.role]?.label || 'Utilisateur'}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Inscrit le</p>
                    <p className="font-semibold">
                      {selectedUser.created_date ? format(new Date(selectedUser.created_date), 'dd/MM/yyyy') : '—'}
                    </p>
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