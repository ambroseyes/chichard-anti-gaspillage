import { request, setAccessToken } from './http';

/**
 * Session utilisateur. `me()` est mis en cache le temps d'un tour de boucle :
 * plusieurs composants qui la demandent en même temps ne déclenchent qu'un appel.
 */
let inflight = null;

export const auth = {
  async register(payload) {
    const body = await request('/api/auth/register', { method: 'POST', body: payload });
    setAccessToken(body.access_token);
    return body.user;
  },

  async login(email, password) {
    const body = await request('/api/auth/login', { method: 'POST', body: { email, password } });
    setAccessToken(body.access_token);
    return body.user;
  },

  async me() {
    inflight ??= request('/api/auth/me')
      .then(({ data }) => data)
      .finally(() => {
        inflight = null;
      });
    return inflight;
  },

  /** Met à jour le profil. Seuls les champs éditables par l'utilisateur sont acceptés. */
  async updateMe(payload) {
    const { data } = await request('/api/auth/me', { method: 'PATCH', body: payload });
    return data;
  },

  async changePassword(currentPassword, newPassword) {
    await request('/api/auth/change-password', {
      method: 'POST',
      body: { current_password: currentPassword, new_password: newPassword },
    });
  },

  async forgotPassword(email) {
    await request('/api/auth/forgot-password', { method: 'POST', body: { email } });
  },

  async resetPassword(token, password) {
    await request('/api/auth/reset-password', { method: 'POST', body: { token, password } });
  },

  async logout() {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } finally {
      setAccessToken(null);
    }
  },
};
