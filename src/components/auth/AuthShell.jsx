import { Link } from 'react-router-dom';
import { Leaf, Percent, ShieldCheck, Store } from 'lucide-react';

/**
 * Gabarit des écrans de connexion, d'inscription et de mot de passe.
 *
 * Deux colonnes sur grand écran : le formulaire, et ce que le compte apporte.
 * Ces pages sont le point de bascule du parcours — un visiteur qui hésite à
 * créer un compte doit y lire ce qu'il y gagne, pas seulement un champ à
 * remplir.
 */
const PROMESSES = [
  { icon: Percent, texte: 'Jusqu’à −70 % sur les produits proches de leur date limite' },
  { icon: Store, texte: 'Retrait gratuit en boutique ou livraison à Yaoundé et Douala' },
  { icon: ShieldCheck, texte: 'Paiement Orange Money, MTN MoMo ou à la livraison' },
];

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 h-16 flex items-center">
          <Link to="/" className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 grid place-items-center">
              <Leaf className="w-5 h-5 text-white" />
            </span>
            <span className="text-lg font-bold text-emerald-700 tracking-tight">CHICHARD</span>
          </Link>
          <Link
            to="/"
            className="ml-auto text-sm text-gray-500 hover:text-emerald-700 transition-colors"
          >
            Retour à la boutique
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center">
        <div className="max-w-6xl w-full mx-auto px-4 lg:px-6 py-10 grid lg:grid-cols-2 gap-10 items-center">
          <div className="w-full max-w-md mx-auto lg:mx-0">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <h1 className="text-xl font-bold text-gray-900">{title}</h1>
              {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
              <div className="mt-6">{children}</div>
            </div>

            {footer && <div className="mt-5 text-sm text-gray-600 text-center">{footer}</div>}
          </div>

          <aside className="hidden lg:block">
            <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-2">
              Sauvez des produits,
              <br />
              économisez vraiment.
            </h2>
            <p className="text-gray-600 mb-6 max-w-sm">
              Les invendus des boutiques camerounaises à petit prix, plutôt qu'à la poubelle.
            </p>

            <ul className="space-y-3">
              {PROMESSES.map((promesse) => (
                <li key={promesse.texte} className="flex items-start gap-3">
                  <span className="w-9 h-9 rounded-full bg-emerald-100 grid place-items-center shrink-0">
                    <promesse.icon className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                  </span>
                  <span className="text-sm text-gray-700 pt-2">{promesse.texte}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 py-4 flex flex-wrap gap-4 justify-between text-xs text-gray-500">
          <p>© {new Date().getFullYear()} Chichard</p>
          <nav className="flex gap-4">
            <Link to="/About" className="hover:text-emerald-700">
              À propos
            </Link>
            <Link to="/Contact" className="hover:text-emerald-700">
              Aide
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
