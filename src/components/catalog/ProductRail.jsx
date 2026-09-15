import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api';
import ProductCard from '@/components/ui/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Rangée thématique de produits.
 *
 * Chaque rangée demande sa propre sélection au serveur. L'accueil ne
 * télécharge donc pas un gros paquet de produits pour en trier trois
 * catégories dans le navigateur : il demande exactement ce qu'il affiche.
 */
export default function ProductRail({ title, subtitle, criteria, seeAllTo, onAddToCart, limit = 6 }) {
  const { data, isLoading } = useQuery({
    queryKey: ['catalog-rail', criteria],
    // `facets: false` : cette rangée n'affiche que des produits. Réclamer les
    // décomptes de facettes lui coûterait huit requêtes d'agrégation que rien
    // n'affiche — et l'accueil en aligne trois.
    queryFn: () => api.catalog.search({ ...criteria, per_page: limit, facets: 0 }),
    staleTime: 60_000,
  });

  const items = data?.items ?? [];
  if (!isLoading && items.length === 0) return null;

  return (
    <section>
      <div className="flex items-end justify-between gap-4 mb-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        {seeAllTo && (
          <Link
            to={seeAllTo}
            className="flex items-center gap-1 text-sm font-medium text-emerald-700 hover:underline shrink-0"
          >
            Voir tout
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {Array.from({ length: limit }).map((_, index) => (
            <Skeleton key={index} className="h-72 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
          ))}
        </div>
      )}
    </section>
  );
}
