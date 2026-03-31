import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Users, ShieldCheck, BarChart3, FileText, Bell,
  Settings, LogOut, Menu, X, ChevronDown, TrendingUp, Package,
  AlertTriangle, Search, Moon, Sun, Globe, Zap, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';

const NAV_ITEMS = [
  {
    section: 'PILOTAGE',
    items: [
      { path: '/AdminBackoffice', icon: LayoutDashboard, label: 'Tableau de bord', roles: ['super_admin', 'admin', 'operator'] },
      { path: '/BackofficeAnalytics', icon: BarChart3, label: 'Analytics', roles: ['super_admin', 'admin'] },
    ]
  },
  {
    section: 'OPÉRATIONS',
    items: [
      { path: '/BackofficeUsers', icon: Users, label: 'Utilisateurs', roles: ['super_admin', 'admin'] },
      { path: '/BackofficeSales', icon: TrendingUp, label: 'Commerciaux & Leads', roles: ['super_admin', 'admin', 'operator'] },
      { path: '/BackofficeTransactions', icon: Package, label: 'Transactions', roles: ['super_admin', 'admin', 'operator'] },
    ]
  },
  {
    section: 'SÉCURITÉ',
    items: [
      { path: '/BackofficeRoles', icon: ShieldCheck, label: 'Rôles & Permissions', roles: ['super_admin'] },
      { path: '/BackofficeLogs', icon: FileText, label: 'Audit & Logs', roles: ['super_admin', 'admin'] },
      { path: '/BackofficeAlerts', icon: AlertTriangle, label: 'Alertes', roles: ['super_admin', 'admin'] },
    ]
  },
  {
    section: 'SYSTÈME',
    items: [
      { path: '/BackofficeSettings', icon: Settings, label: 'Paramètres', roles: ['super_admin'] },
    ]
  }
];

const ROLE_CONFIG = {
  super_admin: { label: 'Super Admin', color: 'bg-red-500', icon: '🔴' },
  admin: { label: 'Admin', color: 'bg-orange-500', icon: '🟠' },
  operator: { label: 'Opérateur', color: 'bg-blue-500', icon: '🔵' },
};

export default function BackofficeLayout({ children, currentPage }) {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => base44.auth.redirectToLogin());
  }, []);

  const { data: notifications = [] } = useQuery({
    queryKey: ['backoffice-notifs', user?.email],
    queryFn: () => base44.entities.Notification.filter({ user_email: user.email, is_read: false }),
    enabled: !!user,
    refetchInterval: 15000
  });

  const userRole = user?.backoffice_role || user?.role || 'operator';
  const roleConfig = ROLE_CONFIG[userRole] || ROLE_CONFIG.operator;

  const filteredNav = NAV_ITEMS.map(section => ({
    ...section,
    items: section.items.filter(item => item.roles.includes(userRole))
  })).filter(section => section.items.length > 0);

  return (
    <div className={cn("flex h-screen overflow-hidden", darkMode ? "dark bg-gray-950" : "bg-gray-50")}>
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 left-0 z-50 md:relative md:flex flex-col w-64 bg-gray-900 shadow-2xl"
          >
            {/* Logo */}
            <div className="flex items-center justify-between p-5 border-b border-gray-700/50">
              <Link to="/AdminBackoffice" className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">CHICHARD</p>
                  <p className="text-gray-400 text-[10px] uppercase tracking-wider">Backoffice</p>
                </div>
              </Link>
              <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User badge */}
            <div className="px-4 py-3 border-b border-gray-700/50">
              <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-800">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{user?.full_name || 'Utilisateur'}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className={cn("w-2 h-2 rounded-full inline-block", roleConfig.color)} />
                    <span className="text-gray-400 text-xs">{roleConfig.label}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto py-4 space-y-6 px-3">
              {filteredNav.map((section) => (
                <div key={section.section}>
                  <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-widest px-2 mb-2">
                    {section.section}
                  </p>
                  <ul className="space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;
                      return (
                        <li key={item.path}>
                          <Link
                            to={item.path}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group",
                              isActive
                                ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/40"
                                : "text-gray-400 hover:text-white hover:bg-gray-800"
                            )}
                          >
                            <Icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-white" : "group-hover:text-indigo-400")} />
                            <span className="font-medium">{item.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-gray-700/50">
              <button
                onClick={() => base44.auth.logout()}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg text-sm transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Déconnexion</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 px-4 md:px-6 h-14 flex items-center justify-between flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
              <Menu className="w-5 h-5" />
            </button>
            {/* Breadcrumb */}
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
              <span>Backoffice</span>
              <span>/</span>
              <span className="text-gray-900 font-medium">{currentPage || 'Dashboard'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="hidden md:flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5 w-56">
              <Search className="w-4 h-4 text-gray-400" />
              <input placeholder="Recherche rapide..." className="bg-transparent text-sm outline-none w-full text-gray-600 placeholder-gray-400" />
            </div>

            {/* Dark mode */}
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button onClick={() => setNotifOpen(!notifOpen)} className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 mt-1 w-80 bg-white shadow-xl border border-gray-100 rounded-xl z-50 overflow-hidden"
                  >
                    <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
                      <span className="font-semibold text-sm">Notifications</span>
                      <Badge className="bg-red-500 text-white text-xs">{notifications.length}</Badge>
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y">
                      {notifications.length === 0 ? (
                        <p className="text-center text-gray-400 text-sm py-6">Aucune notification</p>
                      ) : notifications.slice(0, 5).map((n) => (
                        <div key={n.id} className="p-3 hover:bg-gray-50">
                          <p className="text-sm font-medium text-gray-800">{n.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User avatar */}
            <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold cursor-pointer">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
          {children}
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}