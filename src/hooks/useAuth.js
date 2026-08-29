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
      const token = getStoredToken();
      if (!token) {
        setAuthenticated(false);
        setAdmin(null);
        return;
      }

      const result = await checkAuth();
      if (result?.authenticated && (result.admin || result.data)) {
        setAuthenticated(true);
        setAdmin(result.admin || result.data);
      } else {
        clearStoredSession();
        setAuthenticated(false);
        setAdmin(null);
      }
    } catch {
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
    try {
      await apiLogout();
    } finally {
      setAuthenticated(false);
      setAdmin(null);
    }
  }, []);

  return {
    admin,
    loading,
    authenticated,
    /** alias used by older components */
    isAuthenticated: authenticated,
    login,
    logout,
    refresh,
  };
}
