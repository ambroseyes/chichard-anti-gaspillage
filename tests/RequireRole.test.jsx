import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import RequireRole, { backofficeRoleOf } from '@/components/auth/RequireRole';

const mockAuth = vi.hoisted(() => ({ value: null }));
vi.mock('@/lib/AuthContext', () => ({ useAuth: () => mockAuth.value }));

function renderGuard(role, auth) {
  mockAuth.value = auth;
  return render(
    <MemoryRouter initialEntries={['/protege']}>
      <Routes>
        <Route element={<RequireRole role={role} />}>
          <Route path="/protege" element={<p>contenu réservé</p>} />
        </Route>
        <Route path="/" element={<p>accueil</p>} />
        <Route path="/connexion" element={<p>connexion</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

const connected = (user) => ({ user, isLoading: false, isAuthenticated: true });

describe('garde de route', () => {
  it('renvoie un visiteur anonyme vers la connexion', () => {
    renderGuard('authenticated', { user: null, isLoading: false, isAuthenticated: false });
    expect(screen.getByText('connexion')).toBeInTheDocument();
  });

  it('ne monte rien tant que la session est en cours de vérification', () => {
    renderGuard('authenticated', { user: null, isLoading: true, isAuthenticated: false });
    expect(screen.queryByText('contenu réservé')).not.toBeInTheDocument();
  });

  it('refuse le backoffice à un compte ordinaire', () => {
    renderGuard('backoffice', connected({ role: 'user', backoffice_role: 'none' }));
    expect(screen.getByText('accueil')).toBeInTheDocument();
    expect(screen.queryByText('contenu réservé')).not.toBeInTheDocument();
  });

  it('laisse passer un opérateur sur une page backoffice', () => {
    renderGuard('backoffice', connected({ role: 'user', backoffice_role: 'operator' }));
    expect(screen.getByText('contenu réservé')).toBeInTheDocument();
  });

  it("refuse l'attribution de rôles à un opérateur", () => {
    renderGuard('superAdmin', connected({ role: 'user', backoffice_role: 'operator' }));
    expect(screen.queryByText('contenu réservé')).not.toBeInTheDocument();
  });

  it('refuse un espace partenaire à un client', () => {
    renderGuard('partner', connected({ role: 'user', is_partner: false }));
    expect(screen.queryByText('contenu réservé')).not.toBeInTheDocument();
  });

  it('laisse passer le partenaire sur son espace', () => {
    renderGuard('partner', connected({ role: 'user', is_partner: true }));
    expect(screen.getByText('contenu réservé')).toBeInTheDocument();
  });
});

describe('rôle backoffice effectif', () => {
  it("considère l'administrateur applicatif comme administrateur backoffice", () => {
    expect(backofficeRoleOf({ role: 'admin', backoffice_role: 'none' })).toBe('admin');
  });

  it('ne promeut pas un compte ordinaire', () => {
    expect(backofficeRoleOf({ role: 'user', backoffice_role: 'none' })).toBe('none');
    expect(backofficeRoleOf(null)).toBe('none');
  });
});
