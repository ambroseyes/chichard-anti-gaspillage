import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { PageSpinner } from '@/components/ui/PageSpinner';

/** Rôle backoffice effectif : `admin` applicatif vaut `admin` backoffice. */
export function backofficeRoleOf(user) {
  if (!user) return 'none';
  if (user.backoffice_role && user.backoffice_role !== 'none') return user.backoffice_role;
  return user.role === 'admin' ? 'admin' : 'none';
}

const CHECKS = {
  authenticated: () => true,
  partner: (user) => user.is_partner || user.role === 'admin',
  driver: (user) => user.is_delivery_driver || user.role === 'admin',
  admin: (user) => user.role === 'admin',
  backoffice: (user) => backofficeRoleOf(user) !== 'none',
  backofficeAdmin: (user) => ['admin', 'super_admin'].includes(backofficeRoleOf(user)),
  superAdmin: (user) => backofficeRoleOf(user) === 'super_admin',
};

/**
 * Garde de route. Rien de la page protégée n'est monté tant que le droit n'est
 * pas établi : ni requête, ni rendu partiel.
 *
 * Cette garde sert l'expérience ; elle ne remplace pas le contrôle serveur, qui
 * reste la seule autorité (voir server/src/access/policies.js).
 */
export default function RequireRole({ role = 'authenticated', redirectTo = '/' }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) return <PageSpinner label="Vérification de vos accès…" />;

  if (!isAuthenticated) {
    return <Navigate to="/connexion" replace state={{ from: location.pathname }} />;
  }

  const check = CHECKS[role] ?? CHECKS.authenticated;
  if (!check(user)) return <Navigate to={redirectTo} replace />;

  return <Outlet />;
}
