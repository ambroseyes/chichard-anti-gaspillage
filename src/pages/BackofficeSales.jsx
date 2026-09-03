import React, { useState } from 'react';
import { api } from '@/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BackofficeLayout from '@/components/backoffice/BackofficeLayout';
import { Plus, Search, TrendingUp, Users, Target, Mail, CheckCircle, Download } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PIPELINE_STAGES = [
  { key: 'new', label: 'Nouveau', color: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400' },
  { key: 'contacted', label: 'Contacté', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  { key: 'qualified', label: 'Qualifié', color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  { key: 'proposal', label: 'Proposition', color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  { key: 'negotiation', label: 'Négociation', color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  { key: 'won', label: 'Gagné', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  { key: 'lost', label: 'Perdu', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
];

export default function BackofficeSales() {
  const [showLeadDialog, setShowLeadDialog] = useState(false);
  const [showAgentDialog, setShowAgentDialog] = useState(false);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [leadForm, setLeadForm] = useState({
    company_name: '', contact_name: '', email: '', phone: '',
    stage: 'new', value: '', assigned_to: '', notes: ''
  });
  const [agentForm, setAgentForm] = useState({
    full_name: '', email: '', phone: '', target_monthly: '', region: ''
  });
  const queryClient = useQueryClient();

  // Using stores as proxy for leads & agents
  const { data: leads = [] } = useQuery({
    queryKey: ['bo-leads'],
    queryFn: () => api.entities.Store.filter({ is_partner: false }, '-created_date', 100)
      .then(data => data.length > 0 ? data : [
        { id: '1', name: 'SuperMarché Excel', city: 'Douala', status: 'pending', email: 'contact@excel.cm', phone: '+237 699000001', pipeline_stage: 'qualified', expected_value: 150000, owner_email: 'agent1@chichard.cm' },
        { id: '2', name: 'FreshMart Yaoundé', city: 'Yaoundé', status: 'pending', email: 'info@freshmart.cm', phone: '+237 699000002', pipeline_stage: 'proposal', expected_value: 250000, owner_email: 'agent2@chichard.cm' },
        { id: '3', name: 'Bio Shop Douala', city: 'Douala', status: 'pending', email: 'bio@shop.cm', pipeline_stage: 'new', expected_value: 80000 },
      ])
  });

  const { data: stores = [] } = useQuery({
    queryKey: ['bo-stores-sales'],
    queryFn: () => api.entities.Store.filter({ status: 'verified' })
  });

  // Mock agents data derived from stores owners
  const agents = [
    { id: 'a1', name: 'Karine Mballa', email: 'agent1@chichard.cm', region: 'Douala', leads: 12, closed: 4, revenue: 450000, target: 600000 },
    { id: 'a2', name: 'Jean-Paul Nkomo', email: 'agent2@chichard.cm', region: 'Yaoundé', leads: 9, closed: 3, revenue: 320000, target: 500000 },
    { id: 'a3', name: 'Aïcha Bello', email: 'agent3@chichard.cm', region: 'Bafoussam', leads: 7, closed: 2, revenue: 210000, target: 400000 },
  ];

  const filteredLeads = leads.filter(l => {
    const matchSearch = !search || l.name?.toLowerCase().includes(search.toLowerCase()) || l.email?.toLowerCase().includes(search.toLowerCase());
    const matchStage = stageFilter === 'all' || (l.pipeline_stage || 'new') === stageFilter;
    return matchSearch && matchStage;
  });

  // KPIs
  const totalLeads = leads.length;
  const wonLeads = leads.filter(l => l.pipeline_stage === 'won').length;
  const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : 0;
  const totalPipelineValue = leads.reduce((sum, l) => sum + (l.expected_value || 0), 0);

  // Pipeline funnel data
  const pipelineData = PIPELINE_STAGES.map(s => ({
    stage: s.label,
    count: leads.filter(l => (l.pipeline_stage || 'new') === s.key).length
  }));

  // Agent performance data
  const agentPerformance = agents.map(a => ({
    name: a.name.split(' ')[0],
    leads: a.leads,
    closed: a.closed,
    revenue: Math.round(a.revenue / 1000),
    target: Math.round(a.target / 1000)
  }));

  const exportLeadsCSV = () => {
    const csv = [
      ['Entreprise', 'Contact', 'Email', 'Statut pipeline', 'Valeur'].join(','),
      ...filteredLeads.map(l => [l.name, l.owner_email, l.email, l.pipeline_stage || 'new', l.expected_value || 0].join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    toast.success('Leads exportés');
  };

  return (
    <BackofficeLayout currentPage="Commerciaux & Leads">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Gestion Commerciale</h1>
            <p className="text-sm text-gray-500">Pipeline de vente, leads et performance des agents</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportLeadsCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setShowLeadDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau lead
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total leads', value: totalLeads, icon: Users, color: 'bg-indigo-100 text-indigo-600' },
            { label: 'Taux de conversion', value: conversionRate + '%', icon: Target, color: 'bg-emerald-100 text-emerald-600' },
            { label: 'Valeur pipeline', value: (totalPipelineValue / 1000).toFixed(0) + 'k F', icon: TrendingUp, color: 'bg-purple-100 text-purple-600' },
            { label: 'Agents actifs', value: agents.length, icon: CheckCircle, color: 'bg-orange-100 text-orange-600' },
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

        <Tabs defaultValue="pipeline" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="agents">Agents</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Pipeline */}
          <TabsContent value="pipeline" className="space-y-4">
            {/* Kanban-style overview */}
            <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
              {PIPELINE_STAGES.map((stage) => {
                const count = leads.filter(l => (l.pipeline_stage || 'new') === stage.key).length;
                return (
                  <button
                    key={stage.key}
                    onClick={() => setStageFilter(stageFilter === stage.key ? 'all' : stage.key)}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                      stageFilter === stage.key ? 'border-indigo-500 shadow-sm' : 'border-transparent bg-white hover:shadow'
                    } ${stage.color}`}
                  >
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs mt-1">{stage.label}</p>
                  </button>
                );
              })}
            </div>

            {/* Filters */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder="Rechercher un lead..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
              </div>
            </div>

            {/* Leads table */}
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left px-4 py-3 text-gray-500 font-medium">Entreprise</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-medium">Contact</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-medium">Stage</th>
                      <th className="text-right px-4 py-3 text-gray-500 font-medium">Valeur</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-medium">Agent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map((lead) => {
                      const stage = PIPELINE_STAGES.find(s => s.key === (lead.pipeline_stage || 'new'));
                      return (
                        <tr key={lead.id} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-medium">{lead.name}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 text-gray-500 text-xs">
                              {lead.email && <><Mail className="w-3 h-3" />{lead.email}</>}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${stage?.color}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${stage?.dot}`} />
                              {stage?.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            {lead.expected_value ? `${lead.expected_value.toLocaleString()} F` : '—'}
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{lead.owner_email || 'Non assigné'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* Agents */}
          <TabsContent value="agents" className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setShowAgentDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un agent
              </Button>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {agents.map((agent) => {
                const progressPct = Math.round((agent.revenue / agent.target) * 100);
                return (
                  <Card key={agent.id} className="p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold">
                        {agent.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold">{agent.name}</p>
                        <p className="text-xs text-gray-500">{agent.region}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-lg font-bold text-indigo-600">{agent.leads}</p>
                        <p className="text-[10px] text-gray-500">Leads</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-lg font-bold text-emerald-600">{agent.closed}</p>
                        <p className="text-[10px] text-gray-500">Closés</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-lg font-bold text-orange-600">{Math.round(agent.closed / agent.leads * 100)}%</p>
                        <p className="text-[10px] text-gray-500">Conv.</p>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Objectif mensuel</span>
                        <span className="font-semibold">{progressPct}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all ${progressPct >= 100 ? 'bg-emerald-500' : progressPct >= 70 ? 'bg-blue-500' : 'bg-orange-500'}`}
                          style={{ width: `${Math.min(progressPct, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span className="text-gray-500">{(agent.revenue / 1000).toFixed(0)}k F</span>
                        <span className="text-gray-400">/ {(agent.target / 1000).toFixed(0)}k F</span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-5">
                <h3 className="font-semibold mb-4">Pipeline par étape</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={pipelineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="stage" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Leads" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
              <Card className="p-5">
                <h3 className="font-semibold mb-4">Performance des agents</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={agentPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#10b981" name="Revenus (k F)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="target" fill="#e5e7eb" name="Objectif (k F)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Lead Dialog */}
        <Dialog open={showLeadDialog} onOpenChange={setShowLeadDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Nouveau lead</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Entreprise</Label><Input value={leadForm.company_name} onChange={e => setLeadForm({ ...leadForm, company_name: e.target.value })} /></div>
                <div><Label className="text-xs">Contact</Label><Input value={leadForm.contact_name} onChange={e => setLeadForm({ ...leadForm, contact_name: e.target.value })} /></div>
              </div>
              <div><Label className="text-xs">Email</Label><Input type="email" value={leadForm.email} onChange={e => setLeadForm({ ...leadForm, email: e.target.value })} /></div>
              <div><Label className="text-xs">Téléphone</Label><Input value={leadForm.phone} onChange={e => setLeadForm({ ...leadForm, phone: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Stage</Label>
                  <Select value={leadForm.stage} onValueChange={v => setLeadForm({ ...leadForm, stage: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PIPELINE_STAGES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Valeur estimée (F)</Label><Input type="number" value={leadForm.value} onChange={e => setLeadForm({ ...leadForm, value: e.target.value })} /></div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowLeadDialog(false)}>Annuler</Button>
                <Button className="flex-1 bg-indigo-600" onClick={() => { toast.success('Lead créé'); setShowLeadDialog(false); }}>Créer</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </BackofficeLayout>
  );
}