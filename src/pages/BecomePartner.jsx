import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Store, TrendingUp, Leaf, Users, CheckCircle, ArrowRight,
  Package, Zap, BarChart3
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StoreForm from '@/components/forms/StoreForm';

const benefits = [
  { icon: TrendingUp, title: 'Réduisez vos pertes', desc: 'Récupérez jusqu\'à 70% de la valeur de vos invendus' },
  { icon: Leaf, title: 'Impact écologique', desc: 'Participez à la lutte contre le gaspillage alimentaire' },
  { icon: Users, title: 'Nouveaux clients', desc: 'Attirez une communauté engagée et fidèle' },
  { icon: Zap, title: 'IA StockGuardian', desc: 'Optimisez vos prix avec notre assistant intelligent' },
];

const steps = [
  { number: '1', title: 'Créez votre compte', desc: 'Inscription rapide en 2 minutes' },
  { number: '2', title: 'Ajoutez votre magasin', desc: 'Remplissez les informations de base' },
  { number: '3', title: 'Validation express', desc: 'Vérification sous 24h' },
  { number: '4', title: 'Commencez à vendre', desc: 'Ajoutez vos produits instantanément' },
];

export default function BecomePartner() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {}
    };
    loadUser();
  }, []);

  // Check if user has a store
  const { data: userStore } = useQuery({
    queryKey: ['user-store', user?.email],
    queryFn: async () => {
      const stores = await base44.entities.Store.filter({ owner_email: user.email });
      return stores[0];
    },
    enabled: !!user
  });

  if (userStore) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">Vous êtes déjà partenaire !</h2>
          <p className="text-gray-500 mb-2">Magasin: {userStore.name}</p>
          <p className="text-sm text-gray-400 mb-6">
            Statut: <Badge className={
              userStore.status === 'verified' ? 'bg-green-500' :
              userStore.status === 'pending' ? 'bg-orange-500' :
              'bg-gray-500'
            }>
              {userStore.status === 'verified' ? 'Vérifié' :
               userStore.status === 'pending' ? 'En attente' :
               userStore.status}
            </Badge>
          </p>
          <Link to={createPageUrl('PartnerDashboard')}>
            <Button className="w-full bg-emerald-500 hover:bg-emerald-600">
              <BarChart3 className="w-4 h-4 mr-2" />
              Tableau de bord
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Store className="w-10 h-10" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Devenez partenaire CHICHARD
            </h1>
            <p className="text-emerald-100 text-lg max-w-2xl mx-auto mb-8">
              Rejoignez notre réseau de magasins engagés contre le gaspillage alimentaire
              et transformez vos invendus en opportunités.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {!showForm && (
                <>
                  <Button 
                    size="lg" 
                    className="bg-white text-emerald-600 hover:bg-emerald-50"
                    onClick={() => {
                      if (!user) {
                        base44.auth.redirectToLogin();
                      } else {
                        setShowForm(true);
                      }
                    }}
                  >
                    {user ? 'Inscrire mon magasin' : 'Créer mon compte gratuitement'}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  <div className="text-emerald-100 text-sm">
                    ✓ Sans engagement • ✓ Configuration en 5 min • ✓ 100% gratuit
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {showForm ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-6">Informations du magasin</h2>
              <StoreForm 
                onSuccess={() => window.location.href = createPageUrl('PartnerDashboard')}
                onCancel={() => setShowForm(false)}
              />
            </Card>
          </motion.div>
        ) : (
          <>
            {/* Simple Steps */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-center mb-3">Inscription simple en 4 étapes</h2>
              <p className="text-center text-gray-500 mb-8">Démarrez en moins de 5 minutes</p>
              <div className="grid md:grid-cols-4 gap-4">
                {steps.map((step, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card className="p-4 text-center relative">
                      <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                        {step.number}
                      </div>
                      <h3 className="font-semibold text-sm mb-1">{step.title}</h3>
                      <p className="text-xs text-gray-500">{step.desc}</p>
                      {idx < steps.length - 1 && (
                        <ArrowRight className="hidden md:block absolute -right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                      )}
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Benefits */}
            <h2 className="text-2xl font-bold text-center mb-8">Les avantages CHICHARD</h2>
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {benefits.map((benefit, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="p-6 h-full">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-emerald-100 rounded-xl">
                        <benefit.icon className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">{benefit.title}</h3>
                        <p className="text-gray-500 text-sm">{benefit.desc}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Stats */}
            <Card className="p-8 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 mb-12">
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <p className="text-3xl font-bold text-emerald-600">500+</p>
                  <p className="text-sm text-gray-600">Magasins partenaires</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-emerald-600">45T</p>
                  <p className="text-sm text-gray-600">Produits sauvés</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-emerald-600">70%</p>
                  <p className="text-sm text-gray-600">Valeur récupérée</p>
                </div>
              </div>
            </Card>

            {/* FAQ Quick */}
            <Card className="p-6 mb-8">
              <h3 className="font-bold text-lg mb-4">Questions fréquentes</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-semibold text-gray-900">💰 Combien ça coûte ?</p>
                  <p className="text-gray-600">Inscription 100% gratuite, sans frais cachés.</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">⏱️ Combien de temps pour être validé ?</p>
                  <p className="text-gray-600">Votre compte est vérifié sous 24h maximum.</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">📱 Besoin d'équipement spécial ?</p>
                  <p className="text-gray-600">Non, un smartphone suffit pour gérer vos produits.</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">🤝 Engagement requis ?</p>
                  <p className="text-gray-600">Aucun engagement, arrêtez quand vous voulez.</p>
                </div>
              </div>
            </Card>

            {/* CTA */}
            <div className="text-center bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-2">Prêt à commencer ?</h3>
              <p className="text-emerald-100 mb-6">Rejoignez 500+ magasins qui font confiance à CHICHARD</p>
              <Button 
                size="lg" 
                className="bg-white text-emerald-600 hover:bg-emerald-50"
                onClick={() => {
                  if (!user) {
                    base44.auth.redirectToLogin();
                  } else {
                    setShowForm(true);
                  }
                }}
              >
                {user ? 'Inscrire mon magasin maintenant' : 'Créer mon compte gratuitement'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}