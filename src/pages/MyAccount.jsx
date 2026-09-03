import React, { useState, useEffect } from 'react';
import { api } from '@/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ShoppingBag, MapPin, Heart, Bell, Edit2, Plus,
  Trash2, Package, Clock, CheckCircle, X, Home, Briefcase
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from 'sonner';
import SavingsDashboard from '@/components/account/SavingsDashboard';
import { BarChart2 } from 'lucide-react';
import { goToLogin } from '@/lib/navigation';

export default function MyAccount() {
  const [user, setUser] = useState(null);
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    label: 'Maison',
    full_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    postal_code: '',
    is_default: false,
    is_billing: false
  });
  const queryClient = useQueryClient();

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

  const { data: orders = [] } = useQuery({
    queryKey: ['my-orders', user?.email],
    queryFn: () => api.entities.Order.filter({ customer_email: user.email }, '-created_date'),
    enabled: !!user
  });

  const { data: addresses = [] } = useQuery({
    queryKey: ['my-addresses', user?.email],
    queryFn: () => api.entities.DeliveryAddress.filter({ user_email: user.email }),
    enabled: !!user
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ['my-favorites', user?.email],
    queryFn: () => api.entities.Favorite.filter({ user_email: user.email }),
    enabled: !!user
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products-for-favorites'],
    queryFn: () => api.entities.Product.list(),
    enabled: favorites.length > 0
  });

  const favoriteProducts = products.filter(p => 
    favorites.some(f => f.product_id === p.id)
  );

  const createAddressMutation = useMutation({
    mutationFn: (data) => api.entities.DeliveryAddress.create({ ...data, user_email: user.email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-addresses'] });
      toast.success('Adresse ajoutée');
      closeAddressDialog();
    }
  });

  const updateAddressMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.DeliveryAddress.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-addresses'] });
      toast.success('Adresse mise à jour');
      closeAddressDialog();
    }
  });

  const deleteAddressMutation = useMutation({
    mutationFn: (id) => api.entities.DeliveryAddress.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-addresses'] });
      toast.success('Adresse supprimée');
    }
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: (favoriteId) => api.entities.Favorite.delete(favoriteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-favorites'] });
      toast.success('Retiré des favoris');
    }
  });

  const updateNotificationMutation = useMutation({
    mutationFn: (settings) => api.auth.updateMe({ notification_settings: settings }),
    onSuccess: () => {
      toast.success('Préférences mises à jour');
    }
  });

  const openAddressDialog = (address = null) => {
    if (address) {
      setEditingAddress(address);
      setAddressForm({
        label: address.label || 'Maison',
        full_name: address.full_name || '',
        phone: address.phone || '',
        address_line1: address.address_line1 || '',
        address_line2: address.address_line2 || '',
        city: address.city || '',
        postal_code: address.postal_code || '',
        is_default: address.is_default || false,
        is_billing: address.is_billing || false
      });
    } else {
      setEditingAddress(null);
      setAddressForm({
        label: 'Maison',
        full_name: user?.full_name || '',
        phone: '',
        address_line1: '',
        address_line2: '',
        city: '',
        postal_code: '',
        is_default: addresses.length === 0,
        is_billing: false
      });
    }
    setShowAddressDialog(true);
  };

  const closeAddressDialog = () => {
    setShowAddressDialog(false);
    setEditingAddress(null);
  };

  const handleAddressSubmit = () => {
    if (editingAddress) {
      updateAddressMutation.mutate({ id: editingAddress.id, data: addressForm });
    } else {
      createAddressMutation.mutate(addressForm);
    }
  };

  const statusConfig = {
    pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    confirmed: { label: 'Confirmé', color: 'bg-blue-100 text-blue-700', icon: Package },
    ready: { label: 'Prêt', color: 'bg-purple-100 text-purple-700', icon: CheckCircle },
    delivered: { label: 'Livré', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    cancelled: { label: 'Annulé', color: 'bg-red-100 text-red-700', icon: X }
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
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {user.full_name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{user.full_name}</h1>
            <p className="text-gray-500">{user.email}</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full max-w-3xl">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4" />
              Impact
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              Commandes
            </TabsTrigger>
            <TabsTrigger value="addresses" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Adresses
            </TabsTrigger>
            <TabsTrigger value="favorites" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Favoris
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            <SavingsDashboard orders={orders} user={user} />
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Mes commandes</h2>
              <p className="text-gray-500">{orders.length} commande(s)</p>
            </div>

            {orders.length === 0 ? (
              <Card className="p-12 text-center">
                <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Aucune commande</h3>
                <p className="text-gray-500">Vous n'avez pas encore passé de commande</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const status = statusConfig[order.status] || statusConfig.pending;
                  const StatusIcon = status.icon;
                  
                  return (
                    <Card key={order.id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold">Commande #{order.id.slice(0, 8)}</p>
                          <p className="text-sm text-gray-500">
                            {format(new Date(order.created_date), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                          </p>
                        </div>
                        <Badge className={status.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status.label}
                        </Badge>
                      </div>

                      <div className="space-y-2 mb-3">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span>{item.product_name} x{item.quantity}</span>
                            <span className="font-medium">{item.unit_price?.toLocaleString()} FCFA</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t">
                        <span className="font-semibold">Total</span>
                        <span className="text-lg font-bold text-emerald-600">
                          {order.total_amount?.toLocaleString()} FCFA
                        </span>
                      </div>

                      {order.delivery_address && (
                        <div className="mt-3 pt-3 border-t text-sm text-gray-600 flex items-start gap-2">
                          <MapPin className="w-4 h-4 mt-0.5" />
                          <span>{order.delivery_address}</span>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Addresses Tab */}
          <TabsContent value="addresses" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Mes adresses</h2>
              <Button onClick={() => openAddressDialog()} className="bg-emerald-500 hover:bg-emerald-600">
                <Plus className="w-4 h-4 mr-1" />
                Ajouter une adresse
              </Button>
            </div>

            {addresses.length === 0 ? (
              <Card className="p-12 text-center">
                <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Aucune adresse</h3>
                <p className="text-gray-500 mb-4">Ajoutez une adresse de livraison</p>
                <Button onClick={() => openAddressDialog()} className="bg-emerald-500 hover:bg-emerald-600">
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter maintenant
                </Button>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {addresses.map((address) => (
                  <Card key={address.id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {address.label === 'Maison' ? (
                          <Home className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Briefcase className="w-5 h-5 text-blue-600" />
                        )}
                        <span className="font-semibold">{address.label}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openAddressDialog(address)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => deleteAddressMutation.mutate(address.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                      <p className="font-medium text-gray-900">{address.full_name}</p>
                      <p>{address.address_line1}</p>
                      {address.address_line2 && <p>{address.address_line2}</p>}
                      <p>{address.city} {address.postal_code}</p>
                      <p>{address.phone}</p>
                    </div>

                    <div className="flex gap-2 mt-3">
                      {address.is_default && (
                        <Badge className="bg-emerald-100 text-emerald-700">Par défaut</Badge>
                      )}
                      {address.is_billing && (
                        <Badge className="bg-blue-100 text-blue-700">Facturation</Badge>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Favorites Tab */}
          <TabsContent value="favorites" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Mes produits favoris</h2>
              <p className="text-gray-500">{favoriteProducts.length} produit(s)</p>
            </div>

            {favoriteProducts.length === 0 ? (
              <Card className="p-12 text-center">
                <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Aucun favori</h3>
                <p className="text-gray-500">Ajoutez des produits à vos favoris</p>
              </Card>
            ) : (
              <div className="grid md:grid-cols-3 gap-4">
                {favoriteProducts.map((product) => {
                  const favorite = favorites.find(f => f.product_id === product.id);
                  
                  return (
                    <Card key={product.id} className="overflow-hidden group">
                      <div className="relative aspect-square bg-gray-100">
                        {product.image_url ? (
                          <img 
                            src={product.image_url} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl">
                            🛒
                          </div>
                        )}
                        <button
                          onClick={() => removeFavoriteMutation.mutate(favorite.id)}
                          className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Heart className="w-5 h-5 text-red-500 fill-current" />
                        </button>
                      </div>
                      <div className="p-4">
                        <p className="font-semibold mb-1">{product.name}</p>
                        <p className="text-sm text-gray-500 mb-2">{product.store_name}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-emerald-600">
                            {product.discounted_price?.toLocaleString()} FCFA
                          </span>
                          <Badge variant="outline">
                            -{Math.round((1 - product.discounted_price / product.original_price) * 100)}%
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <h2 className="text-xl font-semibold">Préférences de notification</h2>

            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Promotions et offres</p>
                  <p className="text-sm text-gray-500">Recevez des alertes sur les nouveaux produits et promotions</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Statut des commandes</p>
                  <p className="text-sm text-gray-500">Notifications sur l'état de vos commandes</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Produits favoris en promo</p>
                  <p className="text-sm text-gray-500">Alerte quand vos produits favoris sont en promotion</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Nouveaux produits près de chez vous</p>
                  <p className="text-sm text-gray-500">Découvrez les nouveautés des magasins à proximité</p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Newsletter hebdomadaire</p>
                  <p className="text-sm text-gray-500">Résumé des meilleures offres de la semaine</p>
                </div>
                <Switch />
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Address Dialog */}
        <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingAddress ? 'Modifier' : 'Ajouter'} une adresse</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Type d'adresse</Label>
                <div className="flex gap-2 mt-1">
                  <Button
                    variant={addressForm.label === 'Maison' ? 'default' : 'outline'}
                    onClick={() => setAddressForm({ ...addressForm, label: 'Maison' })}
                    className="flex-1"
                  >
                    <Home className="w-4 h-4 mr-1" />
                    Maison
                  </Button>
                  <Button
                    variant={addressForm.label === 'Bureau' ? 'default' : 'outline'}
                    onClick={() => setAddressForm({ ...addressForm, label: 'Bureau' })}
                    className="flex-1"
                  >
                    <Briefcase className="w-4 h-4 mr-1" />
                    Bureau
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nom complet</Label>
                  <Input
                    value={addressForm.full_name}
                    onChange={(e) => setAddressForm({ ...addressForm, full_name: e.target.value })}
                    placeholder="Votre nom"
                  />
                </div>
                <div>
                  <Label>Téléphone</Label>
                  <Input
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    placeholder="6XX XX XX XX"
                  />
                </div>
              </div>

              <div>
                <Label>Adresse ligne 1</Label>
                <Input
                  value={addressForm.address_line1}
                  onChange={(e) => setAddressForm({ ...addressForm, address_line1: e.target.value })}
                  placeholder="Rue, numéro..."
                />
              </div>

              <div>
                <Label>Adresse ligne 2 (optionnel)</Label>
                <Input
                  value={addressForm.address_line2}
                  onChange={(e) => setAddressForm({ ...addressForm, address_line2: e.target.value })}
                  placeholder="Appartement, étage..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Ville</Label>
                  <Input
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    placeholder="Douala"
                  />
                </div>
                <div>
                  <Label>Code postal (optionnel)</Label>
                  <Input
                    value={addressForm.postal_code}
                    onChange={(e) => setAddressForm({ ...addressForm, postal_code: e.target.value })}
                    placeholder="12345"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={addressForm.is_default}
                    onCheckedChange={(checked) => setAddressForm({ ...addressForm, is_default: checked })}
                  />
                  <Label>Définir comme adresse par défaut</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={addressForm.is_billing}
                    onCheckedChange={(checked) => setAddressForm({ ...addressForm, is_billing: checked })}
                  />
                  <Label>Utiliser aussi pour la facturation</Label>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={closeAddressDialog} className="flex-1">
                  Annuler
                </Button>
                <Button 
                  onClick={handleAddressSubmit}
                  disabled={!addressForm.full_name || !addressForm.phone || !addressForm.address_line1 || !addressForm.city}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                >
                  {editingAddress ? 'Mettre à jour' : 'Ajouter'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}