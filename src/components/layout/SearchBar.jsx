import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Search, Store, Tag, X } from 'lucide-react';
import { api } from '@/api';
import { createPageUrl } from '@/utils';
import { formatXAF } from '@/lib/format';
import { CATEGORY_EMOJI } from '@/lib/constants';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

const MIN_LENGTH = 2;

/**
 * Barre de recherche du site.
 *
 * Elle propose trois choses en même temps : des produits, des rayons et des
 * boutiques. Les suggestions viennent du serveur — c'est lui qui connaît le
 * catalogue — et la liste se parcourt entièrement au clavier.
 */
export default function SearchBar({ initialTerm = '', autoFocus = false, onNavigate }) {
  const navigate = useNavigate();
  const [term, setTerm] = useState(initialTerm);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const container = useRef(null);
  const listId = useId();

  const debounced = useDebouncedValue(term.trim(), 250);

  // La barre garde le mot cherché quand on revient sur la page de résultats.
  useEffect(() => setTerm(initialTerm), [initialTerm]);

  const { data: suggestions, isFetching } = useQuery({
    queryKey: ['catalog-suggest', debounced],
    queryFn: () => api.catalog.suggest(debounced),
    enabled: debounced.length >= MIN_LENGTH,
    staleTime: 60_000,
  });

  /**
   * Les trois groupes sont aplatis en une seule liste : la flèche du bas doit
   * passer d'un produit à un rayon sans que l'utilisateur ait à y penser.
   */
  const options = useMemo(() => {
    if (!suggestions) return [];
    return [
      ...suggestions.products.map((product) => ({
        kind: 'product',
        key: `p-${product.id}`,
        label: product.name,
        product,
        to: createPageUrl(`ProductDetail?id=${product.id}`),
      })),
      ...suggestions.categories.map((category) => ({
        kind: 'category',
        key: `c-${category.value}`,
        label: category.label,
        value: category.value,
        to: createPageUrl(`Catalog?category=${encodeURIComponent(category.value)}`),
      })),
      ...suggestions.stores.map((store) => ({
        kind: 'store',
        key: `s-${store.value}`,
        label: store.label,
        count: store.count,
        to: createPageUrl(`Catalog?store=${encodeURIComponent(store.value)}`),
      })),
    ];
  }, [suggestions]);

  useEffect(() => setActiveIndex(-1), [options]);

  // Un clic ailleurs referme la liste : sans cela elle reste par-dessus la page.
  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (!container.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  const go = (to) => {
    setOpen(false);
    onNavigate?.();
    navigate(to);
  };

  const submit = (event) => {
    event?.preventDefault();
    if (activeIndex >= 0 && options[activeIndex]) {
      go(options[activeIndex].to);
      return;
    }
    const cleaned = term.trim();
    go(cleaned ? createPageUrl(`Catalog?q=${encodeURIComponent(cleaned)}`) : createPageUrl('Catalog'));
  };

  const onKeyDown = (event) => {
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (!options.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (index + 1) % options.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? options.length - 1 : index - 1));
    }
  };

  const showPanel = open && debounced.length >= MIN_LENGTH;

  return (
    <div ref={container} className="relative w-full">
      <form onSubmit={submit} role="search">
        <label htmlFor={`${listId}-input`} className="sr-only">
          Rechercher un produit, un rayon ou une boutique
        </label>
        <div className="flex items-center rounded-lg border-2 border-emerald-500 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-emerald-200">
          <input
            id={`${listId}-input`}
            type="search"
            value={term}
            autoFocus={autoFocus}
            onChange={(event) => {
              setTerm(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder="Rechercher un produit, une marque, une boutique…"
            className="flex-1 h-11 px-4 text-sm outline-none placeholder:text-gray-400 [&::-webkit-search-cancel-button]:appearance-none"
            role="combobox"
            aria-expanded={showPanel}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
          />
          {term && (
            <button
              type="button"
              onClick={() => setTerm('')}
              aria-label="Effacer la recherche"
              className="px-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="submit"
            className="h-11 px-5 bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-2 font-medium text-sm transition-colors"
          >
            {isFetching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Rechercher</span>
          </button>
        </div>
      </form>

      {showPanel && (
        <div
          id={listId}
          role="listbox"
          aria-label="Suggestions"
          className="absolute left-0 right-0 top-full mt-1 bg-white rounded-lg border border-gray-200 shadow-xl z-50 overflow-hidden"
        >
          {options.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-500 text-center">
              {isFetching ? 'Recherche…' : `Aucune suggestion pour « ${debounced} »`}
            </p>
          ) : (
            <ul className="max-h-96 overflow-y-auto py-1">
              {options.map((option, index) => (
                <li key={option.key}>
                  <button
                    type="button"
                    id={`${listId}-${index}`}
                    role="option"
                    aria-selected={index === activeIndex}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => go(option.to)}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-left ${
                      index === activeIndex ? 'bg-emerald-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <SuggestionIcon option={option} />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm text-gray-900 truncate">{option.label}</span>
                      <span className="block text-xs text-gray-500 truncate">
                        {option.kind === 'product' && option.product.store_name}
                        {option.kind === 'category' && 'Rayon'}
                        {option.kind === 'store' && `${option.count} article${option.count > 1 ? 's' : ''}`}
                      </span>
                    </span>
                    {option.kind === 'product' && (
                      <span className="text-sm font-semibold text-emerald-600 whitespace-nowrap">
                        {formatXAF(option.product.discounted_price)}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={submit}
            className="w-full px-4 py-2.5 text-sm font-medium text-emerald-700 bg-emerald-50/60 hover:bg-emerald-100 border-t border-gray-100 text-left"
          >
            Voir tous les résultats pour « {debounced} »
          </button>
        </div>
      )}
    </div>
  );
}

function SuggestionIcon({ option }) {
  if (option.kind === 'product') {
    return option.product.image_url ? (
      <img
        src={option.product.image_url}
        alt=""
        className="w-9 h-9 rounded object-cover bg-gray-100 shrink-0"
      />
    ) : (
      <span className="w-9 h-9 rounded bg-gray-100 grid place-items-center text-base shrink-0">
        {CATEGORY_EMOJI[option.product.category] ?? '🛒'}
      </span>
    );
  }
  const Icon = option.kind === 'category' ? Tag : Store;
  return (
    <span className="w-9 h-9 rounded bg-gray-100 grid place-items-center shrink-0">
      <Icon className="w-4 h-4 text-gray-500" />
    </span>
  );
}
