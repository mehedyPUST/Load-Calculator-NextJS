// frontend/lib/api.js
console.log('API_BASE:', process.env.NEXT_PUBLIC_API_URL);

function url(path) {
  // If API_BASE is empty, use relative path (Next.js API routes)
  if (!API_BASE) {
    return path;
  }
  return `${API_BASE}${path}`;
}

async function parseJson(res) {
  try {
    const text = await res.text();
    if (!text) {
      throw new Error("Empty response from server");
    }
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
    }
  } catch (err) {
    if (err.message.includes("Invalid JSON")) {
      throw err;
    }
    throw new Error("Invalid response from server");
  }
}

function networkError(err) {
  if (
    err.message?.includes("Failed to fetch") ||
    err.message?.includes("NetworkError") ||
    err.name === "TypeError"
  ) {
    const baseUrl = API_BASE || "Next.js API routes";
    return new Error(`API not reachable. Check that ${baseUrl} is accessible.`);
  }
  return err;
}

// Helper for fetch with credentials
async function fetchWithCredentials(url_, options = {}) {
  return fetch(url_, {
    ...options,
    credentials: "include", // Include cookies for auth
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
}

// ============================================
// CALCULATION API FUNCTIONS
// ============================================

/**
 * Save a calculation to the database
 * @param {Object} payload - Calculation data
 * @returns {Promise<Object>} - Saved calculation
 */
export async function saveCalculation(payload) {
  try {
    const url_ = url("/api/calculations");
    console.log(`📤 Sending to: ${url_}`);
    console.log("📦 Payload:", payload);

    const res = await fetchWithCredentials(url_, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    console.log(`📥 Response status: ${res.status}`);

    const data = await parseJson(res);
    if (!res.ok || !data.success) {
      // Handle 401 specifically
      if (res.status === 401) {
        throw new Error("Please log in to save calculations.");
      }
      throw new Error(data.message || "Save failed");
    }
    return data;
  } catch (err) {
    console.error("❌ Save error:", err);
    throw networkError(err);
  }
}

/**
 * Fetch calculations from the database
 * @param {Object} opts - Options { trash?: boolean, limit?: number }
 * @returns {Promise<{ data: any[], inboxCount: number, trashCount: number, isAuthenticated?: boolean }>}
 */
export async function fetchCalculations(opts = {}) {
  const trash = opts.trash === true;
  const limit = opts.limit ?? 200;
  try {
    const qs = new URLSearchParams({
      limit: String(limit),
      ...(trash ? { trash: "1" } : {}),
    });
    const url_ = url(`/api/calculations?${qs}`);
    console.log(`📤 Fetching: ${url_}`);

    const res = await fetchWithCredentials(url_, {
      method: "GET",
      cache: "no-store",
    });

    console.log(`📥 Response status: ${res.status}`);

    const data = await parseJson(res);
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to load history");
    }
    return {
      data: data.data || [],
      inboxCount: data.inboxCount ?? 0,
      trashCount: data.trashCount ?? 0,
      isAuthenticated: data.isAuthenticated ?? false,
    };
  } catch (err) {
    console.error("❌ Fetch error:", err);
    throw networkError(err);
  }
}

/**
 * Move a calculation to trash (soft delete)
 * @param {string} id - Calculation ID
 * @returns {Promise<Object>}
 */
export async function trashCalculation(id) {
  try {
    const url_ = url(`/api/calculations/${id}`);
    console.log(`📤 Moving to trash: ${url_}`);

    const res = await fetchWithCredentials(url_, {
      method: "DELETE",
    });
    const data = await parseJson(res);
    if (!res.ok || !data.success) {
      if (res.status === 401) {
        throw new Error("Please log in to move items to trash.");
      }
      throw new Error(data.message || "Move to trash failed");
    }
    return data;
  } catch (err) {
    console.error("❌ Trash error:", err);
    throw networkError(err);
  }
}

/**
 * Permanently delete a calculation from trash
 * @param {string} id - Calculation ID
 * @returns {Promise<Object>}
 */
export async function purgeCalculation(id) {
  try {
    const url_ = url(`/api/calculations/${id}?permanent=1`);
    console.log(`📤 Permanently deleting: ${url_}`);

    const res = await fetchWithCredentials(url_, {
      method: "DELETE",
    });
    const data = await parseJson(res);
    if (!res.ok || !data.success) {
      if (res.status === 401) {
        throw new Error("Please log in to permanently delete items.");
      }
      throw new Error(data.message || "Delete failed");
    }
    return data;
  } catch (err) {
    console.error("❌ Purge error:", err);
    throw networkError(err);
  }
}

/**
 * Restore a calculation from trash
 * @param {string} id - Calculation ID
 * @returns {Promise<Object>}
 */
export async function restoreCalculation(id) {
  try {
    const url_ = url(`/api/calculations/${id}`);
    console.log(`📤 Restoring: ${url_}`);

    const res = await fetchWithCredentials(url_, {
      method: "PATCH",
      body: JSON.stringify({ action: "restore" }),
    });
    const data = await parseJson(res);
    if (!res.ok || !data.success) {
      if (res.status === 401) {
        throw new Error("Please log in to restore items.");
      }
      throw new Error(data.message || "Restore failed");
    }
    return data;
  } catch (err) {
    console.error("❌ Restore error:", err);
    throw networkError(err);
  }
}

/**
 * Perform bulk operations on calculations
 * @param {string} action - 'trash' | 'restore' | 'purge'
 * @param {string[]} ids - Array of calculation IDs
 * @returns {Promise<Object>}
 */
export async function bulkCalculations(action, ids) {
  try {
    const url_ = url("/api/calculations");
    console.log(`📤 Bulk action: ${action} on ${ids.length} items`);

    const res = await fetchWithCredentials(url_, {
      method: "POST",
      body: JSON.stringify({ action, ids }),
    });
    const data = await parseJson(res);
    if (!res.ok || !data.success) {
      if (res.status === 401) {
        throw new Error("Please log in to perform bulk actions.");
      }
      throw new Error(data.message || "Bulk action failed");
    }
    return data;
  } catch (err) {
    console.error("❌ Bulk error:", err);
    throw networkError(err);
  }
}

/**
 * Empty the entire trash
 * @returns {Promise<Object>}
 */
export async function emptyTrash() {
  try {
    const url_ = url("/api/calculations");
    console.log(`📤 Emptying trash`);

    const res = await fetchWithCredentials(url_, {
      method: "POST",
      body: JSON.stringify({ action: "empty_trash" }),
    });
    const data = await parseJson(res);
    if (!res.ok || !data.success) {
      if (res.status === 401) {
        throw new Error("Please log in to empty trash.");
      }
      throw new Error(data.message || "Empty trash failed");
    }
    return data;
  } catch (err) {
    console.error("❌ Empty trash error:", err);
    throw networkError(err);
  }
}

/**
 * Alias for purgeCalculation - for backward compatibility
 * @param {string} id - Calculation ID
 * @returns {Promise<Object>}
 */
export async function deleteCalculation(id) {
  return purgeCalculation(id);
}

// ============================================
// AUTHENTICATION API FUNCTIONS
// ============================================

/**
 * Login with username and password
 * @param {string} username - Admin username
 * @param {string} password - Admin password
 * @returns {Promise<Object>}
 */
export async function login(username, password) {
  try {
    const url_ = url("/api/auth/login");
    console.log(`📤 Logging in: ${url_}`);

    const res = await fetch(url_, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });
    const data = await parseJson(res);
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Login failed");
    }
    return data;
  } catch (err) {
    console.error("❌ Login error:", err);
    throw networkError(err);
  }
}

/**
 * Logout the current user
 * @returns {Promise<Object>}
 */
export async function logout() {
  try {
    const url_ = url("/api/auth/logout");
    console.log(`📤 Logging out: ${url_}`);

    const res = await fetch(url_, {
      method: "POST",
      credentials: "include",
    });
    const data = await parseJson(res);
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Logout failed");
    }
    return data;
  } catch (err) {
    console.error("❌ Logout error:", err);
    throw networkError(err);
  }
}

/**
 * Check if the user is authenticated
 * @returns {Promise<{ authenticated: boolean, admin?: Object }>}
 */
export async function checkAuth() {
  try {
    const url_ = url("/api/auth/check");
    console.log(`📤 Checking auth: ${url_}`);

    const res = await fetch(url_, {
      credentials: "include",
    });
    const data = await parseJson(res);
    return data;
  } catch (err) {
    console.error("❌ Auth check error:", err);
    return { authenticated: false };
  }
}

/**
 * Get current admin information
 * @returns {Promise<Object>}
 */
export async function getCurrentAdmin() {
  try {
    const url_ = url("/api/auth/me");
    console.log(`📤 Getting admin info: ${url_}`);

    const res = await fetch(url_, {
      credentials: "include",
    });
    const data = await parseJson(res);
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to get admin info");
    }
    return data.data;
  } catch (err) {
    console.error("❌ Get admin error:", err);
    throw networkError(err);
  }
}

/**
 * Register a new admin (first admin only or with secret)
 * @param {Object} adminData - { username, password, email, secret? }
 * @returns {Promise<Object>}
 */
export async function registerAdmin(adminData) {
  try {
    const url_ = url("/api/auth/register");
    console.log(`📤 Registering admin: ${url_}`);

    const res = await fetch(url_, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(adminData),
    });
    const data = await parseJson(res);
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Registration failed");
    }
    return data;
  } catch (err) {
    console.error("❌ Register error:", err);
    throw networkError(err);
  }
}

// ============================================
// CREATE API OBJECT
// ============================================

const api = {
  // Calculation functions
  saveCalculation,
  fetchCalculations,
  trashCalculation,
  purgeCalculation,
  restoreCalculation,
  bulkCalculations,
  emptyTrash,
  deleteCalculation,

  // Auth functions
  login,
  logout,
  checkAuth,
  getCurrentAdmin,
  registerAdmin,
};

// ============================================
// EXPORT AS MODULE DEFAULT
// ============================================

export default api;