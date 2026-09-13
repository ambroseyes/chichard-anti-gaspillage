import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { createPageUrl } from '@/utils';

/**
 * Fil d'Ariane.
 *
 * `trail` : `[{ label, to }]`. Le dernier maillon n'est pas cliquable — c'est
 * la page courante, et un lien vers soi-même désoriente autant qu'il n'aide.
 */
export default function Breadcrumbs({ trail = [], className = '' }) {
  return (
    <nav aria-label="Fil d'Ariane" className={`text-sm ${className}`}>
      <ol className="flex items-center gap-1 flex-wrap text-gray-500">
        <li className="flex items-center gap-1">
          <Link to={createPageUrl('Home')} className="hover:text-emerald-700 flex items-center gap-1">
            <Home className="w-3.5 h-3.5" />
            <span className="sr-only sm:not-sr-only">Accueil</span>
          </Link>
        </li>
        {trail.map((step, index) => {
          const last = index === trail.length - 1;
          return (
            <li key={`${step.label}-${index}`} className="flex items-center gap-1 min-w-0">
              <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" aria-hidden="true" />
              {last || !step.to ? (
                <span className="text-gray-900 font-medium truncate" aria-current={last ? 'page' : undefined}>
                  {step.label}
                </span>
              ) : (
                <Link to={step.to} className="hover:text-emerald-700 truncate">
                  {step.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
