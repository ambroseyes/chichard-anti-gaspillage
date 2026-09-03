import { Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';

/** Gabarit commun aux écrans de connexion, d'inscription et de mot de passe. */
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-10">
      <Link to="/" className="flex items-center gap-2 mb-8">
        <div className="w-11 h-11 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center">
          <Leaf className="w-6 h-6 text-white" />
        </div>
        <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          CHICHARD
        </span>
      </Link>

      <div className="w-full max-w-sm bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>

      {footer && <div className="mt-6 text-sm text-gray-500">{footer}</div>}
    </div>
  );
}
