import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  Mail,
  MapPin,
  Phone,
  Search,
  UserRound,
} from 'lucide-react';
import { api } from '@/api';
import { useAuth } from '@/lib/AuthContext';
import { formatDate, formatNumber, formatXAF } from '@/lib/format';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import Paginator from '@/components/catalog/Paginator';

const PAR_PAGE = 20;

/**
 * Le cycle de vente, dans l'ordre. Miroir exact de l'énuméré côté serveur :
 * un écart ferait afficher une colonne que l'API refuserait d'écrire.
 */
const ÉTAPES = [
  { id: 'new', label: 'À contacter', couleur: 'bg-gray-100 text-gray-700' },
  { id: 'contacted', label: 'Contactée', couleur: 'bg-sky-100 text-sky-700' },
  { id: 'qualified', label: 'Qualifiée', couleur: 'bg-indigo-100 text-indigo-700' },
  { id: 'proposal', label: 'Proposition', couleur: 'bg-violet-100 text-violet-700' },
  { id: 'negotiation', label: 'Négociation', couleur: 'bg-amber-100 text-amber-700' },
  { id: 'won', label: 'Signée', couleur: 'bg-emerald-100 text-emerald-700' },
  { id: 'lost', label: 'Perdue', couleur: 'bg-red-100 text-red-700' },
];

const PAR_ÉTAPE = Object.fromEntries(ÉTAPES.map((é) => [é.id, é]));

/** Les statuts que le modèle `Store` connaît réellement. */
const STATUTS = [
  { id: 'all', label: 'Tous statuts' },
  { id: 'pending', label: 'À qualifier' },
  { id: 'verified', label: 'Validés' },
  { id: 'rejected', label: 'Refusés' },
  { id: 'suspended', label: 'Suspendus' },
];

/** `<input type="date">` attend `AAAA-MM-JJ` ; la base renvoie un ISO complet. */
const versChampDate = (valeur) => (valeur ? String(valeur).slice(0, 10) : '');

const estEnRetard = (valeur) =>
  Boolean(valeur) && new Date(valeur).getTime() < new Date().setHours(0, 0, 0, 0);

/**
 * Suivi commercial.
 *
 * Cet écran affichait autrefois trois prospects inventés et une équipe
 * commerciale codée en dur, avec des indicateurs portant sur des champs qui
 * n'existaient dans aucune entité. Les champs existent désormais sur `Store`,
 * et tout ce qui est affiché ici vient de la base.
 *
 * L'avancement se modifie par `PATCH /api/backoffice/stores/:id/pipeline` :
 * c'est le seul chemin d'écriture, le propriétaire de la boutique n'y a pas
 * accès et chaque changement d'étape laisse une trace au journal d'audit.
 */
export default function BackofficeSales() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [recherche, setRecherche] = useState('');
  const [statut, setStatut] = useState('all');
  const [étape, setÉtape] = useState('all');
  const [page, setPage] = useState(1);
  const [enÉdition, setEnÉdition] = useState(null);

  const terme = useDebouncedValue(recherche.trim(), 300);

  const paramètres = {
    q: terme || undefined,
    status: statut === 'all' ? undefined : statut,
    stage: étape === 'all' ? undefined : étape,
    limit: PAR_PAGE,
    offset: (page - 1) * PAR_PAGE,
  };

  const { data: résultat, isLoading } = useQuery({
    queryKey: ['bo-pipeline', terme, statut, étape, page],
    queryFn: () => api.backoffice.stores(paramètres),
    enabled: Boolean(user),
    placeholderData: (précédent) => précédent,
  });

  const enregistrer = useMutation({
    mutationFn: ({ id, champs }) => api.backoffice.setStorePipeline(id, champs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bo-pipeline'] });
      toast.success('Suivi mis à jour');
    },
    onError: (error) => toast.error(error.message ?? "Le suivi n'a pas pu être enregistré"),
  });

  const boutiques = résultat?.data ?? [];
  const total = résultat?.meta?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAR_PAGE));

  /*
   * Les décomptes viennent du serveur et ignorent le filtre d'étape : on peut
   * consulter une colonne sans perdre de vue le reste du portefeuille.
   */
  const colonnes = résultat?.meta?.by_stage ?? [];
  const attenduTotal = colonnes
    .filter((c) => c.stage !== 'lost')
    .reduce((somme, c) => somme + (c.expected_value ?? 0), 0);

  const changer = (action) => {
    action();
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6 space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-gray-900">Suivi commercial</h1>
          <p className="text-gray-500">
            Où en est chaque boutique dans le cycle de vente, et ce qu'on en attend.
          </p>
        </header>

        {/* --- Le portefeuille, étape par étape --- */}
        <section aria-label="Répartition par étape">
          <ul className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {ÉTAPES.map((é) => {
              const ligne = colonnes.find((c) => c.stage === é.id);
              const actif = étape === é.id;
              return (
                <li key={é.id}>
                  <button
                    type="button"
                    onClick={() => changer(() => setÉtape(actif ? 'all' : é.id))}
                    aria-pressed={actif}
                    className={`w-full text-left p-3 rounded-xl border transition-colors ${
                      actif
                        ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <span className="block text-xs font-medium text-gray-500 truncate">
                      {é.label}
                    </span>
                    <span className="block text-xl font-bold text-gray-900 tabular-nums">
                      {formatNumber(ligne?.count ?? 0)}
                    </span>
                    <span className="block text-xs text-gray-400 truncate">
                      {ligne?.expected_value ? formatXAF(ligne.expected_value) : '—'}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-sm text-gray-500">
            Montant attendu sur les dossiers encore ouverts :{' '}
            <strong className="text-gray-900">{formatXAF(attenduTotal)}</strong>
            {étape !== 'all' && (
              <>
                {' · '}
                <button
                  type="button"
                  onClick={() => changer(() => setÉtape('all'))}
                  className="text-emerald-700 hover:underline"
                >
                  Voir toutes les étapes
                </button>
              </>
            )}
          </p>
        </section>

        {/* --- Filtres --- */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              aria-hidden="true"
            />
            <Input
              placeholder="Nom, ville ou adresse e-mail…"
              value={recherche}
              onChange={(e) => changer(() => setRecherche(e.target.value))}
              className="pl-10 h-11"
              aria-label="Rechercher une boutique"
            />
          </div>

          <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1 overflow-x-auto scrollbar-hide">
            {STATUTS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => changer(() => setStatut(option.id))}
                aria-pressed={statut === option.id}
                className={`px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition-colors ${
                  statut === option.id
                    ? 'bg-emerald-600 text-white font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-sm text-gray-500" aria-live="polite">
          {isLoading
            ? 'Chargement…'
            : `${formatNumber(total)} boutique${total > 1 ? 's' : ''}${
                terme ? ` pour « ${terme} »` : ''
              }`}
        </p>

        {/* --- La liste --- */}
        {isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : boutiques.length === 0 ? (
          <Card className="py-16 text-center">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" aria-hidden="true" />
            <h2 className="font-semibold text-gray-900 mb-1">Aucune boutique à afficher</h2>
            <p className="text-sm text-gray-500">
              {terme || statut !== 'all' || étape !== 'all'
                ? 'Aucune boutique ne correspond à ces filtres.'
                : "Aucune boutique n'est encore enregistrée."}
            </p>
          </Card>
        ) : (
          <>
            <ul className="space-y-2">
              {boutiques.map((boutique) => (
                <LigneBoutique
                  key={boutique.id}
                  boutique={boutique}
                  onÉtape={(stage) =>
                    enregistrer.mutate({ id: boutique.id, champs: { pipeline_stage: stage } })
                  }
                  onÉditer={() => setEnÉdition(boutique)}
                  occupé={enregistrer.isPending}
                />
              ))}
            </ul>

            <Paginator page={page} pages={pages} onChange={setPage} />
          </>
        )}
      </div>

      <DialogueSuivi
        boutique={enÉdition}
        onClose={() => setEnÉdition(null)}
        onEnregistrer={(champs) =>
          enregistrer.mutate(
            { id: enÉdition.id, champs },
            { onSuccess: () => setEnÉdition(null) },
          )
        }
        occupé={enregistrer.isPending}
      />
    </div>
  );
}

/** Une boutique du portefeuille : son état, et de quoi le faire avancer. */
function LigneBoutique({ boutique, onÉtape, onÉditer, occupé }) {
  const style = PAR_ÉTAPE[boutique.pipeline_stage] ?? {
    label: boutique.pipeline_stage ?? '—',
    couleur: 'bg-gray-100 text-gray-700',
  };
  const retard = estEnRetard(boutique.pipeline_next_action_at);

  return (
    <li>
      <Card className="p-4 flex flex-wrap items-start gap-4">
        <span className="w-11 h-11 rounded-lg bg-gray-100 grid place-items-center shrink-0">
          <Building2 className="w-5 h-5 text-gray-500" aria-hidden="true" />
        </span>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{boutique.name}</p>

          <ul className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
            {boutique.city && (
              <li className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" aria-hidden="true" /> {boutique.city}
              </li>
            )}
            {boutique.email && (
              <li className="flex items-center gap-1 min-w-0">
                <Mail className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <a href={`mailto:${boutique.email}`} className="truncate hover:text-emerald-700">
                  {boutique.email}
                </a>
              </li>
            )}
            {boutique.phone && (
              <li className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                <a href={`tel:${boutique.phone}`} className="hover:text-emerald-700">
                  {boutique.phone}
                </a>
              </li>
            )}
            {boutique.pipeline_owner_email && (
              <li className="flex items-center gap-1 min-w-0">
                <UserRound className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{boutique.pipeline_owner_email}</span>
              </li>
            )}
          </ul>

          {boutique.pipeline_next_action_at && (
            <p
              className={`flex items-center gap-1 mt-1 text-sm ${
                retard ? 'text-red-600 font-medium' : 'text-gray-500'
              }`}
            >
              {retard ? (
                <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <CalendarClock className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              {retard ? 'Relance en retard depuis le ' : 'Prochaine action le '}
              {formatDate(boutique.pipeline_next_action_at)}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className={`inline-block px-2.5 py-1 rounded text-xs font-medium ${style.couleur}`}>
            {style.label}
          </span>

          <p className="text-sm font-semibold text-gray-900 tabular-nums">
            {boutique.pipeline_expected_value
              ? formatXAF(boutique.pipeline_expected_value)
              : <span className="font-normal text-gray-400">Montant non estimé</span>}
          </p>

          <div className="flex items-center gap-2">
            {/*
              Le changement d'étape est l'action de tous les jours : elle se fait
              sur la ligne, sans ouvrir de fenêtre.
            */}
            <label className="sr-only" htmlFor={`etape-${boutique.id}`}>
              Étape de {boutique.name}
            </label>
            <select
              id={`etape-${boutique.id}`}
              value={boutique.pipeline_stage ?? 'new'}
              disabled={occupé}
              onChange={(e) => onÉtape(e.target.value)}
              className="h-9 rounded-md border border-gray-200 bg-white px-2 text-sm text-gray-700 disabled:opacity-50"
            >
              {ÉTAPES.map((é) => (
                <option key={é.id} value={é.id}>
                  {é.label}
                </option>
              ))}
            </select>

            <Button type="button" variant="outline" size="sm" onClick={onÉditer}>
              Détails
            </Button>
          </div>
        </div>
      </Card>
    </li>
  );
}

/** Le reste du dossier : montant, responsable, relance, notes. */
function DialogueSuivi({ boutique, onClose, onEnregistrer, occupé }) {
  const [champs, setChamps] = useState(null);

  // Le formulaire repart de la boutique ouverte, pas de la précédente.
  useEffect(() => {
    if (!boutique) return;
    setChamps({
      pipeline_expected_value: boutique.pipeline_expected_value ?? '',
      pipeline_owner_email: boutique.pipeline_owner_email ?? '',
      pipeline_next_action_at: versChampDate(boutique.pipeline_next_action_at),
      pipeline_notes: boutique.pipeline_notes ?? '',
    });
  }, [boutique]);

  if (!boutique || !champs) return null;

  const modifier = (clé) => (e) => setChamps((prev) => ({ ...prev, [clé]: e.target.value }));

  const soumettre = (e) => {
    e.preventDefault();
    // Un champ vidé remet la valeur à nul : l'API accepte `null` et distingue
    // « effacé » de « inchangé ».
    onEnregistrer({
      pipeline_expected_value:
        champs.pipeline_expected_value === '' ? null : Number(champs.pipeline_expected_value),
      pipeline_owner_email: champs.pipeline_owner_email.trim() || null,
      pipeline_next_action_at: champs.pipeline_next_action_at || null,
      pipeline_notes: champs.pipeline_notes.trim() || null,
    });
  };

  return (
    <Dialog open onOpenChange={(ouvert) => !ouvert && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{boutique.name}</DialogTitle>
          <DialogDescription>
            {boutique.pipeline_stage_changed_at
              ? `Dans l'étape « ${
                  PAR_ÉTAPE[boutique.pipeline_stage]?.label ?? boutique.pipeline_stage
                } » depuis le ${formatDate(boutique.pipeline_stage_changed_at)}.`
              : "Ce dossier n'a pas encore changé d'étape."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={soumettre} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="attendu">Montant attendu (FCFA)</Label>
              <Input
                id="attendu"
                type="number"
                min="0"
                step="1000"
                inputMode="numeric"
                value={champs.pipeline_expected_value}
                onChange={modifier('pipeline_expected_value')}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="relance">Prochaine action</Label>
              <Input
                id="relance"
                type="date"
                value={champs.pipeline_next_action_at}
                onChange={modifier('pipeline_next_action_at')}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="responsable">Responsable du dossier</Label>
            <Input
              id="responsable"
              type="email"
              placeholder="prenom.nom@chichard.cm"
              value={champs.pipeline_owner_email}
              onChange={modifier('pipeline_owner_email')}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={4}
              maxLength={2000}
              placeholder="Ce qui s'est dit, ce qui reste à faire…"
              value={champs.pipeline_notes}
              onChange={modifier('pipeline_notes')}
              className="mt-1"
            />
            <p className="mt-1 text-xs text-gray-400">
              {formatNumber(champs.pipeline_notes.length)} / 2 000 caractères
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={occupé}>
              {occupé ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
