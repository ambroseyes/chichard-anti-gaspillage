import React from 'react';
import { Link } from 'react-router-dom';
import { ChefHat, Flame, Percent, Sparkles, Store, Trophy, Users } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/lib/AuthContext';
import { useCart } from '@/hooks/useCart';
import { PRODUCT_CATEGORIES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import ReassuranceStrip from '@/components/layout/ReassuranceStrip';
import ProductRail from '@/components/catalog/ProductRail';
import SavingsCounter from '@/components/ui/SavingsCounter';
import AIProductRecommendations from '@/components/ai/AIProductRecommendations';
import AIRecipeRecommendations from '@/components/ai/AIRecipeRecommendations';
import AIPartnerRecommendations from '@/components/ai/AIPartnerRecommendations';
import EnhancedPersonalizedFeed from '@/components/feed/EnhancedPersonalizedFeed';
import OrderNotifications from '@/components/notifications/OrderNotifications';

const catalogLink = (params) => createPageUrl(`Catalog?${new URLSearchParams(params).toString()}`);

/**
 * Accueil.
 *
 * Structure de page marchande : une promesse, les rayons, puis des rangées
 * thématiques servies par le moteur de recherche. Aucun tri n'est fait ici —
 * chaque rangée demande sa sélection au serveur.
 */
export default function Home() {
  const { user } = useAuth();
  const { addToCart } = useCart();

  return (
    <div className="bg-gray-50">
      {user && <OrderNotifications userEmail={user.email} />}

      {/* Bandeau d'accroche */}
      <section className="bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 text-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-10 lg:py-14 grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <p className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-medium mb-4">
              <Flame className="w-3.5 h-3.5" />
              Jusqu'à −70 % sur les produits proches de leur date limite
            </p>
            <h1 className="text-3xl lg:text-4xl font-bold leading-tight mb-3">
              Sauvez des produits,
              <br />
              économisez vraiment.
            </h1>
            <p className="text-emerald-50 text-base mb-6 max-w-md">
              Les invendus des boutiques de Yaoundé et Douala, à petit prix et
              vérifiés — plutôt qu'à la poubelle.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50">
                <Link to={createPageUrl('Catalog')}>Voir le catalogue</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/40 bg-white/10 text-white hover:bg-white/20"
              >
                <Link to={catalogLink({ expires: 'today' })}>Ce qui expire aujourd'hui</Link>
              </Button>
            </div>
          </div>

          <ul className="grid grid-cols-3 gap-3">
            {[
              { value: '−70 %', label: 'de remise maximale' },
              { value: '3', label: 'boutiques partenaires' },
              { value: '24 h', label: 'de délai de livraison' },
            ].map((stat) => (
              <li key={stat.label} className="bg-white/10 rounded-xl p-4 text-center">
                <span className="block text-2xl font-bold">{stat.value}</span>
                <span className="block text-xs text-emerald-100 mt-1">{stat.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <ReassuranceStrip />

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8 space-y-10">
        {/* Rayons */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Faire ses courses par rayon</h2>
          <ul className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-10 gap-2">
            {PRODUCT_CATEGORIES.map((category) => (
              <li key={category.id}>
                <Link
                  to={catalogLink({ category: category.id })}
                  className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-sm transition-all text-center h-full"
                >
                  <span className="text-2xl" aria-hidden="true">
                    {category.emoji}
                  </span>
                  <span className="text-[11px] font-medium text-gray-700 leading-tight">
                    {category.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {user && (
          <SavingsCounter
            totalSavings={user.total_savings || 0}
            wasteAvoided={user.waste_avoided_kg || 0}
            ecoLevel={user.eco_level || 'debutant'}
          />
        )}

        <ProductRail
          title="Dernier jour"
          subtitle="À sauver aujourd'hui — après, c'est perdu"
          criteria={{ expires: 'today', sort: 'expiration' }}
          seeAllTo={catalogLink({ expires: 'today' })}
          onAddToCart={addToCart}
        />

        <ProductRail
          title="Les plus fortes remises"
          subtitle="Le meilleur rapport qualité-prix du moment"
          criteria={{ sort: 'discount' }}
          seeAllTo={catalogLink({ sort: 'discount' })}
          onAddToCart={addToCart}
        />

        {user && <AIProductRecommendations user={user} onAddToCart={addToCart} />}
        {user && <EnhancedPersonalizedFeed user={user} onAddToCart={addToCart} />}

        <ProductRail
          title="Nouveautés du jour"
          subtitle="Les articles mis en ligne le plus récemment"
          criteria={{ sort: 'newest' }}
          seeAllTo={catalogLink({ sort: 'newest' })}
          onAddToCart={addToCart}
        />

        {user && <AIRecipeRecommendations user={user} />}
        {user && <AIPartnerRecommendations user={user} />}

        {/* Accès rapides */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickLink
            to={createPageUrl('ClickCollect')}
            icon={Store}
            title="Paniers du soir"
            detail="À retirer en boutique"
            className="from-emerald-50 to-teal-50 border-emerald-100 text-emerald-600"
          />
          <QuickLink
            to={createPageUrl('FoodCoach')}
            icon={ChefHat}
            title="FoodCoach"
            detail="Recettes anti-gaspi"
            className="from-orange-50 to-red-50 border-orange-100 text-orange-500"
          />
          <QuickLink
            to={createPageUrl('Community')}
            icon={Users}
            title="Communauté"
            detail="Partagez vos trouvailles"
            className="from-purple-50 to-indigo-50 border-purple-100 text-purple-500"
          />
          <QuickLink
            to={createPageUrl('LoyaltyProgram')}
            icon={Trophy}
            title="Fidélité"
            detail="Cumulez des points"
            className="from-amber-50 to-yellow-50 border-amber-100 text-amber-500"
          />
        </section>

        {/* Appel aux commerçants */}
        <section className="bg-gray-900 rounded-2xl p-6 lg:p-8 text-white flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold mb-2">Vous êtes commerçant ?</h2>
            <p className="text-gray-300 text-sm max-w-lg">
              Mettez vos invendus en vente en quelques minutes, fixez vos remises
              et suivez ce que vous récupérez au lieu de le jeter.
            </p>
          </div>
          <Button asChild size="lg" className="bg-emerald-500 hover:bg-emerald-600 shrink-0">
            <Link to={createPageUrl(user?.is_partner ? 'PartnerDashboard' : 'BecomePartner')}>
              {user?.is_partner ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Mon espace partenaire
                </>
              ) : (
                <>
                  <Percent className="w-4 h-4 mr-2" />
                  Devenir partenaire
                </>
              )}
            </Link>
          </Button>
        </section>
      </div>
    </div>
  );
}

function QuickLink({ to, icon: Icon, title, detail, className }) {
  return (
    <Link to={to}>
      <Card className={`p-4 h-full bg-gradient-to-br hover:shadow-md transition-shadow ${className}`}>
        <Icon className="w-7 h-7 mb-2" />
        <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
        <p className="text-xs text-gray-500">{detail}</p>
      </Card>
    </Link>
  );
}
