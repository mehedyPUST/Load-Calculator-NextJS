// frontend/lib/auth.js
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

async function parseJson(res) {
    try {
        return await res.json();
    } catch {
        throw new Error("Invalid response from server");
    }
}

function networkError(err) {
    if (
        err.message?.includes("Failed to fetch") ||
        err.message?.includes("NetworkError") ||
        err.name === "TypeError"
    ) {
        return new Error("API not reachable. Please check your connection.");
    }
    return err;
}

// Login
export async function login(username, password) {
    try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include", // Important for cookies
            body: JSON.stringify({ username, password }),
        });
        const data = await parseJson(res);
        if (!res.ok || !data.success) {
            throw new Error(data.message || "Login failed");
        }
        return data;
    } catch (err) {
        throw networkError(err);
    }
}

// Logout
export async function logout() {
    try {
        const res = await fetch(`${API_BASE}/api/auth/logout`, {
            method: "POST",
            credentials: "include",
        });
        const data = await parseJson(res);
        if (!res.ok || !data.success) {
            throw new Error(data.message || "Logout failed");
        }
        return data;
    } catch (err) {
        throw networkError(err);
    }
}

// Check authentication status
export async function checkAuth() {
    try {
        const res = await fetch(`${API_BASE}/api/auth/check`, {
            credentials: "include",
        });
        const data = await parseJson(res);
        return data;
    } catch {
        return { authenticated: false };
    }
}

// Get current admin info
export async function getCurrentAdmin() {
    try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
            credentials: "include",
        });
        const data = await parseJson(res);
        if (!res.ok || !data.success) {
            throw new Error(data.message || "Failed to get admin info");
        }
        return data.data;
    } catch (err) {
        throw networkError(err);
    }
}