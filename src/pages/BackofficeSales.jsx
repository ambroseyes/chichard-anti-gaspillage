import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, Info, Mail, MapPin, Phone, Search } from 'lucide-react';
import { api } from '@/api';
import { useAuth } from '@/lib/AuthContext';
import { formatNumber, formatDate } from '@/lib/format';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import Paginator from '@/components/catalog/Paginator';

const PAR_PAGE = 20;

/** Les statuts que le modèle `Store` connaît réellement. */
const STATUTS = [
  { id: 'all', label: 'Tous' },
  { id: 'pending', label: 'À qualifier', couleur: 'bg-amber-100 text-amber-700' },
  { id: 'verified', label: 'Validés', couleur: 'bg-emerald-100 text-emerald-700' },
  { id: 'rejected', label: 'Refusés', couleur: 'bg-red-100 text-red-700' },
  { id: 'suspended', label: 'Suspendus', couleur: 'bg-gray-100 text-gray-700' },
];

const STYLE_STATUT = Object.fromEntries(
  STATUTS.filter((s) => s.couleur).map((s) => [s.id, { label: s.label, couleur: s.couleur }]),
);

/**
 * Suivi commercial.
 *
 * Cet écran affichait trois prospects inventés dès que la requête ne
 * renvoyait rien, et une équipe commerciale de trois personnes entièrement
 * codée en dur — noms, régions et chiffres d'affaires compris. Ses indicateurs
 * de pipeline portaient sur des champs (`pipeline_stage`, `expected_value`)
 * qui n'existent dans aucune entité : sur des données réelles, ils valaient
 * toujours zéro.
 *
 * Il ne montre désormais que ce que la base contient : les boutiques qui ne
 * sont pas encore partenaires, et leur statut réel.
 */
export default function BackofficeSales() {
  const { user } = useAuth();
  const [recherche, setRecherche] = useState('');
  const [statut, setStatut] = useState('all');
  const [page, setPage] = useState(1);

  const terme = useDebouncedValue(recherche.trim(), 300);

  const { data: résultat, isLoading } = useQuery({
    queryKey: ['bo-prospects', terme, statut, page],
    queryFn: () =>
      api.entities.Store.page({
        filter: {
          is_partner: false,
          ...(statut === 'all' ? {} : { status: statut }),
          ...(terme ? { name: { contains: terme, mode: 'insensitive' } } : {}),
        },
        sort: '-created_date',
        limit: PAR_PAGE,
        offset: (page - 1) * PAR_PAGE,
      }),
    enabled: Boolean(user),
    placeholderData: (précédent) => précédent,
  });

  const prospects = résultat?.data ?? [];
  const total = résultat?.meta?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAR_PAGE));

  const changer = (action) => {
    action();
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suivi commercial</h1>
          <p className="text-gray-500">
            Les boutiques enregistrées qui ne sont pas encore partenaires.
          </p>
        </div>

        <Card className="p-4 bg-blue-50 border-blue-200">
          <p className="flex items-start gap-2 text-sm text-blue-900">
            <Info className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              Le suivi d'un cycle de vente — étapes de pipeline, montants attendus, portefeuille
              par commercial — n'est pas encore modélisé. Cette page liste les prospects réels et
              leur statut ; elle n'affiche aucun indicateur tant que les données correspondantes
              n'existent pas.
            </span>
          </p>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Rechercher une boutique…"
              value={recherche}
              onChange={(e) => changer(() => setRecherche(e.target.value))}
              className="pl-10 h-11"
              aria-label="Rechercher une boutique prospect"
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
            : `${formatNumber(total)} boutique${total > 1 ? 's' : ''}${terme ? ` pour « ${terme} »` : ''}`}
        </p>

        {isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : prospects.length === 0 ? (
          <Card className="py-16 text-center">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h2 className="font-semibold text-gray-900 mb-1">Aucune boutique à afficher</h2>
            <p className="text-sm text-gray-500">
              {terme || statut !== 'all'
                ? 'Essayez un autre terme ou un autre statut.'
                : 'Toutes les boutiques enregistrées sont déjà partenaires.'}
            </p>
          </Card>
        ) : (
          <>
            <ul className="space-y-2">
              {prospects.map((boutique) => {
                const style = STYLE_STATUT[boutique.status] ?? {
                  label: boutique.status,
                  couleur: 'bg-gray-100 text-gray-700',
                };
                return (
                  <li key={boutique.id}>
                    <Card className="p-4 flex flex-wrap items-start gap-4">
                      <span className="w-11 h-11 rounded-lg bg-gray-100 grid place-items-center shrink-0">
                        <Building2 className="w-5 h-5 text-gray-500" />
                      </span>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{boutique.name}</p>
                        <ul className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                          {boutique.city && (
                            <li className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" /> {boutique.city}
                            </li>
                          )}
                          {boutique.email && (
                            <li className="flex items-center gap-1 min-w-0">
                              <Mail className="w-3.5 h-3.5 shrink-0" />
                              <a href={`mailto:${boutique.email}`} className="truncate hover:text-emerald-700">
                                {boutique.email}
                              </a>
                            </li>
                          )}
                          {boutique.phone && (
                            <li className="flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5" />
                              <a href={`tel:${boutique.phone}`} className="hover:text-emerald-700">
                                {boutique.phone}
                              </a>
                            </li>
                          )}
                        </ul>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`inline-block px-2.5 py-1 rounded text-xs font-medium ${style.couleur}`}>
                          {style.label}
                        </span>
                        <p className="text-xs text-gray-400 mt-1">
                          Inscrite le {formatDate(boutique.created_date)}
                        </p>
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ul>

            <Paginator page={page} pages={pages} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
