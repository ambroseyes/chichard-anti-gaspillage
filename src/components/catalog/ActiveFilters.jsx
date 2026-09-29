import React from 'react';
import { X } from 'lucide-react';
import { formatXAF } from '@/lib/format';
import { useT } from '@/i18n/LanguageContext';

/**
 * Rappel des filtres appliqués, chacun retirable d'un clic.
 *
 * Sans ce rappel, un visiteur qui arrive par un lien filtré croit voir tout le
 * catalogue et conclut que la boutique est vide.
 */
export default function ActiveFilters({ criteria, facets, update, toggle, reset, count }) {
  const t = useT();
  if (!count) return null;

  const labelFor = (group, value) =>
    facets?.[group]?.find((entry) => entry.value === value)?.label ?? value;

  const chips = [
    ...criteria.category.map((value) => ({
      key: `category-${value}`,
      label: t(labelFor('categories', value)),
      remove: () => toggle('category', value),
    })),
    ...criteria.brand.map((value) => ({
      key: `brand-${value}`,
      label: value,
      remove: () => toggle('brand', value),
    })),
    ...criteria.store.map((value) => ({
      key: `store-${value}`,
      label: value,
      remove: () => toggle('store', value),
    })),
    criteria.expires && {
      key: 'expires',
      label: t(labelFor('expiration', criteria.expires)),
      remove: () => update({ expires: '' }),
    },
    (criteria.price_min || criteria.price_max) && {
      key: 'price',
      label: priceLabel(criteria, t),
      remove: () => update({ price_min: '', price_max: '' }),
    },
    criteria.min_rating && {
      key: 'rating',
      label: t('{n} étoiles et plus', { n: criteria.min_rating }),
      remove: () => update({ min_rating: '' }),
    },
    criteria.verified && {
      key: 'verified',
      label: t('Produits vérifiés'),
      remove: () => update({ verified: false }),
    },
  ].filter(Boolean);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-gray-500">{t('Filtres')} :</span>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.remove}
          className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 hover:bg-emerald-100"
        >
          {chip.label}
          <X className="w-3 h-3" aria-hidden="true" />
          <span className="sr-only">{t('Retirer le filtre {label}', { label: chip.label })}</span>
        </button>
      ))}
      <button type="button" onClick={reset} className="text-xs text-gray-500 hover:text-gray-900 underline">
        {t('Tout effacer')}
      </button>
    </div>
  );
}

function priceLabel({ price_min: min, price_max: max }, t) {
  if (min && max) return `${formatXAF(min)} – ${formatXAF(max)}`;
  if (min) return t('À partir de {montant}', { montant: formatXAF(min) });
  return t('Jusqu\'à {montant}', { montant: formatXAF(max) });
}
