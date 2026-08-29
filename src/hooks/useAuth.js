"use client";

import { useState, useEffect, useCallback } from "react";
import { login as apiLogin, logout as apiLogout, checkAuth } from "@/lib/api";
import {
  getStoredAdmin,
  getStoredToken,
  clearStoredSession,
} from "@/lib/auth";

export function useAuth() {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      // Quick local hint
      const token = getStoredToken();
      if (!token) {
        setAuthenticated(false);
        setAdmin(null);
        setLoading(false);
        return;
      }

      const result = await checkAuth();
      if (result?.authenticated && result.admin) {
        setAuthenticated(true);
        setAdmin(result.admin);
      } else {
        clearStoredSession();
        setAuthenticated(false);
        setAdmin(null);
      }
    } catch {
      // Keep stored admin optimistically if network fails
      const cached = getStoredAdmin();
      if (cached && getStoredToken()) {
        setAuthenticated(true);
        setAdmin(cached);
      } else {
        setAuthenticated(false);
        setAdmin(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (username, password) => {
    const data = await apiLogin(username, password);
    setAuthenticated(true);
    setAdmin(data.data || null);
    return data;
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setAuthenticated(false);
    setAdmin(null);
  }, []);

  return {
    admin,
    loading,
    authenticated,
    login,
    logout,
    refresh,
  };
}
