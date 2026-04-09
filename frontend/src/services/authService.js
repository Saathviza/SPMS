import api from './api';

/* ======================================================
   AUTH SERVICE
====================================================== */
export const authService = {
  /* ---------------- LOGIN (ALL ROLES) ---------------- */
  login: async (email, password) => {
    const response = await api.post('/auth/login', {
      email,
      password
    });

    return response.data;
  },

  /* ---------------- SCOUT REGISTRATION ---------------- */
  registerScout: async (payload) => {
    const response = await api.post('/auth/register', payload);
    return response.data;
  },

  /* ---------------- PASSWORD RECOVERY ---------------- */
  requestPasswordReset: async (email) => {
    const response = await api.post('/auth/password-reset', { email });
    return response.data;
  },

  /* ---------------- CURRENT USER ---------------- */
  getCurrentUser: () => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (err) {
      console.error('Failed to parse user from storage', err);
      return null;
    }
  },

  /* ---------------- CURRENT ROLE ---------------- */
  getRole: () => {
    return localStorage.getItem('role');
  },

  /* ---------------- IS AUTHENTICATED ---------------- */
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  /* ---------------- LOGOUT ---------------- */
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
  }
};
