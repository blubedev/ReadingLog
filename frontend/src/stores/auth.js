import { defineStore } from 'pinia';
import { authApi } from '@/api/auth';

export const useAuthStore = defineStore('auth', {
  state: () => {
    let user = null;
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        user = JSON.parse(userStr);
      }
    } catch (error) {
      console.error('Failed to parse user from localStorage:', error);
      localStorage.removeItem('user');
    }
    return {
      user,
      token: localStorage.getItem('token') || null,
      isLoading: false,
      error: null,
    };
  },

  getters: {
    isAuthenticated: (state) => !!state.token && !!state.user,
  },

  actions: {
    async register(username, email, password) {
      this.isLoading = true;
      this.error = null;
      try {
        const data = await authApi.register(username, email, password);
        this.setAuth(data.user, data.token);
        return data;
      } catch (error) {
        const data = error.response?.data;
        this.error = data?.detail || data?.message || '登録に失敗しました';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async login(email, password) {
      this.isLoading = true;
      this.error = null;
      try {
        const data = await authApi.login(email, password);
        this.setAuth(data.user, data.token);
        return data;
      } catch (error) {
        this.error = error.response?.data?.message || 'ログインに失敗しました';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async logout() {
      try {
        await authApi.logout();
      } catch (error) {
        console.error('ログアウトエラー:', error);
      } finally {
        this.clearAuth();
      }
    },

    async fetchMe() {
      try {
        const data = await authApi.getMe();
        this.user = data.user;
        localStorage.setItem('user', JSON.stringify(data.user));
        return data;
      } catch (error) {
        this.clearAuth();
        throw error;
      }
    },

    setAuth(user, token) {
      this.user = user;
      this.token = token;
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
    },

    clearAuth() {
      this.user = null;
      this.token = null;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    },
  },
});
