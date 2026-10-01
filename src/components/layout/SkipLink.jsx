import React from 'react';
import { useT } from '@/i18n/LanguageContext';

/**
 * Lien d'évitement.
 *
 * Premier élément focusable de la page : au clavier, il permet de sauter la
 * navigation et d'aller droit au contenu. Invisible tant qu'il n'a pas le
 * focus, bien visible dès qu'on y arrive.
 */
export default function SkipLink({ target = '#contenu-principal' }) {
  const t = useT();
  return (
    <a
      href={target}
      className="sr-only focus:not-sr-only focus:fixed focus:z-[100] focus:top-3 focus:left-3 focus:px-4 focus:py-2 focus:rounded-md focus:bg-white focus:text-emerald-700 focus:font-semibold focus:shadow-lg focus:ring-2 focus:ring-emerald-600"
    >
      {t('Aller au contenu')}
    </a>
  );
}
