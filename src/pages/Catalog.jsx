import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, LayoutGrid, List, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import ProductCard from '@/components/ui/ProductCard';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import ReassuranceStrip from '@/components/layout/ReassuranceStrip';
import FacetRail from '@/components/catalog/FacetRail';
import ActiveFilters from '@/components/catalog/ActiveFilters';
import Paginator from '@/components/catalog/Paginator';
import { useCatalogSearch } from '@/hooks/useCatalogSearch';
import { useCart } from '@/hooks/useCart';
import { createPageUrl } from '@/utils';
import { formatNumber } from '@/lib/format';
import { CATEGORY_LABEL } from '@/lib/constants';

/**
 * Page de résultats.
 *
 * Tout l'état tient dans l'URL et tout le calcul se fait côté serveur : la
 * page affiche ce que le serveur a compté, jamais une portion du catalogue
 * qu'elle aurait filtrée dans son coin.
 */
export default function Catalog() {
  const { criteria, update, toggle, reset, activeFilterCount, data, isLoading, isFetching, isError } =
    useCatalogSearch();
  const { addToCart } = useCart();
  const [layout, setLayout] = useState('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const facets = data?.facets;
  const items = data?.items ?? [];
  const pagination = data?.page;

  const rail = (
    <FacetRail
      facets={facets}
      criteria={criteria}
      update={update}
      toggle={toggle}
      reset={reset}
      activeFilterCount={activeFilterCount}
    />
  );

  return (
    <div className="bg-gray-50">
      <ReassuranceStrip />

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-5">
        <Breadcrumbs trail={breadcrumbTrail(criteria)} className="mb-4" />

        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0">
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">{headline(criteria)}</h1>
            <p className="text-sm text-gray-500 mt-0.5" aria-live="polite">
              {isLoading
                ? 'Recherche en cours…'
                : `${formatNumber(pagination?.total ?? 0)} produit${(pagination?.total ?? 0) > 1 ? 's' : ''} disponible${(pagination?.total ?? 0) > 1 ? 's' : ''}`}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center border border-gray-200 rounded-md overflow-hidden bg-white">
              <button
                type="button"
                onClick={() => setLayout('grid')}
                aria-pressed={layout === 'grid'}
                aria-label="Affichage en grille"
                className={`p-2 ${layout === 'grid' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-400'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setLayout('list')}
                aria-pressed={layout === 'list'}
                aria-label="Affichage en liste"
                className={`p-2 ${layout === 'list' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-400'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <span className="hidden sm:inline text-gray-500">Trier par</span>
              <select
                value={criteria.sort}
                onChange={(event) => update({ sort: event.target.value })}
                className="h-9 rounded-md border border-gray-200 bg-white px-2 text-sm text-gray-800"
                aria-label="Trier les résultats"
              >
                {(data?.sorts ?? [{ id: 'relevance', label: 'Pertinence' }]).map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden h-9 relative">
                  <SlidersHorizontal className="w-4 h-4 mr-1.5" />
                  Filtrer
                  {activeFilterCount > 0 && (
                    <span className="ml-1.5 px-1.5 rounded-full bg-emerald-600 text-white text-[11px]">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full sm:max-w-sm overflow-y-auto">
                <SheetHeader className="mb-4">
                  <SheetTitle>Filtrer les résultats</SheetTitle>
                </SheetHeader>
                {rail}
                <Button className="w-full mt-6 bg-emerald-600" onClick={() => setFiltersOpen(false)}>
                  Voir {formatNumber(pagination?.total ?? 0)} résultats
                </Button>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {activeFilterCount > 0 && (
          <div className="mb-4">
            <ActiveFilters
              criteria={criteria}
              facets={facets}
              update={update}
              toggle={toggle}
              reset={reset}
              count={activeFilterCount}
            />
          </div>
        )}

        <div className="flex gap-6">
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-40 bg-white rounded-xl border border-gray-200 p-4">{rail}</div>
          </aside>

          <div className="flex-1 min-w-0">
            {isError ? (
              <ErrorState />
            ) : isLoading ? (
              <ResultSkeleton />
            ) : items.length === 0 ? (
              <EmptyState criteria={criteria} reset={reset} hasFilters={activeFilterCount > 0} />
            ) : (
              <>
                <div
                  className={
                    layout === 'grid'
                      ? 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4'
                      : 'flex flex-col gap-3'
                  }
                  style={{ opacity: isFetching ? 0.6 : 1, transition: 'opacity 150ms' }}
                >
                  {items.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      variant={layout}
                      onAddToCart={addToCart}
                    />
                  ))}
                </div>

                <Paginator
                  page={pagination.number}
                  pages={pagination.pages}
                  onChange={(page) => {
                    update({ page }, { keepPage: true });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function headline({ q, category }) {
  if (q) return `Résultats pour « ${q} »`;
  if (category.length === 1) return CATEGORY_LABEL[category[0]] ?? 'Catalogue';
  return 'Tout le catalogue';
}

function breadcrumbTrail({ q, category }) {
  const trail = [{ label: 'Catalogue', to: createPageUrl('Catalog') }];
  if (category.length === 1) trail.push({ label: CATEGORY_LABEL[category[0]] ?? category[0] });
  else if (q) trail.push({ label: `« ${q} »` });
  return trail;
}

function ResultSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4" aria-hidden="true">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <Skeleton className="aspect-square rounded-none" />
          <div className="p-3 space-y-2">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ criteria, reset, hasFilters }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-gray-100 grid place-items-center mx-auto mb-4 text-2xl">
        🔍
      </div>
      <h2 className="font-semibold text-gray-900 mb-1">
        {criteria.q ? `Aucun résultat pour « ${criteria.q} »` : 'Aucun produit ne correspond'}
      </h2>
      <p className="text-sm text-gray-500 mb-5 max-w-md mx-auto">
        {hasFilters
          ? 'Essayez d’élargir vos filtres : la date limite et le prix sont les plus restrictifs.'
          : 'Le catalogue se renouvelle chaque jour, revenez dans quelques heures.'}
      </p>
      <div className="flex items-center justify-center gap-2">
        {hasFilters && (
          <Button variant="outline" onClick={reset}>
            Effacer les filtres
          </Button>
        )}
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
          <Link to={createPageUrl('Catalog')}>Voir tout le catalogue</Link>
        </Button>
      </div>
    </div>
  );
}

function ErrorState() {
  return (
    <div className="bg-white border border-red-200 rounded-xl py-12 px-6 text-center">
      <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
      <h2 className="font-semibold text-gray-900 mb-1">La recherche n'a pas abouti</h2>
      <p className="text-sm text-gray-500 mb-4">
        Le catalogue est momentanément injoignable. Réessayez dans un instant.
      </p>
      <Button onClick={() => window.location.reload()} variant="outline">
        Réessayer
      </Button>
    </div>
  );
}
