import React, { useEffect, useState } from 'react';
import { CATEGORY_EMOJI, CATEGORY_LABEL, CATEGORY_TINT } from '@/lib/constants';

/**
 * Vignette d'un produit.
 *
 * Un seul endroit pour deux réponses qui traînaient dispersées et incomplètes
 * dans une douzaine d'écrans :
 *
 *  1. Pas de photo → une tuile teintée par rayon plutôt qu'un émoji nu sur du
 *     gris. La couleur donne au catalogue un rythme visuel même sans photos,
 *     et sépare les rayons d'un coup d'œil.
 *
 *  2. Une `image_url` cassée (404, lien mort) affichait partout l'icône
 *     d'image brisée du navigateur. Ici, `onError` bascule sur la même tuile :
 *     l'écran ne montre jamais de vignette rompue.
 *
 * `sizes`/`loading` sont transmis pour les grilles ; par défaut l'image est
 * chargée paresseusement.
 */
export default function ProductThumbnail({
  product,
  className = '',
  emojiClassName = 'text-5xl',
  showLabel = false,
  loading = 'lazy',
  sizes,
}) {
  const [cassée, setCassée] = useState(false);

  // Un produit peut changer sous une même vignette (liste virtualisée,
  // pagination) : on réarme la détection quand l'URL change.
  useEffect(() => setCassée(false), [product?.image_url]);

  const tint = CATEGORY_TINT[product?.category] ?? 'from-gray-50 to-gray-100 text-gray-500';
  const emoji = CATEGORY_EMOJI[product?.category] ?? '🛒';
  const montrerPhoto = product?.image_url && !cassée;

  if (montrerPhoto) {
    return (
      <img
        src={product.image_url}
        alt={product.name ?? ''}
        loading={loading}
        sizes={sizes}
        onError={() => setCassée(true)}
        className={`w-full h-full object-cover ${className}`}
      />
    );
  }

  return (
    <span
      className={`w-full h-full grid place-items-center bg-gradient-to-br ${tint} ${className}`}
      role="img"
      aria-label={CATEGORY_LABEL[product?.category] ?? 'Produit'}
    >
      <span className="grid place-items-center gap-1 text-center px-2">
        <span className={emojiClassName} aria-hidden="true">
          {emoji}
        </span>
        {showLabel && CATEGORY_LABEL[product?.category] && (
          <span className="text-[11px] font-medium opacity-80">
            {CATEGORY_LABEL[product.category]}
          </span>
        )}
      </span>
    </span>
  );
}
