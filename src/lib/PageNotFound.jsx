import { Link, useLocation } from 'react-router-dom';
import { Home, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import { backofficeRoleOf } from '@/components/auth/RequireRole';

export default function PageNotFound() {
  const location = useLocation();
  const { user } = useAuth();
  const isBackoffice = backofficeRoleOf(user) !== 'none';

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <p className="text-7xl font-light text-gray-300">404</p>
          <div className="h-0.5 w-16 bg-gray-200 mx-auto" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-medium text-gray-900">Cette page n’existe pas</h1>
          <p className="text-sm text-gray-500">
            L’adresse <code className="px-1.5 py-0.5 bg-gray-100 rounded">{location.pathname}</code>{' '}
            ne correspond à aucune page de Chichard.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          <Button asChild className="bg-emerald-500 hover:bg-emerald-600">
            <Link to="/">
              <Home className="w-4 h-4 mr-2" />
              Accueil
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/Catalog">
              <Search className="w-4 h-4 mr-2" />
              Parcourir le catalogue
            </Link>
          </Button>
          {isBackoffice && (
            <Button asChild variant="ghost">
              <Link to="/AdminBackoffice">Backoffice</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
