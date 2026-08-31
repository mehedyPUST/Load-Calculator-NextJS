/**
 * Offline queue for calculation payloads (IndexedDB).
 * Survives refresh; cleared after successful sync.
 */

const DB_NAME = "wzpdcl-load-calculator";
const DB_VERSION = 1;
const STORE = "pending_saves";

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB not available"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error || new Error("IndexedDB open failed"));
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const os = db.createObjectStore(STORE, {
          keyPath: "id",
          autoIncrement: true,
        });
        os.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
  });
}

function txDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error("Transaction aborted"));
  });
}

/** @param {object} payload calculation payload */
export async function enqueuePendingSave(payload) {
  const db = await openDB();
  const tx = db.transaction(STORE, "readwrite");
  const store = tx.objectStore(STORE);
  const record = {
    payload,
    createdAt: new Date().toISOString(),
    attempts: 0,
  };
  const addReq = store.add(record);
  const id = await new Promise((resolve, reject) => {
    addReq.onsuccess = () => resolve(addReq.result);
    addReq.onerror = () => reject(addReq.error);
  });
  await txDone(tx);
  db.close();
  return id;
}

export async function listPendingSaves() {
  const db = await openDB();
  const tx = db.transaction(STORE, "readonly");
  const store = tx.objectStore(STORE);
  const req = store.getAll();
  const rows = await new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
  await txDone(tx);
  db.close();
  return rows.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export async function countPendingSaves() {
  const db = await openDB();
  const tx = db.transaction(STORE, "readonly");
  const store = tx.objectStore(STORE);
  const req = store.count();
  const n = await new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result || 0);
    req.onerror = () => reject(req.error);
  });
  await txDone(tx);
  db.close();
  return n;
}

export async function removePendingSave(id) {
  const db = await openDB();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).delete(id);
  await txDone(tx);
  db.close();
}

export async function bumpAttempt(id) {
  const db = await openDB();
  const tx = db.transaction(STORE, "readwrite");
  const store = tx.objectStore(STORE);
  const getReq = store.get(id);
  const row = await new Promise((resolve, reject) => {
    getReq.onsuccess = () => resolve(getReq.result);
    getReq.onerror = () => reject(getReq.error);
  });
  if (row) {
    row.attempts = (row.attempts || 0) + 1;
    store.put(row);
  }
  await txDone(tx);
  db.close();
}

/** True if error looks like offline / network failure (not 401/400) */
export function isOfflineError(err) {
  if (!err) return false;
  const msg = String(err.message || err);
  if (
    msg.includes("Failed to fetch") ||
    msg.includes("NetworkError") ||
    msg.includes("Cannot reach API") ||
    msg.includes("API not reachable") ||
    msg.includes("Load failed") ||
    msg.includes("network")
  ) {
    return true;
  }
  if (err.name === "TypeError" && msg.toLowerCase().includes("fetch")) {
    return true;
  }
  return false;
}
