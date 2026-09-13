import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Leaf, Mail, MapPin, Phone } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { PRODUCT_CATEGORIES } from '@/lib/constants';

const catalogLink = (params) => createPageUrl(`Catalog?${new URLSearchParams(params).toString()}`);

const COLUMNS = [
  {
    title: 'Acheter',
    links: [
      { label: 'Tout le catalogue', to: createPageUrl('Catalog') },
      { label: "Expire aujourd'hui", to: catalogLink({ expires: 'today' }) },
      { label: 'Meilleures remises', to: catalogLink({ sort: 'discount' }) },
      { label: 'Click & Collect', to: createPageUrl('ClickCollect') },
      { label: 'Offres des marques', to: createPageUrl('BrandOffers') },
    ],
  },
  {
    title: 'Mon compte',
    links: [
      { label: 'Mes commandes', to: createPageUrl('Orders') },
      { label: 'Suivi de livraison', to: createPageUrl('DeliveryTracking') },
      { label: 'Programme fidélité', to: createPageUrl('LoyaltyProgram') },
      { label: 'Chichard+', to: createPageUrl('ChichardPlus') },
      { label: 'Notifications', to: createPageUrl('NotificationSettings') },
    ],
  },
  {
    title: 'Professionnels',
    links: [
      { label: 'Devenir partenaire', to: createPageUrl('BecomePartner') },
      { label: 'Espace partenaire', to: createPageUrl('PartnerDashboard') },
      { label: 'Espace livreur', to: createPageUrl('DriverDashboard') },
    ],
  },
  {
    title: 'Chichard',
    links: [
      { label: 'À propos', to: createPageUrl('About') },
      { label: 'Nous contacter', to: createPageUrl('Contact') },
      { label: 'La communauté', to: createPageUrl('Community') },
      { label: 'Sécurité du compte', to: createPageUrl('SecurityCenter') },
    ],
  },
];

const PAYMENTS = ['Orange Money', 'MTN MoMo', 'Carte bancaire', 'À la livraison'];

/**
 * Pied de page.
 *
 * Il fait office de plan du site : sur un site marchand, c'est là que les
 * visiteurs vont chercher ce que la navigation principale ne montre pas.
 */
export default function SiteFooter() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-12">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-12">
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-9 h-9 rounded-lg bg-emerald-500 grid place-items-center">
                <Leaf className="w-5 h-5 text-white" />
              </span>
              <span className="text-lg font-bold text-white">CHICHARD</span>
            </div>
            <p className="text-sm text-gray-400 mb-4 max-w-xs">
              La plateforme camerounaise qui vend à prix réduit les produits
              proches de leur date limite, au lieu de les jeter.
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                Yaoundé &amp; Douala, Cameroun
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                <a href="tel:+237699000000" className="hover:text-white">
                  +237 699 00 00 00
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-500 shrink-0" />
                <a href="mailto:bonjour@chichard.cm" className="hover:text-white">
                  bonjour@chichard.cm
                </a>
              </li>
            </ul>
            <div className="flex gap-3 mt-5">
              <a
                href="https://www.facebook.com"
                aria-label="Chichard sur Facebook"
                className="w-9 h-9 rounded-full bg-gray-800 grid place-items-center hover:bg-emerald-600 transition-colors"
                rel="noreferrer noopener"
                target="_blank"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://www.instagram.com"
                aria-label="Chichard sur Instagram"
                className="w-9 h-9 rounded-full bg-gray-800 grid place-items-center hover:bg-emerald-600 transition-colors"
                rel="noreferrer noopener"
                target="_blank"
              >
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="text-sm font-semibold text-white mb-3">{column.title}</h2>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-sm text-gray-400 hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-gray-800">
          <h2 className="text-sm font-semibold text-white mb-3">Nos rayons</h2>
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            {PRODUCT_CATEGORIES.map((category) => (
              <li key={category.id}>
                <Link
                  to={catalogLink({ category: category.id })}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {category.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500 text-center sm:text-left">
            © {new Date().getFullYear()} Chichard — Tous droits réservés.
          </p>
          <ul className="flex flex-wrap justify-center gap-2">
            {PAYMENTS.map((payment) => (
              <li
                key={payment}
                className="px-2.5 py-1 rounded border border-gray-700 text-[11px] text-gray-400"
              >
                {payment}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
