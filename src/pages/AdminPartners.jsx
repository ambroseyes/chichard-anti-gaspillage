import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import StatusHistoryModal from '@/components/admin/StatusHistoryModal';
import BulkActionsBar from '@/components/admin/BulkActionsBar';
import {
  Store, Plus, Search, Edit2, Trash2, Check, X, Clock,
  MapPin, Phone, Mail, Shield, Users, Package, TrendingUp,
  Eye, MoreVertical, CheckCircle, AlertCircle, History, BarChart3
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';

const emptyStore = {
  name: '',
  address: '',
  city: '',
  phone: '',
  email: '',
  logo_url: '',
  is_partner: true,
  status: 'pending',
  opening_hours: '',
  description: ''
};

export default function AdminPartners() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDialog, setShowDialog] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [formData, setFormData] = useState(emptyStore);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyStore, setHistoryStore] = useState(null);
  const [selectedStores, setSelectedStores] = useState([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {
        base44.auth.redirectToLogin();
      }
    };
    loadUser();
  }, []);

  const { data: stores = [], isLoading } = useQuery({
    queryKey: ['admin-stores'],
    queryFn: () => base44.entities.Store.list('-created_date'),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['all-products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Store.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stores'] });
      toast.success('Partenaire ajouté');
      closeDialog();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Store.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stores'] });
      toast.success('Partenaire mis à jour');
      closeDialog();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Store.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stores'] });
      toast.success('Partenaire supprimé');
    }
  });

  const openCreateDialog = () => {
    setEditingStore(null);
    setFormData(emptyStore);
    setShowDialog(true);
  };

  const openEditDialog = (store) => {
    setEditingStore(store);
    setFormData({
      name: store.name || '',
      address: store.address || '',
      city: store.city || '',
      phone: store.phone || '',
      email: store.email || '',
      logo_url: store.logo_url || '',
      is_partner: store.is_partner ?? true,
      status: store.status || 'pending',
      opening_hours: store.opening_hours || '',
      description: store.description || ''
    });
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setEditingStore(null);
    setFormData(emptyStore);
  };

  const handleSubmit = () => {
    if (editingStore) {
      updateMutation.mutate({ id: editingStore.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const updateStatus = async (store, newStatus, notes = '') => {
    // Record status change in history
    await base44.entities.PartnerStatusHistory.create({
      store_id: store.id,
      store_name: store.name,
      previous_status: store.status,
      new_status: newStatus,
      changed_by: user.email,
      changed_by_name: user.full_name,
      notes: notes
    });

    updateMutation.mutate({ 
      id: store.id, 
      data: { ...store, status: newStatus }
    });

    // Notify partner owner about status change
    if (store.owner_email) {
      const statusMessages = {
        verified: 'Félicitations! Votre boutique a été vérifiée et approuvée.',
        rejected: 'Votre demande de partenariat a été rejetée. Contactez-nous pour plus d\'informations.',
        suspended: 'Votre compte partenaire a été suspendu. Veuillez nous contacter.'
      };

      if (statusMessages[newStatus]) {
        base44.entities.Notification.create({
          user_email: store.owner_email,
          title: `Statut de votre boutique: ${statusConfig[newStatus]?.label}`,
          message: statusMessages[newStatus],
          type: 'system',
          data: { store_id: store.id, new_status: newStatus }
        });
      }
    }
  };

  const handleBulkAction = async (actionType, notes) => {
    if (actionType === 'delete') {
      for (const storeId of selectedStores) {
        await base44.entities.Store.delete(storeId);
      }
      toast.success(`${selectedStores.length} partenaire(s) supprimé(s)`);
    } else {
      for (const storeId of selectedStores) {
        const store = stores.find(s => s.id === storeId);
        if (store) {
          await updateStatus(store, actionType, notes);
        }
      }
      toast.success(`${selectedStores.length} partenaire(s) mis à jour`);
    }
    setSelectedStores([]);
    queryClient.invalidateQueries({ queryKey: ['admin-stores'] });
  };

  const toggleStoreSelection = (storeId) => {
    setSelectedStores(prev => 
      prev.includes(storeId) ? prev.filter(id => id !== storeId) : [...prev, storeId]
    );
  };

  const getStoreStats = (storeId) => {
    const storeProducts = products.filter(p => p.store_id === storeId);
    return {
      products: storeProducts.length,
      sold: storeProducts.reduce((sum, p) => sum + (p.quantity_sold || 0), 0),
      saved: storeProducts.reduce((sum, p) => sum + (p.quantity_available || 0), 0)
    };
  };

  const filteredStores = stores.filter(store => {
    const matchSearch = !searchQuery || 
      store.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.address?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || store.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusConfig = {
    verified: { label: 'Vérifié', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
    pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    rejected: { label: 'Rejeté', color: 'bg-red-100 text-red-700', icon: AlertCircle },
    suspended: { label: 'Suspendu', color: 'bg-orange-100 text-orange-700', icon: AlertCircle },
  };

  // Subscription to new partner registrations (for admins)
  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    const unsubscribe = base44.entities.Store.subscribe((event) => {
      if (event.type === 'create' && event.data.status === 'pending') {
        // Create notification for admin
        base44.entities.Notification.create({
          user_email: user.email,
          title: 'Nouveau partenaire en attente',
          message: `${event.data.name} a demandé à rejoindre CHICHARD`,
          type: 'system',
          action_url: '/AdminPartners',
          data: { store_id: event.id }
        });
        
        toast.success('Nouveau partenaire en attente de validation');
        queryClient.invalidateQueries({ queryKey: ['admin-stores'] });
      }
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Partenaires</h1>
            <p className="text-gray-500">{stores.length} partenaires enregistrés</p>
          </div>
          <div className="flex gap-2">
            <Link to={createPageUrl('PartnerAnalytics')}>
              <Button variant="outline">
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytiques
              </Button>
            </Link>
            <Button onClick={openCreateDialog} className="bg-emerald-500 hover:bg-emerald-600">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un partenaire
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stores.filter(s => s.status === 'verified').length}</p>
                <p className="text-xs text-gray-500">Vérifiés</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stores.filter(s => s.status === 'pending').length}</p>
                <p className="text-xs text-gray-500">En attente</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{products.length}</p>
                <p className="text-xs text-gray-500">Produits total</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{products.reduce((sum, p) => sum + (p.quantity_sold || 0), 0)}</p>
                <p className="text-xs text-gray-500">Ventes totales</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Rechercher par nom, ville, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="verified">✅ Vérifiés</SelectItem>
                  <SelectItem value="pending">⏳ En attente</SelectItem>
                  <SelectItem value="rejected">❌ Rejetés</SelectItem>
                  <SelectItem value="suspended">⚠️ Suspendus</SelectItem>
                </SelectContent>
              </Select>
              {(searchQuery || statusFilter !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                  }}
                >
                  <X className="w-4 h-4 mr-1" />
                  Réinitialiser
                </Button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
            <span>{filteredStores.length} résultat(s)</span>
            {searchQuery && <span>• Recherche: "{searchQuery}"</span>}
            {statusFilter !== 'all' && <span>• Statut: {statusConfig[statusFilter]?.label}</span>}
          </div>
        </Card>

        {/* Partners List */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStores.map((store) => {
            const stats = getStoreStats(store.id);
            const status = statusConfig[store.status] || statusConfig.pending;
            const StatusIcon = status.icon;

            return (
              <motion.div
                key={store.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Card className="overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedStores.includes(store.id)}
                          onCheckedChange={() => toggleStoreSelection(store.id)}
                        />
                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                          {store.logo_url ? (
                            <img src={store.logo_url} alt="" className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            <Store className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{store.name}</h3>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {store.city}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(store)}>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setHistoryStore(store);
                            setShowHistoryModal(true);
                          }}>
                            <History className="w-4 h-4 mr-2" />
                            Historique
                          </DropdownMenuItem>
                          {store.status === 'pending' && (
                            <>
                              <DropdownMenuItem onClick={() => updateStatus(store, 'verified')}>
                                <CheckCircle className="w-4 h-4 mr-2 text-emerald-500" />
                                Approuver
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateStatus(store, 'rejected')}>
                                <X className="w-4 h-4 mr-2 text-red-500" />
                                Rejeter
                              </DropdownMenuItem>
                            </>
                          )}
                          {store.status === 'verified' && (
                            <DropdownMenuItem onClick={() => updateStatus(store, 'suspended')}>
                              <Shield className="w-4 h-4 mr-2 text-orange-500" />
                              Suspendre
                            </DropdownMenuItem>
                          )}
                          {store.status === 'suspended' && (
                            <DropdownMenuItem onClick={() => updateStatus(store, 'verified')}>
                              <CheckCircle className="w-4 h-4 mr-2 text-emerald-500" />
                              Réactiver
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => deleteMutation.mutate(store.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <Badge className={`${status.color} mb-3`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {status.label}
                    </Badge>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="font-bold text-gray-900">{stats.products}</p>
                        <p className="text-xs text-gray-500">Produits</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="font-bold text-gray-900">{stats.sold}</p>
                        <p className="text-xs text-gray-500">Vendus</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="font-bold text-emerald-600">{stats.saved}</p>
                        <p className="text-xs text-gray-500">Sauvés</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingStore ? 'Modifier le partenaire' : 'Nouveau partenaire'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label>Nom du magasin</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Carrefour Akwa"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ville</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Douala"
                />
              </div>
              <div>
                <Label>Statut</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="verified">Vérifié</SelectItem>
                    <SelectItem value="rejected">Rejeté</SelectItem>
                    <SelectItem value="suspended">Suspendu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Adresse complète</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Rue, quartier..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Téléphone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="6XX XX XX XX"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@magasin.com"
                />
              </div>
            </div>

            <div>
              <Label>Horaires d'ouverture</Label>
              <Input
                value={formData.opening_hours}
                onChange={(e) => setFormData({ ...formData, opening_hours: e.target.value })}
                placeholder="Lun-Sam: 8h-20h"
              />
            </div>

            <div>
              <Label>URL du logo</Label>
              <Input
                value={formData.logo_url}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={closeDialog} className="flex-1">
                Annuler
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={!formData.name || !formData.city}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600"
              >
                {editingStore ? 'Mettre à jour' : 'Créer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Status History Modal */}
      <StatusHistoryModal
        store={historyStore}
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
      />

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedStores={selectedStores}
        onBulkAction={handleBulkAction}
        onClear={() => setSelectedStores([])}
      />
    </div>
  );
}