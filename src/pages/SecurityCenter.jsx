import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Shield, AlertTriangle, CheckCircle, FileText, Upload, 
  TrendingUp, Lock, Eye, Flag, Award, Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from 'sonner';
import TrustBadge from '@/components/safety/TrustBadge';
import { motion } from 'framer-motion';

export default function SecurityCenter() {
  const [user, setUser] = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
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

  const { data: verifications = [] } = useQuery({
    queryKey: ['verifications', user?.email],
    queryFn: () => base44.entities.IdentityVerification.filter({ user_email: user.email }),
    enabled: !!user
  });

  const { data: reports = [] } = useQuery({
    queryKey: ['my-reports', user?.email],
    queryFn: () => base44.entities.ScamReport.filter({ reporter_email: user.email }),
    enabled: !!user
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, type }) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return base44.entities.IdentityVerification.create({
        user_email: user.email,
        verification_type: type,
        document_url: file_url,
        verification_level: type === 'business_license' ? 'premium' : 'basic'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verifications'] });
      toast.success('Document soumis pour vérification');
    }
  });

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingDoc(true);
    try {
      await uploadMutation.mutateAsync({ file, type });
    } finally {
      setUploadingDoc(false);
    }
  };

  const trustScore = user?.trust_score || 50;
  const trustLevel = 
    trustScore >= 80 ? { label: 'Excellent', color: 'text-green-600', bg: 'bg-green-100' } :
    trustScore >= 60 ? { label: 'Bon', color: 'text-blue-600', bg: 'bg-blue-100' } :
    trustScore >= 40 ? { label: 'Moyen', color: 'text-yellow-600', bg: 'bg-yellow-100' } :
    { label: 'Faible', color: 'text-red-600', bg: 'bg-red-100' };

  const securityTips = [
    {
      icon: Lock,
      title: "Vérifiez toujours l'identité",
      description: "Assurez-vous que le vendeur est vérifié avant d'acheter"
    },
    {
      icon: Eye,
      title: "Méfiez-vous des offres trop belles",
      description: "Des réductions excessives peuvent indiquer une arnaque"
    },
    {
      icon: Flag,
      title: "Signalez les comportements suspects",
      description: "Aidez la communauté en signalant les activités douteuses"
    },
    {
      icon: Shield,
      title: "Ne partagez jamais vos codes QR",
      description: "Les codes de livraison sont personnels et uniques"
    }
  ];

  if (!user) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-7 h-7 text-blue-600" />
              Centre de Sécurité
            </h1>
            <p className="text-gray-500">Protégez votre compte et la communauté</p>
          </div>
          <TrustBadge trustScore={trustScore} size="lg" />
        </div>

        {/* Trust Score Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Score de Confiance</span>
                <Badge className={`${trustLevel.bg} ${trustLevel.color}`}>
                  {trustLevel.label}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl font-bold text-gray-900">{trustScore}/100</span>
                    <TrendingUp className={`w-5 h-5 ${trustScore >= 60 ? 'text-green-500' : 'text-gray-400'}`} />
                  </div>
                  <Progress value={trustScore} className="h-3" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-600">{user.successful_transactions || 0}</p>
                    <p className="text-xs text-gray-600">Transactions réussies</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{user.account_age_days || 0}j</p>
                    <p className="text-xs text-gray-600">Ancienneté</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{user.reports_submitted || 0}</p>
                    <p className="text-xs text-gray-600">Signalements faits</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{user.reports_received || 0}</p>
                    <p className="text-xs text-gray-600">Signalements reçus</p>
                  </div>
                </div>

                <div className="bg-blue-100 rounded-lg p-3 mt-4">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div className="text-xs text-blue-800">
                      <p className="font-medium mb-1">Comment améliorer votre score?</p>
                      <ul className="space-y-1 list-disc list-inside">
                        <li>Complétez votre vérification d'identité (+20 pts)</li>
                        <li>Effectuez des transactions réussies (+2 pts/transaction)</li>
                        <li>Signalez les comportements suspects (+5 pts)</li>
                        <li>Évitez les signalements négatifs</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <Tabs defaultValue="verification" className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="verification">Vérification</TabsTrigger>
            <TabsTrigger value="reports">Signalements</TabsTrigger>
            <TabsTrigger value="tips">Conseils</TabsTrigger>
          </TabsList>

          {/* Identity Verification Tab */}
          <TabsContent value="verification" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-600" />
                  Vérification d'identité
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {/* ID Card */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">Carte d'identité</h3>
                        <p className="text-xs text-gray-500">Vérification basique</p>
                      </div>
                      {verifications.find(v => v.verification_type === 'id_card')?.status === 'approved' ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : (
                        <Badge variant="outline">Non vérifié</Badge>
                      )}
                    </div>
                    <label className="block">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'id_card')}
                        className="hidden"
                        disabled={uploadingDoc}
                      />
                      <Button variant="outline" className="w-full" disabled={uploadingDoc}>
                        <Upload className="w-4 h-4 mr-2" />
                        {uploadingDoc ? 'Envoi...' : 'Télécharger'}
                      </Button>
                    </label>
                  </div>

                  {/* Business License (for partners) */}
                  {user.is_partner && (
                    <div className="border rounded-lg p-4 bg-purple-50 border-purple-200">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">Licence commerciale</h3>
                          <p className="text-xs text-purple-600">Vérification Premium</p>
                        </div>
                        {verifications.find(v => v.verification_type === 'business_license')?.status === 'approved' ? (
                          <Badge className="bg-purple-600">Vérifié</Badge>
                        ) : (
                          <Badge variant="outline">Non vérifié</Badge>
                        )}
                      </div>
                      <label className="block">
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => handleFileUpload(e, 'business_license')}
                          className="hidden"
                          disabled={uploadingDoc}
                        />
                        <Button className="w-full bg-purple-600 hover:bg-purple-700" disabled={uploadingDoc}>
                          <Upload className="w-4 h-4 mr-2" />
                          {uploadingDoc ? 'Envoi...' : 'Télécharger'}
                        </Button>
                      </label>
                    </div>
                  )}
                </div>

                {/* Verification History */}
                {verifications.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">Historique</h3>
                    <div className="space-y-2">
                      {verifications.map((verification) => (
                        <div key={verification.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm capitalize">
                              {verification.verification_type.replace('_', ' ')}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(verification.created_date).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <Badge className={
                            verification.status === 'approved' ? 'bg-green-100 text-green-700' :
                            verification.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }>
                            {verification.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="w-5 h-5 text-orange-600" />
                  Mes signalements
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reports.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Aucun signalement effectué</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reports.map((report) => (
                      <div key={report.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <Badge variant="outline" className="mb-2">
                              {report.reported_entity_type}
                            </Badge>
                            <p className="font-medium capitalize">{report.reason.replace('_', ' ')}</p>
                            <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                          </div>
                          <Badge className={
                            report.status === 'resolved' ? 'bg-green-100 text-green-700' :
                            report.status === 'investigating' ? 'bg-blue-100 text-blue-700' :
                            report.status === 'dismissed' ? 'bg-gray-100 text-gray-700' :
                            'bg-yellow-100 text-yellow-700'
                          }>
                            {report.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-400">
                          {new Date(report.created_date).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tips Tab */}
          <TabsContent value="tips" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {securityTips.map((tip, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <tip.icon className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-2">{tip.title}</h3>
                          <p className="text-sm text-gray-600">{tip.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <Card className="border-2 border-emerald-200 bg-emerald-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Shield className="w-6 h-6 text-emerald-600" />
                  <div>
                    <h3 className="font-semibold text-emerald-900 mb-2">
                      Besoin d'aide?
                    </h3>
                    <p className="text-sm text-emerald-800 mb-3">
                      Si vous êtes victime d'une escroquerie ou avez des doutes, contactez immédiatement notre équipe de sécurité.
                    </p>
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      Contacter le support
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}