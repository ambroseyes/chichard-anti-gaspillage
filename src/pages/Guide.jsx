import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, PlayCircle, ShoppingBag, Truck, User } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PAGE_TOURS, WELCOME, roleOf } from '@/components/tour/tourSteps';
import { createPageUrl } from '@/utils';

/**
 * Guide d'utilisation illustré.
 *
 * Un tutoriel par type d'utilisateur, avec une capture d'écran par page et les
 * explications reprises, mot pour mot, du guide interactif (source unique). On
 * peut aussi relancer le guide interactif directement d'ici.
 */

const L = (fr, en) => ({ fr, en });

const ROLES = [
  { id: 'client', label: L('Client', 'Customer'), icon: User },
  { id: 'partner', label: L('Partenaire', 'Partner'), icon: BarChart3 },
  { id: 'driver', label: L('Livreur', 'Courier'), icon: Truck },
  { id: 'backoffice', label: L('Backoffice', 'Backoffice'), icon: ShoppingBag },
];

/** Sections par rôle : une capture, un titre, et la page de guide associée. */
const SECTIONS = {
  client: [
    { page: 'Home', title: L('L’accueil', 'Home'), shot: 'client-home' },
    { page: 'Catalog', title: L('Le catalogue et les filtres', 'The catalogue and filters'), shot: 'client-catalog' },
    {
      page: 'ProductDetail',
      title: L('La fiche produit', 'The product page'),
      shot: 'client-product',
      notes: [
        L('Prix, prix au kilo, date limite et avis : tout ce qu’il faut pour décider.',
          'Price, price per kilo, use-by date and reviews: everything you need to decide.'),
        L('Choisissez la quantité, puis « Ajouter » — le montant se met à jour.',
          'Pick the quantity, then “Add” — the amount updates.'),
      ],
    },
    { page: 'Cart', title: L('Le panier', 'The cart'), shot: 'client-cart' },
    { page: 'Checkout', title: L('Le tunnel de commande', 'Checkout'), shot: 'client-checkout' },
  ],
  partner: [
    { page: 'PartnerDashboard', title: L('Le tableau de bord', 'The dashboard'), shot: 'partner-dashboard' },
    { page: 'PartnerProducts', title: L('Vos produits', 'Your products'), shot: 'partner-products' },
  ],
  driver: [
    { page: 'DriverDashboard', title: L('Vos livraisons', 'Your deliveries'), shot: 'driver-dashboard' },
  ],
  backoffice: [
    { page: 'AdminBackoffice', title: L('Le pilotage', 'The overview'), shot: 'backoffice-dashboard' },
  ],
};

export default function Guide() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const tr = (p) => p?.[lang] ?? p?.fr ?? '';

  const [role, setRole] = useState(roleOf(user));
  const sections = SECTIONS[role] ?? SECTIONS.client;
  const intro = WELCOME[role];

  const relancer = () => {
    // On efface les repères « déjà vu » pour ce rôle, puis on file sur son
    // espace : la bienvenue et le guide interactif se reproposent.
    try {
      const email = user?.email || 'invite';
      localStorage.removeItem(`chichard.tour.welcome.${email}`);
      for (const s of sections) localStorage.removeItem(`chichard.tour.page.${s.page}.${email}`);
    } catch {
      /* stockage indisponible : sans effet */
    }
    navigate(createPageUrl(intro?.landing ?? 'Home'));
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 lg:px-6 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {tr(L('Guide d’utilisation', 'User guide'))}
          </h1>
          <p className="text-gray-500 mt-1">
            {tr(L(
              'Un tutoriel par type d’utilisateur, page par page. Choisissez votre profil.',
              'One tutorial per user type, page by page. Choose your profile.',
            ))}
          </p>
        </header>

        {/* Onglets de rôle */}
        <div className="flex flex-wrap gap-2 mb-6">
          {ROLES.map((r) => {
            const Icon = r.icon;
            const actif = role === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                aria-pressed={actif}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  actif ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tr(r.label)}
              </button>
            );
          })}
        </div>

        {/* Intro du rôle + relance du guide interactif */}
        {intro && (
          <Card className="p-5 mb-6 bg-emerald-50 border-emerald-100">
            <p className="text-sm text-emerald-900 leading-relaxed">{tr(intro.body)}</p>
            <Button onClick={relancer} className="mt-4 bg-emerald-600 hover:bg-emerald-700">
              <PlayCircle className="w-4 h-4 mr-2" />
              {tr(L('Relancer le guide interactif', 'Restart the interactive guide'))}
            </Button>
          </Card>
        )}

        {/* Sections illustrées */}
        <div className="space-y-8">
          {sections.map((section, i) => {
            const steps = PAGE_TOURS[section.page] ?? [];
            const tips = section.notes
              ? section.notes.map((n) => ({ body: n }))
              : steps.map((s) => ({ title: s.title, body: s.body }));
            return (
              <section key={section.page} aria-labelledby={`sec-${section.page}`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-7 h-7 rounded-full bg-emerald-600 text-white grid place-items-center text-sm font-bold shrink-0">
                    {i + 1}
                  </span>
                  <h2 id={`sec-${section.page}`} className="text-lg font-bold text-gray-900">
                    {tr(section.title)}
                  </h2>
                </div>

                <Card className="overflow-hidden">
                  <img
                    src={`/tutorials/${section.shot}.png`}
                    alt={tr(section.title)}
                    loading="lazy"
                    className="w-full border-b border-gray-100"
                  />
                  <ol className="p-5 space-y-3">
                    {tips.map((tip, index) => (
                      <li key={index} className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-700 grid place-items-center text-xs font-semibold shrink-0 mt-0.5">
                          {index + 1}
                        </span>
                        <span className="min-w-0">
                          {tip.title && (
                            <span className="block text-sm font-semibold text-gray-900">{tr(tip.title)}</span>
                          )}
                          <span className="block text-sm text-gray-600 leading-relaxed">{tr(tip.body)}</span>
                        </span>
                      </li>
                    ))}
                  </ol>
                </Card>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
