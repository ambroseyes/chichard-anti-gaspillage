import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { HelpCircle, X } from 'lucide-react';
import { routes, backofficeRoutes } from '@/routes';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PAGE_TOURS, WELCOME, roleOf } from './tourSteps';

/* Chemin → nom de page, lu dans la table des routes (source unique). */
const NAME_BY_PATH = new Map([...routes, ...backofficeRoutes].map((r) => [r.path, r.name]));
const pageFromPath = (pathname) => NAME_BY_PATH.get(pathname) ?? null;

const seenKey = (kind, email) => `chichard.tour.${kind}.${email || 'invite'}`;
const readSeen = (kind, email) => {
  try {
    return localStorage.getItem(seenKey(kind, email)) === '1';
  } catch {
    return false;
  }
};
const markSeen = (kind, email) => {
  try {
    localStorage.setItem(seenKey(kind, email), '1');
  } catch {
    /* stockage indisponible : le guide se reproposera, sans conséquence */
  }
};

const MARGIN = 12; // respiration autour de la cible mise en lumière

/**
 * Hôte des guides interactifs.
 *
 * Monté une fois pour toute l'application. Il déduit la page courante de
 * l'URL et le rôle de l'utilisateur, puis :
 *   — propose un mot de bienvenue à la première connexion ;
 *   — lance, une fois par page, le guide de cette page ;
 *   — laisse un bouton « ? » pour rejouer le guide à la demande.
 *
 * Chaque étape éclaire un élément réel et l'explique. Une cible absente est
 * sautée : le guide ne pointe jamais dans le vide.
 */
export default function TourHost() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lang } = useLanguage();
  const tr = useCallback((paire) => paire?.[lang] ?? paire?.fr ?? '', [lang]);

  const page = pageFromPath(location.pathname);
  const steps = useMemo(() => PAGE_TOURS[page] ?? [], [page]);
  const role = roleOf(user);
  const email = user?.email;

  const [welcome, setWelcome] = useState(false);
  const [running, setRunning] = useState(false);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState(null);
  // Page dont le guide doit démarrer dès qu'on y arrive (lancement explicite
  // depuis la bienvenue). Tant qu'elle est posée, aucune autre page ne se lance
  // automatiquement — on ne veut pas croiser deux guides.
  const [pending, setPending] = useState(null);

  // --- Bienvenue à la première connexion -----------------------------------
  useEffect(() => {
    if (!user) return;
    if (!readSeen('welcome', email)) setWelcome(true);
  }, [user, email]);

  const fermerBienvenue = () => {
    markSeen('welcome', email);
    setWelcome(false);
  };

  const lancerDepuisBienvenue = () => {
    markSeen('welcome', email);
    setWelcome(false);
    const cible = WELCOME[role]?.landing ?? page;
    setPending(cible); // le guide de cette page démarrera à l'arrivée
    if (cible !== page) navigate(createPageUrl(cible));
  };

  // --- Démarrage automatique du guide d'une page ---------------------------
  const étapesDisponibles = useCallback(
    () => steps.filter((s) => document.querySelector(s.target)),
    [steps],
  );

  const démarrer = useCallback(() => {
    if (!steps.length) return;
    setIndex(0);
    setRunning(true);
  }, [steps]);

  useEffect(() => {
    // Pas par-dessus la bienvenue, ni sur une page sans guide, ni deux fois.
    if (welcome || running || !steps.length) return undefined;

    // Un lancement explicite (bienvenue) vise une page précise : on ne démarre
    // que là, et on laisse les autres pages tranquilles tant qu'il est en cours.
    const cibleExplicite = pending === page;
    if (pending && !cibleExplicite) return undefined;
    if (!cibleExplicite && readSeen(`page.${page}`, email)) return undefined;

    let annulé = false;
    let essais = 0;
    const tenter = () => {
      if (annulé) return;
      if (étapesDisponibles().length) {
        if (cibleExplicite) setPending(null);
        démarrer();
      } else if (essais < 10) {
        essais += 1;
        setTimeout(tenter, 300); // la page se charge à la demande : on patiente
      } else if (cibleExplicite) {
        setPending(null); // cibles introuvables : on abandonne proprement
      }
    };
    const t = setTimeout(tenter, 500);
    return () => {
      annulé = true;
      clearTimeout(t);
    };
  }, [welcome, running, steps, page, email, pending, démarrer, étapesDisponibles]);

  // --- Position de la cible courante ---------------------------------------
  const visibles = useMemo(
    () => (running ? steps.filter((s) => document.querySelector(s.target)) : []),
    [running, steps, index], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const étape = visibles[index];

  const recalc = useCallback(() => {
    if (!étape) return;
    const el = document.querySelector(étape.target);
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [étape]);

  useLayoutEffect(() => {
    if (!running || !étape) return undefined;
    const el = document.querySelector(étape.target);
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    const id = setTimeout(recalc, 320); // après le défilement
    window.addEventListener('resize', recalc);
    window.addEventListener('scroll', recalc, true);
    return () => {
      clearTimeout(id);
      window.removeEventListener('resize', recalc);
      window.removeEventListener('scroll', recalc, true);
    };
  }, [running, étape, recalc]);

  const terminer = useCallback(() => {
    setRunning(false);
    setRect(null);
    markSeen(`page.${page}`, email);
  }, [page, email]);

  const suivant = () => {
    if (index + 1 < visibles.length) setIndex((i) => i + 1);
    else terminer();
  };
  const précédent = () => setIndex((i) => Math.max(0, i - 1));

  // Échap ferme le guide.
  useEffect(() => {
    if (!running) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') terminer();
      else if (e.key === 'ArrowRight') suivant();
      else if (e.key === 'ArrowLeft') précédent();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [running, index, visibles.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const rejouer = () => {
    setIndex(0);
    setRunning(true);
  };

  const wel = WELCOME[role];

  return (
    <>
      {/* Mot de bienvenue */}
      {user && wel && (
        <Dialog open={welcome} onOpenChange={(o) => !o && fermerBienvenue()}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{tr(wel.title)}</DialogTitle>
              <DialogDescription className="text-[15px] leading-relaxed pt-1">
                {tr(wel.body)}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="outline" onClick={fermerBienvenue}>
                {lang === 'en' ? 'Later' : 'Plus tard'}
              </Button>
              <Button onClick={lancerDepuisBienvenue} className="bg-emerald-600 hover:bg-emerald-700">
                {lang === 'en' ? 'Take the tour' : 'Faire le tour guidé'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Bouton « ? » pour rejouer le guide de la page */}
      {steps.length > 0 && !running && !welcome && (
        <button
          type="button"
          onClick={rejouer}
          aria-label={lang === 'en' ? 'Show the page guide' : 'Afficher le guide de la page'}
          className="fixed bottom-20 md:bottom-6 right-4 z-40 w-11 h-11 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg grid place-items-center"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      )}

      {/* Projecteur + infobulle */}
      {running && étape && rect &&
        createPortal(
          <TourOverlay
            rect={rect}
            title={tr(étape.title)}
            body={tr(étape.body)}
            index={index}
            total={visibles.length}
            lang={lang}
            onPrev={précédent}
            onNext={suivant}
            onClose={terminer}
          />,
          document.body,
        )}
    </>
  );
}

/** Voile sombre, trou de lumière sur la cible, et l'infobulle placée au mieux. */
function TourOverlay({ rect, title, body, index, total, lang, onPrev, onNext, onClose }) {
  const hole = {
    top: rect.top - MARGIN,
    left: rect.left - MARGIN,
    width: rect.width + MARGIN * 2,
    height: rect.height + MARGIN * 2,
  };
  const vh = window.innerHeight;
  const vw = window.innerWidth;
  const placeBelow = hole.top + hole.height + 190 < vh;
  const tipTop = placeBelow ? hole.top + hole.height + 12 : Math.max(12, hole.top - 12 - 180);
  let tipLeft = hole.left + hole.width / 2 - 160;
  tipLeft = Math.min(Math.max(16, tipLeft), vw - 336);

  const dernier = index + 1 >= total;

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={title}>
      {/* Trou de lumière : le box-shadow assombrit tout autour. */}
      <div
        className="absolute rounded-xl ring-2 ring-emerald-400 transition-all duration-200"
        style={{
          top: hole.top,
          left: hole.left,
          width: hole.width,
          height: hole.height,
          boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.55)',
        }}
      />
      {/* Infobulle */}
      <div
        className="absolute w-80 bg-white rounded-xl shadow-2xl border border-gray-200 p-4"
        style={{ top: tipTop, left: tipLeft }}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={lang === 'en' ? 'Close the guide' : 'Fermer le guide'}
            className="text-gray-400 hover:text-gray-700 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{body}</p>
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-gray-400 tabular-nums">
            {index + 1} / {total}
          </span>
          <div className="flex items-center gap-2">
            {index > 0 && (
              <Button variant="outline" size="sm" onClick={onPrev}>
                {lang === 'en' ? 'Back' : 'Précédent'}
              </Button>
            )}
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={onNext}>
              {dernier ? (lang === 'en' ? 'Got it' : 'J’ai compris') : lang === 'en' ? 'Next' : 'Suivant'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
