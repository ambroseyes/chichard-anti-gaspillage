import { Component } from 'react';

/**
 * Dernier filet : une erreur de rendu affiche un écran lisible plutôt qu'une
 * page blanche, et laisse une trace en console pour le diagnostic.
 */
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Erreur de rendu', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center mx-auto text-2xl">
            ⚠️
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Cette page n’a pas pu s’afficher</h1>
          <p className="text-sm text-gray-500">
            L’erreur a été enregistrée. Rechargez la page ; si le problème persiste, revenez à
            l’accueil.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600"
            >
              Recharger
            </button>
            <a
              href="/"
              className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50"
            >
              Accueil
            </a>
          </div>
        </div>
      </div>
    );
  }
}
