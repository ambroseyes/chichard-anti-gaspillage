import React from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  BarChart3,
  Heart,
  LogOut,
  Package,
  Settings,
  ShieldCheck,
  Truck,
  User,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/lib/AuthContext';

const CLIENT_LINKS = [
  { name: 'MyAccount', label: 'Mon compte', icon: User },
  { name: 'Orders', label: 'Mes commandes', icon: Package },
  { name: 'ProductPreferences', label: 'Mes favoris', icon: Heart },
  { name: 'LoyaltyProgram', label: 'Mes points fidélité', icon: Award },
  { name: 'Settings', label: 'Paramètres', icon: Settings },
];

/**
 * Menu du compte.
 *
 * Les espaces professionnels n'apparaissent que si le compte les porte. C'est
 * du confort d'affichage : c'est le serveur qui refuse l'accès, pas ce menu.
 */
export default function AccountMenu() {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild className="text-gray-700">
          <Link to="/connexion">Connexion</Link>
        </Button>
        <Button size="sm" asChild className="bg-emerald-600 hover:bg-emerald-700">
          <Link to="/inscription">Créer un compte</Link>
        </Button>
      </div>
    );
  }

  const professional = [
    user.is_partner && { name: 'PartnerDashboard', label: 'Espace partenaire', icon: BarChart3 },
    user.is_delivery_driver && { name: 'DriverDashboard', label: 'Espace livreur', icon: Truck },
    user.backoffice_role && { name: 'AdminBackoffice', label: 'Backoffice', icon: ShieldCheck },
  ].filter(Boolean);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-50 text-left"
        >
          <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 grid place-items-center text-sm font-semibold shrink-0">
            {(user.full_name || user.email).charAt(0).toUpperCase()}
          </span>
          <span className="hidden lg:block leading-tight">
            <span className="block text-[11px] text-gray-500">Bonjour</span>
            <span className="block text-sm font-medium text-gray-900 max-w-[10rem] truncate">
              {user.full_name || user.email}
            </span>
          </span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <span className="block text-sm font-medium">{user.full_name || 'Mon compte'}</span>
          <span className="block text-xs text-gray-500 truncate">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {CLIENT_LINKS.map((link) => (
          <DropdownMenuItem key={link.name} asChild>
            <Link to={createPageUrl(link.name)} className="cursor-pointer">
              <link.icon className="w-4 h-4 mr-2 text-gray-400" />
              {link.label}
            </Link>
          </DropdownMenuItem>
        ))}

        {professional.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-gray-400 font-normal">
              Espaces professionnels
            </DropdownMenuLabel>
            {professional.map((link) => (
              <DropdownMenuItem key={link.name} asChild>
                <Link to={createPageUrl(link.name)} className="cursor-pointer">
                  <link.icon className="w-4 h-4 mr-2 text-gray-400" />
                  {link.label}
                </Link>
              </DropdownMenuItem>
            ))}
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600 focus:text-red-600">
          <LogOut className="w-4 h-4 mr-2" />
          Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
