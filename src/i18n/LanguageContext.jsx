import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { setDateLocale } from '@/lib/format';
import { DEFAULT_LANG, LANGS, translate } from './translate';

const STORAGE_KEY = 'chichard.lang';

const LanguageContext = createContext({
  lang: DEFAULT_LANG,
  setLang: () => {},
  t: (texte) => texte,
});

/** Langue initiale : le choix mémorisé, sinon la langue du navigateur. */
function langInitiale() {
  try {
    const mémorisée = localStorage.getItem(STORAGE_KEY);
    if (mémorisée && LANGS.includes(mémorisée)) return mémorisée;
  } catch {
    /* stockage indisponible (navigation privée) : on retombe plus bas */
  }
  if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('en')) {
    return 'en';
  }
  return DEFAULT_LANG;
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(langInitiale);

  // Le format des dates suit la langue, posé pendant le rendu pour que les
  // composants du même passage l'utilisent déjà (un effet arriverait un rendu
  // trop tard, laissant une date française sur un écran anglais).
  setDateLocale(lang);

  // L'attribut `lang` du document : c'est lui que lisent les lecteurs d'écran
  // et les correcteurs. Sans lui, une page anglaise resterait annoncée en
  // français.
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((valeur) => {
    if (!LANGS.includes(valeur)) return;
    setLangState(valeur);
    try {
      localStorage.setItem(STORAGE_KEY, valeur);
    } catch {
      /* le choix ne survivra pas au rechargement, sans conséquence sur la session */
    }
  }, []);

  const value = useMemo(
    () => ({
      lang,
      setLang,
      t: (texte, params) => translate(lang, texte, params),
    }),
    [lang, setLang],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

/** Contexte complet : langue courante, sélecteur, et `t`. */
export function useLanguage() {
  return useContext(LanguageContext);
}

/** Le cas courant : juste la fonction de traduction. */
export function useT() {
  return useContext(LanguageContext).t;
}
