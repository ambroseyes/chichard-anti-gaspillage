import React, { useState, useEffect } from 'react';
import { api } from '@/api';
import { motion } from 'framer-motion';
import {
  Crown, Check, Truck, Zap, Percent, BarChart3, Award,
  Star, Gift, Shield, ArrowRight
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import { goToLogin } from '@/lib/navigation';

const benefits = [
  {
    icon: Truck,
    title: 'Livraison gratuite',
    description: 'Livraison offerte dès 5 000 FCFA d\'achat',
    color: 'text-blue-500',
    bg: 'bg-blue-100'
  },
  {
    icon: Zap,
    title: 'Accès anticipé',
    description: 'Découvrez les Bons Plans 2h avant tout le monde',
    color: 'text-amber-500',
    bg: 'bg-amber-100'
  },
  {
    icon: Percent,
    title: 'Réductions exclusives',
    description: '+10% de réduction sur les produits sélectionnés',
    color: 'text-emerald-500',
    bg: 'bg-emerald-100'
  },
  {
    icon: BarChart3,
    title: 'Stats détaillées',
    description: 'Statistiques d\'impact écologique personnalisées',
    color: 'text-purple-500',
    bg: 'bg-purple-100'
  },
  {
    icon: Award,
    title: 'Badge exclusif',
    description: 'Badge CHICHARD+ affiché sur votre profil',
    color: 'text-pink-500',
    bg: 'bg-pink-100'
  },
  {
    icon: Gift,
    title: 'Surprises mensuelles',
    description: 'Offres et cadeaux réservés aux membres',
    color: 'text-orange-500',
    bg: 'bg-orange-100'
  }
];

const plans = [
  {
    id: 'monthly',
    name: 'Mensuel',
    price: 2500,
    period: '/mois',
    popular: false
  },
  {
    id: 'yearly',
    name: 'Annuel',
    price: 20000,
    period: '/an',
    popular: true,
    savings: '33% d\'économie'
  }
];

export default function ChichardPlus() {
  const [user, setUser] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await api.auth.me();
        setUser(userData);
      } catch {
        // Visiteur non connecté : la page reste consultable en anonyme.
      }
    };
    loadUser();
  }, []);

  const handleSubscribe = async () => {
    if (!user) {
      goToLogin();
      return;
    }

    setIsSubscribing(true);
    
    // Update user with premium status
    await api.auth.updateMe({
      is_premium: true,
      premium_plan: selectedPlan,
      premium_since: new Date().toISOString(),
      badges: [...(user.badges || []), 'chichard_plus']
    });

    setIsSubscribing(false);
    toast.success('Bienvenue dans CHICHARD+ ! 🎉');
  };

  const isPremium = user?.is_premium;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Crown className="w-5 h-5" />
              <span className="font-medium">Abonnement Premium</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              CHICHARD<span className="text-amber-200">+</span>
            </h1>
            <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
              Débloquez tous les avantages premium et maximisez vos économies anti-gaspillage
            </p>

            {isPremium && (
              <Badge className="bg-white text-orange-600 text-lg px-6 py-2">
                <Crown className="w-5 h-5 mr-2" />
                Vous êtes membre CHICHARD+
              </Badge>
            )}
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Tous vos avantages exclusifs
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {benefits.map((benefit, idx) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + idx * 0.05 }}
              >
                <Card className="p-5 h-full hover:shadow-lg transition-shadow">
                  <div className={`w-12 h-12 ${benefit.bg} rounded-xl flex items-center justify-center mb-4`}>
                    <benefit.icon className={`w-6 h-6 ${benefit.color}`} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-sm text-gray-500">{benefit.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Pricing */}
        {!isPremium && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
              Choisissez votre formule
            </h2>

            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-8">
              {plans.map((plan) => (
                <Card 
                  key={plan.id}
                  className={`p-6 cursor-pointer transition-all ${
                    selectedPlan === plan.id 
                      ? 'border-2 border-orange-500 shadow-lg' 
                      : 'border-2 border-transparent hover:border-orange-200'
                  }`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  {plan.popular && (
                    <Badge className="bg-orange-500 text-white mb-3">
                      <Star className="w-3 h-3 mr-1" />
                      Populaire
                    </Badge>
                  )}
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{plan.name}</h3>
                  
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-3xl font-bold text-gray-900">{plan.price.toLocaleString()}</span>
                    <span className="text-gray-500">FCFA{plan.period}</span>
                  </div>
                  
                  {plan.savings && (
                    <Badge className="bg-emerald-100 text-emerald-700">{plan.savings}</Badge>
                  )}

                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-emerald-500" />
                      Tous les avantages inclus
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <Button
                size="lg"
                onClick={handleSubscribe}
                disabled={isSubscribing}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-12 py-6 text-lg"
              >
                {isSubscribing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Traitement...
                  </>
                ) : (
                  <>
                    <Crown className="w-5 h-5 mr-2" />
                    Devenir membre CHICHARD+
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
              
              <p className="text-sm text-gray-500 mt-4">
                <Shield className="w-4 h-4 inline mr-1" />
                Paiement sécurisé • Annulation à tout moment
              </p>
            </div>
          </motion.div>
        )}

        {/* Premium member section */}
        {isPremium && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Card className="p-8 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 text-center">
              <Crown className="w-16 h-16 text-amber-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Vous êtes membre CHICHARD+
              </h2>
              <p className="text-gray-600 mb-6">
                Profitez de tous vos avantages exclusifs
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {benefits.slice(0, 3).map((benefit) => (
                  <div key={benefit.title} className="bg-white rounded-xl p-4">
                    <benefit.icon className={`w-6 h-6 ${benefit.color} mx-auto mb-2`} />
                    <p className="text-sm font-medium">{benefit.title}</p>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}