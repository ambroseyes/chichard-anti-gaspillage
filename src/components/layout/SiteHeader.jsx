import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, Leaf, MapPin, Package, ShoppingCart, Store } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { formatXAF } from '@/lib/format';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/lib/AuthContext';
import SearchBar from './SearchBar';
import CategoryBar from './CategoryBar';
import AccountMenu from './AccountMenu';
import MiniCart from './MiniCart';

/**
 * En-tête du site marchand.
 *
 * Trois niveaux, comme sur n'importe quelle grande place de marché : les
 * informations de service, la barre d'action (recherche, compte, panier),
 * puis les rayons. La recherche occupe le centre parce que c'est par là que
 * passe l'essentiel du trafic.
 */
export default function SiteHeader() {
  const location = useLocation();
  const { user } = useAuth();
  const { count, subtotal } = useCart();
  const [cartOpen, setCartOpen] = useState(false);

  // Sur la page de résultats, la barre rappelle le mot cherché.
  const term = new URLSearchParams(location.search).get('q') ?? '';

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* Barre de service */}
      <div className="bg-emerald-950 text-emerald-100">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 h-9 flex items-center justify-between text-xs">
          <p className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
            Livraison à Yaoundé et Douala — retrait gratuit en boutique
          </p>
          <nav aria-label="Liens de service" className="hidden md:flex items-center gap-4">
            <Link to={createPageUrl('BecomePartner')} className="hover:text-white">
              Vendre sur Chichard
            </Link>
            <Link to={createPageUrl('Orders')} className="hover:text-white">
              Suivre ma commande
            </Link>
            <Link to={createPageUrl('Contact')} className="hover:text-white">
              Aide
            </Link>
          </nav>
        </div>
      </div>

      {/* Barre principale */}
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="flex items-center gap-4 lg:gap-8 h-16">
          <Link to={createPageUrl('Home')} className="flex items-center gap-2 shrink-0">
            <span className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 grid place-items-center">
              <Leaf className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
            </span>
            <span className="text-lg lg:text-xl font-bold text-emerald-700 tracking-tight">
              CHICHARD
            </span>
          </Link>

          <div className="hidden md:block flex-1 max-w-2xl">
            <SearchBar initialTerm={term} />
          </div>

          <div className="flex items-center gap-1 ml-auto">
            {user && (
              <Link
                to={createPageUrl('ProductPreferences')}
                className="hidden lg:flex flex-col items-center px-3 py-1.5 rounded-md hover:bg-gray-50 text-gray-700"
              >
                <Heart className="w-5 h-5" />
                <span className="text-[11px]">Favoris</span>
              </Link>
            )}
            {user && (
              <Link
                to={createPageUrl('Orders')}
                className="hidden lg:flex flex-col items-center px-3 py-1.5 rounded-md hover:bg-gray-50 text-gray-700"
              >
                <Package className="w-5 h-5" />
                <span className="text-[11px]">Commandes</span>
              </Link>
            )}

            <AccountMenu />

            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-emerald-50 text-gray-800"
            >
              <span className="relative">
                <ShoppingCart className="w-6 h-6" />
                {count > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[1.15rem] h-[1.15rem] px-1 bg-orange-500 text-white text-[11px] font-semibold rounded-full grid place-items-center">
                    {count}
                  </span>
                )}
              </span>
              <span className="hidden lg:block text-left leading-tight">
                <span className="block text-[11px] text-gray-500">Panier</span>
                <span className="block text-sm font-semibold">{formatXAF(subtotal)}</span>
              </span>
              <span className="sr-only">
                Ouvrir le panier, {count} article{count > 1 ? 's' : ''}
              </span>
            </button>
          </div>
        </div>

        {/* Recherche pleine largeur sur mobile : c'est l'action principale. */}
        <div className="md:hidden pb-3">
          <SearchBar initialTerm={term} />
        </div>
      </div>

      <CategoryBar />

      <MiniCart open={cartOpen} onOpenChange={setCartOpen} />
    </header>
  );
}

/** En-tête allégé des espaces professionnels : pas de panier, pas de rayons. */
export function WorkspaceHeader({ title, navItems = [], currentPageName }) {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 h-16 flex items-center gap-6">
        <Link to={createPageUrl('Home')} className="flex items-center gap-2 shrink-0">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 grid place-items-center">
            <Leaf className="w-5 h-5 text-white" />
          </span>
          <span className="hidden sm:block">
            <span className="block text-sm font-bold text-emerald-700 leading-none">CHICHARD</span>
            <span className="block text-[11px] text-gray-500">{title}</span>
          </span>
        </Link>

        <nav aria-label={title} className="flex-1 flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentPageName === item.name;
            return (
              <Link
                key={item.name}
                to={createPageUrl(item.name)}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                  active ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link
          to={createPageUrl('Home')}
          className="hidden sm:flex items-center gap-2 text-sm text-gray-600 hover:text-emerald-700 shrink-0"
        >
          <Store className="w-4 h-4" />
          Voir la boutique
        </Link>

        <AccountMenu />
      </div>
    </header>
  );
}
