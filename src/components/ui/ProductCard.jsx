import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, MapPin, ShieldCheck, ShoppingCart, Star } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { formatXAF, daysUntil, expiryLabel, unitPrice } from '@/lib/format';
import { CATEGORY_EMOJI } from '@/lib/constants';

/**
 * Carte produit.
 *
 * Elle porte ce qu'il faut pour décider sans ouvrir la fiche : le prix, ce
 * qu'on économise, le prix au kilo pour comparer, la date limite, la boutique
 * et l'avis des clients.
 */
export default function ProductCard({ product, onAddToCart, variant = 'grid' }) {
  const days = daysUntil(product.expiration_date);
  const urgency = urgencyStyle(days);
  const perUnit = unitPrice(product);
  const savings = Math.max(0, (product.original_price ?? 0) - (product.discounted_price ?? 0));
  const discount = product.discount_percent ?? percentOf(product);
  const href = createPageUrl(`ProductDetail?id=${product.id}`);
  const horizontal = variant === 'list';

  return (
    <article
      className={`bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-emerald-300 hover:shadow-md transition-all group flex ${
        horizontal ? 'flex-row' : 'flex-col'
      }`}
    >
      <Link
        to={href}
        className={`relative bg-gray-50 shrink-0 ${horizontal ? 'w-40 sm:w-48' : 'aspect-square'}`}
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
          />
        ) : (
          <span className="w-full h-full grid place-items-center text-5xl bg-gradient-to-br from-gray-50 to-gray-100" aria-hidden="true">
            {CATEGORY_EMOJI[product.category] ?? '🛒'}
          </span>
        )}

        {discount > 0 && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-orange-500 text-white text-xs font-bold shadow-sm">
            −{discount}%
          </span>
        )}

        <span
          className={`absolute bottom-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${urgency.className}`}
        >
          <Clock className="w-3 h-3" aria-hidden="true" />
          {expiryLabel(product.expiration_date)}
        </span>

        {product.is_verified && (
          <span
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/95 grid place-items-center shadow-sm"
            title="Date limite vérifiée par la boutique"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
            <span className="sr-only">Produit vérifié</span>
          </span>
        )}
      </Link>

      <div className={`p-3 flex flex-col flex-1 min-w-0 ${horizontal ? 'gap-1' : ''}`}>
        {product.brand && (
          <p className="text-[11px] uppercase tracking-wide text-gray-400 truncate">{product.brand}</p>
        )}

        <h3 className="font-medium text-gray-900 text-sm leading-snug line-clamp-2">
          <Link to={href} className="hover:text-emerald-700">
            {product.name}
          </Link>
        </h3>

        {product.reviews_count > 0 && (
          <p className="flex items-center gap-1 mt-1">
            <Rating value={product.avg_rating} />
            <span className="text-[11px] text-gray-500">({product.reviews_count})</span>
          </p>
        )}

        <p className="flex items-center gap-1 text-[11px] text-gray-500 mt-1 truncate">
          <MapPin className="w-3 h-3 shrink-0" aria-hidden="true" />
          <span className="truncate">{product.store_name}</span>
        </p>

        <div className="mt-auto pt-2">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-gray-900">
              {formatXAF(product.discounted_price)}
            </span>
            {savings > 0 && (
              <span className="text-xs text-gray-400 line-through">
                {formatXAF(product.original_price)}
              </span>
            )}
          </div>

          <p className="text-[11px] text-gray-500 h-4">
            {perUnit ? perUnit.label : savings > 0 ? `Vous économisez ${formatXAF(savings)}` : ''}
          </p>

          <button
            type="button"
            onClick={() => onAddToCart?.(product)}
            className="mt-2 w-full h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <ShoppingCart className="w-4 h-4" aria-hidden="true" />
            Ajouter
            <span className="sr-only">{product.name} au panier</span>
          </button>
        </div>
      </div>
    </article>
  );
}

function Rating({ value = 0 }) {
  const rounded = Math.round(Number(value) || 0);
  return (
    <span className="flex items-center" aria-label={`Noté ${rounded} sur 5`}>
      {[1, 2, 3, 4, 5].map((index) => (
        <Star
          key={index}
          className={`w-3 h-3 ${index <= rounded ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

/** La couleur suit l'urgence réelle, pas une échelle décorative. */
function urgencyStyle(days) {
  if (days === null) return { className: 'bg-gray-100 text-gray-600' };
  if (days <= 0) return { className: 'bg-red-600 text-white' };
  if (days <= 2) return { className: 'bg-orange-500 text-white' };
  if (days <= 5) return { className: 'bg-amber-100 text-amber-800' };
  return { className: 'bg-white/90 text-gray-700' };
}

function percentOf(product) {
  const original = Number(product.original_price);
  const discounted = Number(product.discounted_price);
  if (!original || original <= 0) return 0;
  return Math.max(0, Math.round((1 - discounted / original) * 100));
}
