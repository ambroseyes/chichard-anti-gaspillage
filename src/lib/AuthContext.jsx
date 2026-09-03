import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/api';
import { getAccessToken, onTokenChange } from '@/api/http';

const AuthContext = createContext(null);

/**
 * Source unique de l'identité. Les écrans lisent `useAuth()` ou
 * `useCurrentUser()` : plus aucun composant ne recharge l'utilisateur pour son
 * propre compte.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(getAccessToken() ? 'loading' : 'anonymous');
  const queryClient = useQueryClient?.() ?? null;

  const load = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null);
      setStatus('anonymous');
      return null;
    }
    try {
      const me = await api.auth.me();
      setUser(me);
      setStatus('authenticated');
      return me;
    } catch (error) {
      setUser(null);
      setStatus(error instanceof ApiError && error.isAuthError ? 'anonymous' : 'error');
      return null;
    }
  }, []);

  useEffect(() => {
    load();
    // Une session ouverte ou fermée dans un autre onglet se répercute ici.
    return onTokenChange(() => load());
  }, [load]);

  const login = useCallback(async (email, password) => {
    const me = await api.auth.login(email, password);
    setUser(me);
    setStatus('authenticated');
    queryClient?.clear();
    return me;
  }, [queryClient]);

  const register = useCallback(async (payload) => {
    const me = await api.auth.register(payload);
    setUser(me);
    setStatus('authenticated');
    return me;
  }, []);

  const logout = useCallback(async () => {
    await logout();
    setUser(null);
    setStatus('anonymous');
    queryClient?.clear();
  }, [queryClient]);

  /** Applique une mise à jour de profil et rafraîchit l'état partagé. */
  const updateProfile = useCallback(async (payload) => {
    const me = await api.auth.updateMe(payload);
    setUser(me);
    return me;
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      isLoading: status === 'loading',
      isAuthenticated: status === 'authenticated',
      login,
      register,
      logout,
      updateProfile,
      reload: load,
    }),
    [user, status, login, register, logout, updateProfile, load],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth doit être utilisé dans un AuthProvider');
  return context;
}

/** Raccourci pour les écrans qui n'ont besoin que de l'utilisateur courant. */
export function useCurrentUser() {
  const { user, isLoading, isAuthenticated } = useAuth();
  return { user, isLoading, isAuthenticated };
}
