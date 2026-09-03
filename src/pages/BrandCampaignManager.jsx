import React, { useState, useEffect } from 'react';
import { api } from '@/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Plus, Edit2, Eye, DollarSign, TrendingUp, Users } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { goToLogin } from '@/lib/navigation';

const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981'];

export default function BrandCampaignManager() {
  const [user, setUser] = useState(null);
  const [brand, setBrand] = useState(null);
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [campaignForm, setCampaignForm] = useState({
    campaign_name: '',
    campaign_type: 'product_sponsorship',
    budget: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    ad_creative: {
      title: '',
      description: '',
      image_url: '',
      cta_text: 'Découvrir',
      cta_url: ''
    }
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await api.auth.me();
        setUser(userData);
        const brands = await api.entities.BrandPartnership.filter({ contact_email: userData.email });
        setBrand(brands[0]);
      } catch (e) {
        goToLogin();
      }
    };
    loadUser();
  }, []);

  const { data: campaigns = [] } = useQuery({
    queryKey: ['brand-campaigns', brand?.id],
    queryFn: () => api.entities.SponsoredCampaign.filter({ brand_id: brand.id }, '-created_date'),
    enabled: !!brand
  });

  const { data: commissions = [] } = useQuery({
    queryKey: ['brand-commissions', brand?.id],
    queryFn: () => api.entities.CommissionTransaction.filter({ brand_id: brand.id }, '-created_date'),
    enabled: !!brand
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products-for-sponsorship'],
    queryFn: () => api.entities.Product.filter({ status: 'active' })
  });

  const createCampaignMutation = useMutation({
    mutationFn: (data) => api.entities.SponsoredCampaign.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-campaigns'] });
      toast.success('Campagne créée');
      setShowCampaignDialog(false);
      resetForm();
    }
  });

  const updateCampaignMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.SponsoredCampaign.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-campaigns'] });
      toast.success('Campagne mise à jour');
      setShowCampaignDialog(false);
      resetForm();
    }
  });

  const resetForm = () => {
    setCampaignForm({
      campaign_name: '',
      campaign_type: 'product_sponsorship',
      budget: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      ad_creative: {
        title: '',
        description: '',
        image_url: '',
        cta_text: 'Découvrir',
        cta_url: ''
      }
    });
    setEditingCampaign(null);
  };

  const handleSubmit = () => {
    const data = {
      ...campaignForm,
      brand_id: brand.id,
      brand_name: brand.brand_name,
      budget: parseFloat(campaignForm.budget),
      status: 'draft'
    };

    if (editingCampaign) {
      updateCampaignMutation.mutate({ id: editingCampaign.id, data });
    } else {
      createCampaignMutation.mutate(data);
    }
  };

  // Calculate stats
  const totalSpent = campaigns.reduce((sum, c) => sum + (c.spent || 0), 0);
  const totalRevenue = campaigns.reduce((sum, c) => sum + (c.revenue_generated || 0), 0);
  const totalImpressions = campaigns.reduce((sum, c) => sum + (c.impressions || 0), 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + (c.conversions || 0), 0);
  const avgROI = campaigns.length > 0 ? campaigns.reduce((sum, c) => sum + (c.roi || 0), 0) / campaigns.length : 0;

  const pendingCommissions = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.commission_amount, 0);
  const paidCommissions = commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.commission_amount, 0);

  // Chart data
  const campaignPerformance = campaigns.map(c => ({
    name: c.campaign_name,
    impressions: c.impressions || 0,
    clicks: c.clicks || 0,
    conversions: c.conversions || 0
  }));

  const commissionData = [
    { name: 'Payées', value: paidCommissions },
    { name: 'En attente', value: pendingCommissions }
  ];

  if (!brand) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <Sparkles className="w-12 h-12 text-purple-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Partenariat Marque</h2>
          <p className="text-gray-500 mb-4">Vous n'avez pas encore de partenariat actif</p>
          <Button className="bg-purple-500">Devenir partenaire</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {brand.brand_logo_url ? (
              <img src={brand.brand_logo_url} alt={brand.brand_name} className="w-12 h-12 rounded-lg" />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white text-xl font-bold">
                {brand.brand_name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{brand.brand_name}</h1>
              <p className="text-gray-500">Gestion des campagnes sponsorisées</p>
            </div>
          </div>
          <Button onClick={() => setShowCampaignDialog(true)} className="bg-purple-500">
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle campagne
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid md:grid-cols-5 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Budget dépensé</p>
                <p className="text-lg font-bold">{(totalSpent / 1000).toFixed(0)}k F</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Revenus générés</p>
                <p className="text-lg font-bold">{(totalRevenue / 1000).toFixed(0)}k F</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Eye className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Impressions</p>
                <p className="text-lg font-bold">{totalImpressions.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Conversions</p>
                <p className="text-lg font-bold">{totalConversions}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-100 rounded-lg">
                <Sparkles className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">ROI moyen</p>
                <p className="text-lg font-bold">{avgROI.toFixed(1)}%</p>
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="campaigns" className="space-y-6">
          <TabsList>
            <TabsTrigger value="campaigns">Campagnes</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="commissions">Commissions</TabsTrigger>
          </TabsList>

          {/* Campaigns */}
          <TabsContent value="campaigns" className="space-y-4">
            {campaigns.length === 0 ? (
              <Card className="p-12 text-center">
                <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Aucune campagne</h3>
                <p className="text-gray-500 mb-4">Créez votre première campagne sponsorisée</p>
                <Button onClick={() => setShowCampaignDialog(true)} className="bg-purple-500">
                  Créer une campagne
                </Button>
              </Card>
            ) : (
              campaigns.map((campaign) => (
                <Card key={campaign.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg">{campaign.campaign_name}</h3>
                        <Badge className={
                          campaign.status === 'active' ? 'bg-green-500' :
                          campaign.status === 'paused' ? 'bg-orange-500' :
                          'bg-gray-500'
                        }>
                          {campaign.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        {campaign.start_date} - {campaign.end_date}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => {
                      setEditingCampaign(campaign);
                      setCampaignForm(campaign);
                      setShowCampaignDialog(true);
                    }}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">{campaign.impressions || 0}</p>
                      <p className="text-xs text-gray-600">Impressions</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{campaign.clicks || 0}</p>
                      <p className="text-xs text-gray-600">Clics</p>
                    </div>
                    <div className="text-center p-3 bg-emerald-50 rounded-lg">
                      <p className="text-2xl font-bold text-emerald-600">{campaign.conversions || 0}</p>
                      <p className="text-xs text-gray-600">Conversions</p>
                    </div>
                    <div className="text-center p-3 bg-pink-50 rounded-lg">
                      <p className="text-2xl font-bold text-pink-600">{campaign.roi?.toFixed(1)}%</p>
                      <p className="text-xs text-gray-600">ROI</p>
                    </div>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Budget: {campaign.budget?.toLocaleString()} F</span>
                    <span className="text-gray-500">Dépensé: {campaign.spent?.toLocaleString()} F</span>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="font-bold mb-4">Performance des campagnes</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={campaignPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="impressions" fill="#8b5cf6" name="Impressions" />
                    <Bar dataKey="clicks" fill="#3b82f6" name="Clics" />
                    <Bar dataKey="conversions" fill="#10b981" name="Conversions" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold mb-4">Répartition des commissions</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={commissionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${(entry.value / 1000).toFixed(0)}k F`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {commissionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </TabsContent>

          {/* Commissions */}
          <TabsContent value="commissions" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <Card className="p-6">
                <h4 className="font-semibold mb-2">Commissions en attente</h4>
                <p className="text-3xl font-bold text-orange-600">{pendingCommissions.toLocaleString()} F</p>
              </Card>
              <Card className="p-6">
                <h4 className="font-semibold mb-2">Commissions payées</h4>
                <p className="text-3xl font-bold text-green-600">{paidCommissions.toLocaleString()} F</p>
              </Card>
            </div>

            <Card className="p-6">
              <h3 className="font-bold mb-4">Historique des commissions</h3>
              <div className="space-y-2">
                {commissions.slice(0, 10).map((commission) => (
                  <div key={commission.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{commission.product_name}</p>
                      <p className="text-sm text-gray-500">
                        Vente: {commission.sale_amount.toLocaleString()} F • 
                        Taux: {commission.commission_rate}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">
                        {commission.commission_amount.toLocaleString()} F
                      </p>
                      <Badge className={
                        commission.status === 'paid' ? 'bg-green-500' :
                        commission.status === 'approved' ? 'bg-blue-500' :
                        'bg-orange-500'
                      }>
                        {commission.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Campaign Dialog */}
        <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCampaign ? 'Modifier la campagne' : 'Nouvelle campagne sponsorisée'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div>
                <Label>Nom de la campagne</Label>
                <Input
                  value={campaignForm.campaign_name}
                  onChange={(e) => setCampaignForm({ ...campaignForm, campaign_name: e.target.value })}
                  placeholder="Ex: Promo Été 2026"
                />
              </div>

              <div>
                <Label>Type de campagne</Label>
                <Select
                  value={campaignForm.campaign_type}
                  onValueChange={(value) => setCampaignForm({ ...campaignForm, campaign_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="product_sponsorship">Sponsoring produit</SelectItem>
                    <SelectItem value="category_sponsorship">Sponsoring catégorie</SelectItem>
                    <SelectItem value="banner_ad">Bannière publicitaire</SelectItem>
                    <SelectItem value="promoted_post">Post sponsorisé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date de début</Label>
                  <Input
                    type="date"
                    value={campaignForm.start_date}
                    onChange={(e) => setCampaignForm({ ...campaignForm, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Date de fin</Label>
                  <Input
                    type="date"
                    value={campaignForm.end_date}
                    onChange={(e) => setCampaignForm({ ...campaignForm, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Budget (FCFA)</Label>
                <Input
                  type="number"
                  value={campaignForm.budget}
                  onChange={(e) => setCampaignForm({ ...campaignForm, budget: e.target.value })}
                  placeholder="100000"
                />
              </div>

              <div>
                <Label>Titre de l'annonce</Label>
                <Input
                  value={campaignForm.ad_creative?.title}
                  onChange={(e) => setCampaignForm({
                    ...campaignForm,
                    ad_creative: { ...campaignForm.ad_creative, title: e.target.value }
                  })}
                  placeholder="Titre accrocheur"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={campaignForm.ad_creative?.description}
                  onChange={(e) => setCampaignForm({
                    ...campaignForm,
                    ad_creative: { ...campaignForm.ad_creative, description: e.target.value }
                  })}
                  placeholder="Décrivez votre offre..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowCampaignDialog(false)} className="flex-1">
                  Annuler
                </Button>
                <Button onClick={handleSubmit} className="flex-1 bg-purple-500">
                  {editingCampaign ? 'Mettre à jour' : 'Créer'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}