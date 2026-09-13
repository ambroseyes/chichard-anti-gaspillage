import React from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  Flame,
  Home,
  LayoutGrid,
  Leaf,
  Package,
  ShoppingBag,
  ShoppingCart,
  Ticket,
  Truck,
  User,
  Users,
} from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/lib/AuthContext';
import { useCart } from '@/hooks/useCart';
import SiteHeader, { WorkspaceHeader } from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';

/**
 * Gabarit de l'application.
 *
 * Trois coques distinctes : la boutique (en-tête marchand, rayons, pied de
 * page plan du site), l'espace partenaire et l'espace livreur. Les deux
 * derniers sont des outils de travail — ils n'ont rien à faire avec un panier
 * ni une barre de rayons.
 */

const PARTNER_NAV = [
  { name: 'PartnerDashboard', icon: BarChart3, label: 'Tableau de bord' },
  { name: 'PartnerProducts', icon: Package, label: 'Produits' },
  { name: 'MerchantBasketManager', icon: ShoppingBag, label: 'Paniers du soir' },
  { name: 'PartnerChallenges', icon: Flame, label: 'Défis' },
  { name: 'PartnerExperiences', icon: Ticket, label: 'Expériences' },
  { name: 'StockGuardian', icon: Leaf, label: 'StockGuardian' },
];

const DRIVER_NAV = [
  { name: 'DriverDashboard', icon: Truck, label: 'Mes livraisons' },
  { name: 'DeliveryManagement', icon: Package, label: 'Courses' },
  { name: 'DeliveryOptimization', icon: BarChart3, label: 'Tournée' },
];

const PARTNER_PAGES = new Set([...PARTNER_NAV.map((i) => i.name), 'PartnerStats', 'PartnerAnalytics', 'PartnerPredictiveDashboard', 'BrandCampaignManager']);
const DRIVER_PAGES = new Set(DRIVER_NAV.map((i) => i.name));

export default function Layout({ children, currentPageName }) {
  const { user } = useAuth();

  if (PARTNER_PAGES.has(currentPageName)) {
    return (
      <Workspace title="Espace partenaire" nav={PARTNER_NAV} currentPageName={currentPageName}>
        {children}
      </Workspace>
    );
  }

  if (DRIVER_PAGES.has(currentPageName)) {
    return (
      <Workspace title="Espace livreur" nav={DRIVER_NAV} currentPageName={currentPageName}>
        {children}
      </Workspace>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <SiteHeader />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <SiteFooter />
      <MobileTabBar currentPageName={currentPageName} isAuthenticated={Boolean(user)} />
    </div>
  );
}

function Workspace({ title, nav, currentPageName, children }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <WorkspaceHeader title={title} navItems={nav} currentPageName={currentPageName} />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4 text-xs text-gray-500">
          {title} — Chichard
        </div>
      </footer>
    </div>
  );
}

/**
 * Barre d'onglets mobile.
 *
 * Cinq destinations au maximum : au-delà, les cibles deviennent trop petites
 * pour être touchées sans se tromper.
 */
function MobileTabBar({ currentPageName, isAuthenticated }) {
  const { count } = useCart();

  const tabs = [
    { name: 'Home', icon: Home, label: 'Accueil' },
    { name: 'Catalog', icon: LayoutGrid, label: 'Rayons' },
    { name: 'ClickCollect', icon: ShoppingBag, label: 'Collect' },
    { name: 'Cart', icon: ShoppingCart, label: 'Panier', badge: count },
    isAuthenticated
      ? { name: 'MyAccount', icon: User, label: 'Compte' }
      : { name: 'Community', icon: Users, label: 'Communauté' },
  ];

  return (
    <nav
      aria-label="Navigation principale"
      className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-40"
    >
      <ul className="flex items-stretch h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = currentPageName === tab.name;
          return (
            <li key={tab.name} className="flex-1">
              <Link
                to={createPageUrl(tab.name)}
                aria-current={active ? 'page' : undefined}
                className={`h-full flex flex-col items-center justify-center gap-1 ${
                  active ? 'text-emerald-600' : 'text-gray-400'
                }`}
              >
                <span className="relative">
                  <Icon className={`w-6 h-6 ${active ? 'stroke-[2.5]' : ''}`} />
                  {tab.badge > 0 && (
                    <span className="absolute -top-1 -right-2 min-w-[1rem] h-4 px-1 bg-orange-500 text-white text-[10px] font-semibold rounded-full grid place-items-center">
                      {tab.badge}
                    </span>
                  )}
                </span>
                <span className="text-[10px] font-medium">{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
