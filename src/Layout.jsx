import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  Home, 
  Search, 
  ShoppingCart, 
  User, 
  Menu,
  X,
  Package,
  Store,
  BarChart3,
  LogOut,
  Leaf,
  Users,
  ChefHat,
  TrendingUp,
  Crown,
  Flame,
  Ticket,
  MessageCircle
} from 'lucide-react';
import GlobalSearch from '@/components/search/GlobalSearch';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from 'framer-motion';

export default function Layout({ children, currentPageName }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {
        // User not logged in
      }
    };
    loadUser();
  }, []);

  const { data: cartItems = [] } = useQuery({
    queryKey: ['cart', user?.email],
    queryFn: () => user ? base44.entities.CartItem.filter({ user_email: user.email }) : [],
    enabled: !!user,
  });

  const cartCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

  const isPartnerPage = currentPageName?.startsWith('Partner') || currentPageName === 'StockGuardian';
  const hideNav = ['Onboarding'].includes(currentPageName);

  const mainNavItems = [
    { name: 'Home', icon: Home, label: 'Accueil' },
    { name: 'Catalog', icon: Search, label: 'Catalogue' },
    { name: 'CommunityChat', icon: MessageCircle, label: 'Chat' },
    { name: 'Community', icon: Users, label: 'Social' },
    { name: 'Cart', icon: ShoppingCart, label: 'Panier', badge: cartCount },
  ];

  const partnerNavItems = [
    { name: 'PartnerDashboard', icon: BarChart3, label: 'Tableau de bord' },
    { name: 'PartnerProducts', icon: Package, label: 'Produits' },
    { name: 'PartnerChallenges', icon: Flame, label: 'Défis' },
    { name: 'PartnerExperiences', icon: Ticket, label: 'Expériences' },
    { name: 'StockGuardian', icon: Leaf, label: 'StockGuardian' },
  ];

  const driverNavItems = [
    { name: 'DriverDashboard', icon: Users, label: 'Livraisons' },
    { name: 'Home', icon: Store, label: 'Boutique' },
  ];

  const isDriverPage = currentPageName === 'DriverDashboard';

  const navItems = isDriverPage ? driverNavItems : isPartnerPage ? partnerNavItems : mainNavItems;

  if (hideNav) {
    return <div className="min-h-screen bg-gray-50">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        :root {
          --chichard-green: #10B981;
          --chichard-orange: #F97316;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Desktop Header */}
      <header className="hidden md:block bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link to={createPageUrl('Home')} className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                CHICHARD
              </span>
            </Link>

            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPageName === item.name;
                return (
                  <Link
                    key={item.name}
                    to={createPageUrl(item.name)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                      isActive 
                        ? 'bg-emerald-50 text-emerald-600' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="relative">
                      <Icon className="w-5 h-5" />
                      {item.badge > 0 && (
                        <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-3">
              {user ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => base44.auth.logout()}
                  className="text-gray-500"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Déconnexion
                </Button>
              ) : (
                <Button
                  onClick={() => base44.auth.redirectToLogin()}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  Connexion
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 h-14">
          <Link to={createPageUrl('Home')} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              CHICHARD
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <button onClick={() => setShowSearch(true)} className="p-2">
              <Search className="w-6 h-6 text-gray-600" />
            </button>
            <Link to={createPageUrl('Cart')} className="relative p-2">
              <ShoppingCart className="w-6 h-6 text-gray-600" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-orange-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                  {cartCount}
                </span>
              )}
            </Link>
            <button onClick={() => setMobileMenuOpen(true)} className="p-2">
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Global Search */}
      <GlobalSearch isOpen={showSearch} onClose={() => setShowSearch(false)} />

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="absolute right-0 top-0 bottom-0 w-72 bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b flex justify-between items-center">
                <span className="font-semibold">Menu</span>
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X className="w-6 h-6" />
                </button>
              </div>
              <nav className="p-4 space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={createPageUrl(item.name)}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50"
                    >
                      <Icon className="w-5 h-5 text-gray-500" />
                      <span>{item.label}</span>
                      {item.badge > 0 && (
                        <Badge className="ml-auto bg-orange-500">{item.badge}</Badge>
                      )}
                    </Link>
                  );
                })}
              </nav>
              {user && (
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => base44.auth.logout()}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Déconnexion
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="pb-20 md:pb-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40">
        <div className="flex items-center justify-around h-16 px-2">
          {mainNavItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = currentPageName === item.name;
            return (
              <Link
                key={item.name}
                to={createPageUrl(item.name)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                  isActive ? 'text-emerald-600' : 'text-gray-400'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : ''}`} />
                  {item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-medium">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}