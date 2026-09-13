import React from 'react';
import { Leaf, ShieldCheck, Store, Wallet } from 'lucide-react';

/**
 * Bandeau de réassurance.
 *
 * Quatre promesses vérifiables, pas des slogans : ce sont les questions que se
 * pose quelqu'un qui hésite à acheter un produit proche de sa date limite.
 */
const PROMISES = [
  {
    icon: ShieldCheck,
    title: 'Produits vérifiés',
    detail: 'Date limite contrôlée par la boutique',
  },
  {
    icon: Store,
    title: 'Retrait gratuit',
    detail: 'En boutique, sous 2 h après la commande',
  },
  {
    icon: Wallet,
    title: 'Paiement mobile',
    detail: 'Orange Money, MTN MoMo ou à la livraison',
  },
  {
    icon: Leaf,
    title: 'Anti-gaspillage',
    detail: 'Chaque achat évite un produit jeté',
  },
];

export default function ReassuranceStrip({ className = '' }) {
  return (
    <section
      aria-label="Nos engagements"
      className={`bg-white border-y border-gray-100 ${className}`}
    >
      <ul className="max-w-7xl mx-auto px-4 lg:px-6 py-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {PROMISES.map((promise) => (
          <li key={promise.title} className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-emerald-50 grid place-items-center shrink-0">
              <promise.icon className="w-5 h-5 text-emerald-600" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-gray-900">{promise.title}</span>
              <span className="block text-xs text-gray-500">{promise.detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
