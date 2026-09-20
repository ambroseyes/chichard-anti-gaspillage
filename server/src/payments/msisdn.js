import { badRequest } from '../lib/errors.js';

/**
 * Mise au format MSISDN des numéros camerounais.
 *
 * Les opérateurs attendent un numéro international sans « + » :
 * `237` suivi des neuf chiffres. Le tunnel de commande, lui, demande un
 * numéro local au format « 6XX XX XX XX ». Envoyé tel quel, ce numéro est
 * refusé : c'est tout le paiement mobile qui échouait.
 */

/** Indicatif pays du Cameroun. */
const INDICATIF = '237';

/**
 * Longueur d'un numéro national camerounais. Les mobiles sont passés à neuf
 * chiffres en 2016 ; les numéros à huit chiffres ne sont plus attribués.
 */
const LONGUEUR_NATIONALE = 9;

/** Préfixes mobiles en service : MTN et Orange émettent en 6. */
const PRÉFIXES_MOBILES = ['6'];

/**
 * Réduit une saisie à ses chiffres, en traitant les formes d'appel
 * international : « +237… », « 00237… », « (237) … ».
 */
function chiffres(saisie) {
  const brut = String(saisie ?? '').trim();
  if (!brut) return '';

  const seulementChiffres = brut.replace(/\D/g, '');
  // « 00 » en tête est un préfixe de sortie internationale, pas le numéro.
  return seulementChiffres.startsWith('00') ? seulementChiffres.slice(2) : seulementChiffres;
}

/**
 * Rend le numéro au format attendu par les opérateurs, ou `null` si la saisie
 * ne peut pas être un numéro mobile camerounais.
 *
 *   toMsisdn('699 11 22 33')   → '237699112233'
 *   toMsisdn('+237699112233')  → '237699112233'
 *   toMsisdn('00237699112233') → '237699112233'
 *   toMsisdn('237699112233')   → '237699112233'
 *   toMsisdn('12345')          → null
 */
export function toMsisdn(saisie) {
  const valeur = chiffres(saisie);
  if (!valeur) return null;

  const national = valeur.startsWith(INDICATIF) ? valeur.slice(INDICATIF.length) : valeur;

  if (national.length !== LONGUEUR_NATIONALE) return null;
  if (!PRÉFIXES_MOBILES.some((préfixe) => national.startsWith(préfixe))) return null;

  return `${INDICATIF}${national}`;
}

/** Vrai si la saisie peut être jointe par un opérateur de paiement mobile. */
export const isMobileMoneyNumber = (saisie) => toMsisdn(saisie) !== null;

/**
 * Comme `toMsisdn`, mais refuse au lieu de rendre `null`. À utiliser au bord
 * de l'API : mieux vaut un refus explicite à la commande qu'un paiement
 * silencieusement rejeté par l'opérateur une seconde plus tard.
 */
export function requireMsisdn(saisie) {
  const msisdn = toMsisdn(saisie);
  if (!msisdn) {
    throw badRequest(
      "Numéro de téléphone invalide : indiquez un mobile camerounais, par exemple 6 99 11 22 33.",
    );
  }
  return msisdn;
}

/** Forme lisible pour l'affichage : « +237 6 99 11 22 33 ». */
export function formatMsisdn(saisie) {
  const msisdn = toMsisdn(saisie);
  if (!msisdn) return String(saisie ?? '');
  const national = msisdn.slice(INDICATIF.length);
  return `+${INDICATIF} ${national[0]} ${national.slice(1).replace(/(\d{2})(?=\d)/g, '$1 ')}`;
}
