import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { LANGS } from '@/i18n/translate';

const NOMS = { fr: 'FR', en: 'EN' };
const PLEINS = { fr: 'Français', en: 'Anglais' };

/**
 * Bascule de langue.
 *
 * Deux boutons plutôt qu'un menu déroulant : il n'y a que deux langues, et un
 * choix visible d'un coup vaut mieux qu'un choix caché derrière un clic. La
 * langue active est annoncée aux lecteurs d'écran via `aria-pressed`.
 */
export default function LanguageSwitcher({ className = '', tone = 'light' }) {
  const { lang, setLang, t } = useLanguage();

  const actif =
    tone === 'dark' ? 'bg-white/20 text-white' : 'bg-emerald-600 text-white';
  const inactif =
    tone === 'dark' ? 'text-emerald-100 hover:text-white' : 'text-gray-500 hover:text-gray-800';

  return (
    <div
      className={`inline-flex items-center gap-0.5 ${className}`}
      role="group"
      aria-label={t('Changer de langue')}
    >
      <Globe className="w-3.5 h-3.5 mr-1 opacity-70" aria-hidden="true" />
      {LANGS.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          aria-label={t(PLEINS[code])}
          className={`px-1.5 py-0.5 rounded text-xs font-semibold transition-colors ${
            lang === code ? actif : inactif
          }`}
        >
          {NOMS[code]}
        </button>
      ))}
    </div>
  );
}
