import React from 'react';

/**
 * Marque Chichard : le sac et les mains de la charte, dans une pastille
 * arrondie. Un seul endroit pour le logo, réutilisé par les en-têtes, le pied
 * de page et les espaces professionnels. Purement décoratif : le nom
 * « CHICHARD » l'accompagne en toutes lettres, donc l'image est masquée aux
 * lecteurs d'écran.
 */
export default function BrandMark({ className = 'w-9 h-9 rounded-xl' }) {
  return (
    <span className={`overflow-hidden grid place-items-center shrink-0 bg-gold-400 ${className}`}>
      <img src="/logo-mark.png" alt="" aria-hidden="true" className="w-full h-full object-cover" />
    </span>
  );
}
