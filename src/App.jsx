import { Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import './App.css';
import { queryClientInstance } from '@/lib/query-client';
import { AuthProvider } from '@/lib/AuthContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import RequireRole from '@/components/auth/RequireRole';
import PageSpinner from '@/components/ui/PageSpinner';
import PageNotFound from '@/lib/PageNotFound';
import Layout from '@/Layout';
import { backofficeRoutes, publicAuthRoutes, routes } from '@/routes';

/** Enveloppe les pages publiques et connectées dans le gabarit du site. */
const withLayout = (name, Element) => (
  <Layout currentPageName={name}>
    <Element />
  </Layout>
);

function AppRoutes() {
  return (
    <Routes>
      {publicAuthRoutes.map(({ path, element: Element }) => (
        <Route key={path} path={path} element={<Element />} />
      ))}

      {routes
        .filter((r) => !r.role)
        .map(({ path, name, element: Element, index }) => (
          <Route key={path} path={path} index={index} element={withLayout(name, Element)} />
        ))}

      {/* Une garde par niveau : les pages qu'elle protège ne sont montées
          qu'une fois le droit établi. */}
      {['authenticated', 'partner', 'driver', 'admin', 'backofficeAdmin'].map((role) => (
        <Route key={role} element={<RequireRole role={role} />}>
          {routes
            .filter((r) => r.role === role)
            .map(({ path, name, element: Element }) => (
              <Route key={path} path={path} element={withLayout(name, Element)} />
            ))}
        </Route>
      ))}

      {backofficeRoutes.map(({ path, role, element: Element }) => (
        <Route key={path} element={<RequireRole role={role} />}>
          <Route path={path} element={<Element />} />
        </Route>
      ))}

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClientInstance}>
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<PageSpinner />}>
              <AppRoutes />
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
        {/* Un seul système de messages, monté une fois pour toute l'application. */}
        <Toaster position="top-center" richColors closeButton expand={false} duration={4000} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
