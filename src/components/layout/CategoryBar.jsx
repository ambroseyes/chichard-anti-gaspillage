import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Flame, LayoutGrid, Sparkles, Store, Truck } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { PRODUCT_CATEGORIES } from '@/lib/constants';

const catalogLink = (params) => createPageUrl(`Catalog?${new URLSearchParams(params).toString()}`);

/** Rayons mis en avant directement dans la barre — les autres sont dans le panneau. */
const FEATURED = PRODUCT_CATEGORIES.slice(0, 6);

const SHORTCUTS = [
  { label: "Expire aujourd'hui", to: catalogLink({ expires: 'today' }), icon: Flame, accent: true },
  { label: 'Meilleures remises', to: catalogLink({ sort: 'discount' }), icon: Sparkles },
  { label: 'Click & Collect', to: createPageUrl('ClickCollect'), icon: Store },
  { label: 'Suivi de commande', to: createPageUrl('Orders'), icon: Truck },
];

/**
 * Barre des rayons, avec le panneau « Tous les rayons ».
 *
 * C'est la colonne vertébrale d'un site marchand : on doit pouvoir atteindre
 * n'importe quel rayon depuis n'importe quelle page, sans repasser par
 * l'accueil.
 */
export default function CategoryBar() {
  const [open, setOpen] = useState(false);
  const container = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!container.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={container} className="relative border-t border-gray-100 bg-white">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="flex items-center gap-1 h-11 overflow-x-auto scrollbar-hide">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="panneau-rayons"
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-600 text-white text-sm font-semibold whitespace-nowrap hover:bg-emerald-700 transition-colors"
          >
            <LayoutGrid className="w-4 h-4" />
            Tous les rayons
            <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>

          <span className="w-px h-5 bg-gray-200 mx-1 shrink-0" aria-hidden="true" />

          {FEATURED.map((category) => (
            <Link
              key={category.id}
              to={catalogLink({ category: category.id })}
              className="px-3 py-1.5 text-sm text-gray-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-md whitespace-nowrap transition-colors"
            >
              {category.label}
            </Link>
          ))}

          <span className="flex-1" />

          {SHORTCUTS.map((shortcut) => {
            const Icon = shortcut.icon;
            return (
              <Link
                key={shortcut.label}
                to={shortcut.to}
                className={`hidden xl:flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md whitespace-nowrap transition-colors ${
                  shortcut.accent
                    ? 'text-orange-700 font-semibold hover:bg-orange-50'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {shortcut.label}
              </Link>
            );
          })}
        </div>
      </div>

      {open && (
        <div
          id="panneau-rayons"
          className="absolute inset-x-0 top-full bg-white border-t border-gray-100 shadow-xl z-40"
        >
          <nav
            aria-label="Tous les rayons"
            className="max-w-7xl mx-auto px-4 lg:px-6 py-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2"
          >
            {PRODUCT_CATEGORIES.map((category) => (
              <Link
                key={category.id}
                to={catalogLink({ category: category.id })}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-emerald-50 group"
              >
                <span className="text-xl" aria-hidden="true">
                  {category.emoji}
                </span>
                <span className="text-sm text-gray-700 group-hover:text-emerald-700 font-medium">
                  {category.label}
                </span>
              </Link>
            ))}
          </nav>

          <div className="border-t border-gray-100 bg-gray-50/70">
            <div className="max-w-7xl mx-auto px-4 lg:px-6 py-3 flex flex-wrap gap-2">
              {SHORTCUTS.map((shortcut) => (
                <Link
                  key={shortcut.label}
                  to={shortcut.to}
                  onClick={() => setOpen(false)}
                  className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-full text-gray-700 hover:border-emerald-300 hover:text-emerald-700"
                >
                  {shortcut.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
