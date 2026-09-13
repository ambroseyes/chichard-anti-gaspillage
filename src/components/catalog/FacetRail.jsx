import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatXAF } from '@/lib/format';
import { CATEGORY_EMOJI } from '@/lib/constants';

const SHOWN_BY_DEFAULT = 6;

/**
 * Rail de facettes.
 *
 * Chaque case porte le nombre de produits qu'elle ajouterait. Ces nombres
 * viennent du serveur, calculés en écartant la facette elle-même : cocher une
 * marque ne met pas les autres à zéro, sinon on ne pourrait jamais en
 * sélectionner deux.
 */
export default function FacetRail({ facets, criteria, update, toggle, reset, activeFilterCount }) {
  if (!facets) return <RailSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Filtrer</h2>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={reset} className="h-auto py-1 text-xs text-gray-500">
            Tout effacer
          </Button>
        )}
      </div>

      <FacetGroup title="Rayons">
        <CheckList
          options={facets.categories}
          selected={criteria.category}
          onToggle={(value) => toggle('category', value)}
          renderPrefix={(option) => <span aria-hidden="true">{CATEGORY_EMOJI[option.value] ?? '🛒'}</span>}
        />
      </FacetGroup>

      <FacetGroup title="Date limite">
        <ul className="space-y-1">
          <li>
            <RadioRow
              label="Toutes les dates"
              checked={!criteria.expires}
              onSelect={() => update({ expires: '' })}
            />
          </li>
          {facets.expiration.map((bucket) => (
            <li key={bucket.value}>
              <RadioRow
                label={bucket.label}
                count={bucket.count}
                urgent={bucket.value === 'today'}
                checked={criteria.expires === bucket.value}
                onSelect={() => update({ expires: bucket.value })}
              />
            </li>
          ))}
        </ul>
      </FacetGroup>

      <FacetGroup title="Prix">
        <p className="text-xs text-gray-500 mb-2">
          De {formatXAF(facets.price.min)} à {formatXAF(facets.price.max)}
        </p>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Min"
            aria-label="Prix minimum en francs CFA"
            value={criteria.price_min}
            onChange={(event) => update({ price_min: event.target.value })}
            className="h-9"
          />
          <span className="text-gray-400">–</span>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Max"
            aria-label="Prix maximum en francs CFA"
            value={criteria.price_max}
            onChange={(event) => update({ price_max: event.target.value })}
            className="h-9"
          />
        </div>
      </FacetGroup>

      {facets.brands.length > 0 && (
        <FacetGroup title="Marques">
          <CheckList
            options={facets.brands}
            selected={criteria.brand}
            onToggle={(value) => toggle('brand', value)}
          />
        </FacetGroup>
      )}

      {facets.stores.length > 1 && (
        <FacetGroup title="Boutiques">
          <CheckList
            options={facets.stores}
            selected={criteria.store}
            onToggle={(value) => toggle('store', value)}
          />
        </FacetGroup>
      )}

      <FacetGroup title="Avis clients">
        <ul className="space-y-1">
          {[4, 3].map((note) => (
            <li key={note}>
              <RadioRow
                checked={criteria.min_rating === String(note)}
                onSelect={() =>
                  update({ min_rating: criteria.min_rating === String(note) ? '' : String(note) })
                }
                label={
                  <span className="flex items-center gap-1">
                    <Stars value={note} />
                    <span className="text-gray-500">et plus</span>
                  </span>
                }
              />
            </li>
          ))}
        </ul>
      </FacetGroup>

      <FacetGroup title="Garanties">
        <label className="flex items-center gap-2 py-1 text-sm text-gray-700 cursor-pointer">
          <Checkbox
            checked={criteria.verified}
            onCheckedChange={(checked) => update({ verified: Boolean(checked) })}
          />
          Produits vérifiés par la boutique
        </label>
      </FacetGroup>
    </div>
  );
}

function FacetGroup({ title, children }) {
  return (
    <section className="border-t border-gray-100 pt-4 first-of-type:border-t-0 first-of-type:pt-0">
      <h3 className="text-sm font-semibold text-gray-900 mb-2">{title}</h3>
      {children}
    </section>
  );
}

/** Liste à cocher, repliée au-delà de six entrées pour rester lisible. */
function CheckList({ options, selected, onToggle, renderPrefix }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? options : options.slice(0, SHOWN_BY_DEFAULT);

  return (
    <>
      <ul className="space-y-1">
        {visible.map((option) => (
          <li key={option.value}>
            <label className="flex items-center gap-2 py-1 text-sm cursor-pointer group">
              <Checkbox
                checked={selected.includes(option.value)}
                onCheckedChange={() => onToggle(option.value)}
              />
              {renderPrefix?.(option)}
              <span className="flex-1 text-gray-700 group-hover:text-gray-900 truncate">
                {option.label}
              </span>
              <span className="text-xs text-gray-400 tabular-nums">{option.count}</span>
            </label>
          </li>
        ))}
      </ul>
      {options.length > SHOWN_BY_DEFAULT && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-1 text-xs font-medium text-emerald-700 hover:underline"
        >
          {expanded ? 'Voir moins' : `Voir les ${options.length} entrées`}
        </button>
      )}
    </>
  );
}

function RadioRow({ label, count, checked, onSelect, urgent = false }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={checked}
      className={`w-full flex items-center gap-2 py-1 text-sm text-left rounded ${
        checked ? 'text-emerald-700 font-medium' : 'text-gray-700 hover:text-gray-900'
      }`}
    >
      <span
        className={`w-4 h-4 rounded-full border shrink-0 grid place-items-center ${
          checked ? 'border-emerald-600' : 'border-gray-300'
        }`}
        aria-hidden="true"
      >
        {checked && <span className="w-2 h-2 rounded-full bg-emerald-600" />}
      </span>
      <span className={`flex-1 ${urgent ? 'text-orange-600' : ''}`}>{label}</span>
      {count !== undefined && <span className="text-xs text-gray-400 tabular-nums">{count}</span>}
    </button>
  );
}

function Stars({ value }) {
  return (
    <span className="flex items-center" aria-label={`${value} étoiles et plus`}>
      {[1, 2, 3, 4, 5].map((index) => (
        <Star
          key={index}
          className={`w-3.5 h-3.5 ${index <= value ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

function RailSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      {[0, 1, 2].map((group) => (
        <div key={group} className="space-y-2">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          {[0, 1, 2, 3].map((row) => (
            <div key={row} className="h-4 w-full bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  );
}
