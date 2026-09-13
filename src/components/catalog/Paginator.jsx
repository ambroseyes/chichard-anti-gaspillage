import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Pagination.
 *
 * Elle affiche un nombre borné de numéros autour de la page courante : au-delà
 * d'une dizaine de pages, la liste complète devient illisible sur mobile.
 */
export default function Paginator({ page, pages, onChange }) {
  if (pages <= 1) return null;

  const numbers = pageNumbers(page, pages);

  return (
    <nav aria-label="Pagination des résultats" className="flex items-center justify-center gap-1 mt-8">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="h-9 px-3 rounded-md border border-gray-200 text-sm text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center gap-1"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Précédent</span>
      </button>

      {numbers.map((number, index) =>
        number === null ? (
          <span key={`gap-${index}`} className="px-2 text-gray-400" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={number}
            type="button"
            onClick={() => onChange(number)}
            aria-current={number === page ? 'page' : undefined}
            aria-label={`Page ${number}`}
            className={`h-9 min-w-9 px-2 rounded-md text-sm ${
              number === page
                ? 'bg-emerald-600 text-white font-semibold'
                : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {number}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= pages}
        className="h-9 px-3 rounded-md border border-gray-200 text-sm text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center gap-1"
      >
        <span className="hidden sm:inline">Suivant</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
}

/** `[1, null, 4, 5, 6, null, 12]` — `null` marque une coupure. */
function pageNumbers(page, pages) {
  if (pages <= 7) return Array.from({ length: pages }, (_, index) => index + 1);

  const around = [page - 1, page, page + 1].filter((n) => n > 1 && n < pages);
  const numbers = [1, ...around, pages];

  const result = [];
  let previous = 0;
  for (const number of numbers) {
    if (number - previous > 1) result.push(null);
    result.push(number);
    previous = number;
  }
  return result;
}
