// frontend/lib/api.js
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

function url(path) {
  return `${API_BASE}${path}`;
}

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
    return new Error("API not reachable. Check deployment and MONGODB_URI.");
  }
  return err;
}

// Helper for fetch with credentials
async function fetchWithCredentials(url, options = {}) {
  return fetch(url, {
    ...options,
    credentials: "include", // Include cookies
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
}

export async function saveCalculation(payload) {
  try {
    const res = await fetchWithCredentials(url("/api/calculations"), {
      method: "POST",
      body: JSON.stringify(payload),
    });
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
    throw networkError(err);
  }
}

export async function fetchCalculations(opts = {}) {
  const trash = opts.trash === true;
  const limit = opts.limit ?? 200;
  try {
    const qs = new URLSearchParams({
      limit: String(limit),
      ...(trash ? { trash: "1" } : {}),
    });
    const res = await fetchWithCredentials(url(`/api/calculations?${qs}`), {
      method: "GET",
      cache: "no-store",
    });
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
    throw networkError(err);
  }
}

export async function trashCalculation(id) {
  try {
    const res = await fetchWithCredentials(url(`/api/calculations/${id}`), {
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
    throw networkError(err);
  }
}

export async function purgeCalculation(id) {
  try {
    const res = await fetchWithCredentials(url(`/api/calculations/${id}?permanent=1`), {
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
    throw networkError(err);
  }
}

export async function restoreCalculation(id) {
  try {
    const res = await fetchWithCredentials(url(`/api/calculations/${id}`), {
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
    throw networkError(err);
  }
}

export async function bulkCalculations(action, ids) {
  try {
    const res = await fetchWithCredentials(url("/api/calculations"), {
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
    throw networkError(err);
  }
}

export async function emptyTrash() {
  try {
    const res = await fetchWithCredentials(url("/api/calculations"), {
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
    throw networkError(err);
  }
}

export async function deleteCalculation(id) {
  return purgeCalculation(id);
}