import { useState, useEffect } from 'react';
import { User } from '../types/index.js';
import { authApi, setTokens, getAccessToken, getRefreshToken } from '../api/index.js';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

let listeners: (() => void)[] = [];
let state: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: !!getAccessToken(),
};

function notify() {
  listeners.forEach((listener) => listener());
}

export function useAuth() {
  const [, setTrigger] = useState(0);

  useEffect(() => {
    const listener = () => setTrigger((t) => t + 1);
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  return {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    login,
    logout,
    hasPermission,
    hasRole,
    checkAuth,
  };
}

let authCheckPromise: Promise<User | null> | null = null;

export async function checkAuth(): Promise<User | null> {
  if (!getAccessToken()) {
    state = { user: null, isAuthenticated: false, isLoading: false };
    notify();
    return null;
  }

  if (authCheckPromise) {
    return authCheckPromise;
  }

  state.isLoading = true;
  notify();

  authCheckPromise = (async () => {
    try {
      const user = await authApi.getMe();
      state = { user, isAuthenticated: true, isLoading: false };
      notify();
      return user;
    } catch {
      setTokens(null, null);
      state = { user: null, isAuthenticated: false, isLoading: false };
      notify();
      return null;
    } finally {
      authCheckPromise = null;
    }
  })();

  return authCheckPromise;
}

export async function login(credentials: { email: string; password: string }) {
  state.isLoading = true;
  notify();
  try {
    const res = await authApi.login(credentials);
    setTokens(res.accessToken, res.refreshToken);
    state = {
      user: res.user,
      isAuthenticated: true,
      isLoading: false,
    };
    notify();
    return res.user;
  } catch (err) {
    state.isLoading = false;
    notify();
    throw err;
  }
}

export async function logout() {
  const refresh = getRefreshToken();
  if (refresh) {
    try {
      await authApi.logout(refresh);
    } catch {
      // Continue client logout
    }
  }
  setTokens(null, null);
  state = { user: null, isAuthenticated: false, isLoading: false };
  notify();
}

export function hasPermission(permission: string): boolean {
  if (!state.user) return false;
  const userRoles = Array.isArray(state.user.roles)
    ? state.user.roles.map((r) => (typeof r === 'string' ? r : (r as { name: string }).name))
    : [];
  if (userRoles.includes('SUPER_ADMIN')) return true;
  return state.user.permissions?.includes(permission) ?? false;
}

export function hasRole(role: string): boolean {
  if (!state.user) return false;
  const userRoles = Array.isArray(state.user.roles)
    ? state.user.roles.map((r) => (typeof r === 'string' ? r : (r as { name: string }).name))
    : [];
  if (userRoles.includes('SUPER_ADMIN')) return true;
  return userRoles.includes(role);
}

// Initial check on load & cross-tab sync
if (typeof window !== 'undefined') {
  if (getAccessToken()) {
    checkAuth();
  }

  window.addEventListener('storage', (e) => {
    if (e.key === 'fs_access_token' || e.key === 'fs_refresh_token') {
      const currentToken = getAccessToken();
      if (!currentToken) {
        state = { user: null, isAuthenticated: false, isLoading: false };
        notify();
      } else if (!state.user) {
        checkAuth();
      }
    }
  });
}
