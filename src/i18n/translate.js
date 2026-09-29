import { DICTIONARY } from './dictionary';

/** Langues offertes. Le français est la langue par défaut et la source. */
export const LANGS = Object.freeze(['fr', 'en']);
export const DEFAULT_LANG = 'fr';

/**
 * Traduction par chaîne source.
 *
 * La clé, c'est le texte français lui-même. En français, `t(x)` renvoie `x` :
 * aucune table à tenir, aucune clé à inventer, et le code reste lisible tel
 * quel. En anglais, on cherche la traduction ; si elle manque, on retombe sur
 * le français — jamais sur une clé technique affichée à l'écran.
 *
 * Interpolation : les gabarits portent des jetons `{nom}`, remplacés après la
 * traduction. Exemple : `t('{n} produits', { n: 5 })`.
 */
export function translate(lang, text, params) {
  let out = text ?? '';
  if (lang && lang !== DEFAULT_LANG) {
    const traduit = DICTIONARY[out];
    if (traduit != null) {
      out = traduit;
    } else if (import.meta.env?.DEV && out.trim()) {
      signalerManque(out);
    }
  }
  if (params) {
    out = out.replace(/\{(\w+)\}/g, (_, clé) =>
      params[clé] == null ? `{${clé}}` : String(params[clé]),
    );
  }
  return out;
}

/* Une seule alerte par chaîne manquante, pour repérer les trous sans noyer la
   console. Muet en production. */
const déjàSignalé = new Set();
function signalerManque(texte) {
  if (déjàSignalé.has(texte)) return;
  déjàSignalé.add(texte);
  // eslint-disable-next-line no-console
  console.warn(`[i18n] traduction anglaise manquante : « ${texte} »`);
}
