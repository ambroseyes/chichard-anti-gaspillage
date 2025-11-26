import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import {
  Store, TrendingUp, Leaf, Users, CheckCircle, ArrowRight,
  Package, Zap, BarChart3
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import StoreForm from '@/components/forms/StoreForm';

const benefits = [
  { icon: TrendingUp, title: 'Réduisez vos pertes', desc: 'Récupérez jusqu\'à 70% de la valeur de vos invendus' },
  { icon: Leaf, title: 'Impact écologique', desc: 'Participez à la lutte contre le gaspillage alimentaire' },
  { icon: Users, title: 'Nouveaux clients', desc: 'Attirez une communauté engagée et fidèle' },
  { icon: Zap, title: 'IA StockGuardian', desc: 'Optimisez vos prix avec notre assistant intelligent' },
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

  if (user?.is_partner) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">Vous êtes déjà partenaire !</h2>
          <p className="text-gray-500 mb-6">Accédez à votre tableau de bord pour gérer vos produits.</p>
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
            {!showForm && (
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
                {user ? 'Inscrire mon magasin' : 'Se connecter pour commencer'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            )}
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
            {/* Benefits */}
            <h2 className="text-2xl font-bold text-center mb-8">Pourquoi nous rejoindre ?</h2>
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

            {/* CTA */}
            <div className="text-center">
              <Button 
                size="lg" 
                className="bg-emerald-500 hover:bg-emerald-600"
                onClick={() => {
                  if (!user) {
                    base44.auth.redirectToLogin();
                  } else {
                    setShowForm(true);
                  }
                }}
              >
                Commencer maintenant
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}