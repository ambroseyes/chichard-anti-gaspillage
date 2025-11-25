import React from 'react';
import { motion } from 'framer-motion';

const categories = [
  { id: 'all', label: 'Tout', emoji: '🔥' },
  { id: 'fruits_legumes', label: 'Fruits & Légumes', emoji: '🥬' },
  { id: 'produits_laitiers', label: 'Produits laitiers', emoji: '🥛' },
  { id: 'viandes_poissons', label: 'Viandes', emoji: '🥩' },
  { id: 'boulangerie', label: 'Boulangerie', emoji: '🥖' },
  { id: 'epicerie', label: 'Épicerie', emoji: '🛒' },
  { id: 'boissons', label: 'Boissons', emoji: '🥤' },
  { id: 'surgeles', label: 'Surgelés', emoji: '❄️' },
  { id: 'hygiene', label: 'Hygiène', emoji: '🧴' },
];

export default function CategoryPill({ selected, onSelect }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((cat) => (
        <motion.button
          key={cat.id}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(cat.id)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
            selected === cat.id
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
              : 'bg-white text-gray-700 border border-gray-200 hover:border-emerald-300'
          }`}
        >
          <span>{cat.emoji}</span>
          <span>{cat.label}</span>
        </motion.button>
      ))}
    </div>
  );
}

export { categories };