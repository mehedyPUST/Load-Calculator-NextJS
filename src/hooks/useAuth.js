// frontend/hooks/useAuth.js
"use client";

import { useState, useEffect, useCallback } from "react";
import { checkAuth, login, logout } from "@/lib/auth";

export function useAuth() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const checkAuthStatus = useCallback(async () => {
        try {
            setLoading(true);
            const result = await checkAuth();
            setIsAuthenticated(result.authenticated);
            setAdmin(result.admin || null);
            setError(null);
        } catch (err) {
            setIsAuthenticated(false);
            setAdmin(null);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleLogin = useCallback(async (username, password) => {
        try {
            setLoading(true);
            setError(null);
            const result = await login(username, password);
            setIsAuthenticated(true);
            setAdmin(result.data);
            return { success: true, data: result.data };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, []);

    const handleLogout = useCallback(async () => {
        try {
            setLoading(true);
            await logout();
            setIsAuthenticated(false);
            setAdmin(null);
            setError(null);
            return { success: true };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        checkAuthStatus();
    }, [checkAuthStatus]);

    return {
        isAuthenticated,
        admin,
        loading,
        error,
        login: handleLogin,
        logout: handleLogout,
        checkAuth: checkAuthStatus,
    };
}