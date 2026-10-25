"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import toast from "react-hot-toast";
import {
  fetchCalculations,
  trashCalculation,
  restoreCalculation,
  purgeCalculation,
  bulkCalculations,
  emptyTrash,
} from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import ConfirmModal from "./ConfirmModal";
import SkeletonTable from "./SkeletonTable";
import {
  listPendingAsHistory,
  removePendingSave,
} from "@/lib/offlineQueue";

const TRASH_RETENTION_DAYS = null; // auto-delete disabled

function splitDateTime(iso) {
  if (!iso) return { date: "—", time: "—" };
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  return { date, time };
}

function toDayKey(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseDdMmYyyy(input) {
  const raw = (input || "").trim();
  if (!raw) return null;
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const dd = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  const yyyy = parseInt(m[3], 10);
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  const dt = new Date(yyyy, mm - 1, dd);
  if (dt.getFullYear() !== yyyy || dt.getMonth() !== mm - 1 || dt.getDate() !== dd)
    return null;
  return `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
}

function formatDateInput(value) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function daysLeftInTrash() {
  return null; // auto-expiry disabled
}

export default function HistoryList({
  open,
  onClose,
  onView,
  onEdit,
  selectedId,
  refreshKey,
  onDeleted,
  pageMode = false,
}) {
  const { isAdmin, canWrite, isAuthenticated: authOk } = useAuth();
  const { isAuthenticated } = useAuth();

  const PAGE_SIZE = 50;

  const [folder, setFolder] = useState("inbox");
  const [records, setRecords] = useState([]);
  const [inboxCount, setInboxCount] = useState(0);
  const [trashCount, setTrashCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  /** YYYY-MM-DD for native date input (server filter) */
  const [filterDate, setFilterDate] = useState("");
  /** Optional range end YYYY-MM-DD */
  const [filterDateTo, setFilterDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState(() => new Set());
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const selectAllRef = useRef(null);

  const isTrash = folder === "trash";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let offline = [];
      try {
        offline = folder === "inbox" ? await listPendingAsHistory() : [];
      } catch {
        offline = [];
      }

      let serverData = [];
      let inboxCount = 0;
      let trashCount = 0;
      let pageTotal = 0;
      let pagePages = 1;
      let pageNum = page;

      const dateOpts = {};
      if (filterDate && filterDateTo && filterDateTo !== filterDate) {
        dateOpts.from = filterDate;
        dateOpts.to = filterDateTo;
      } else if (filterDate) {
        dateOpts.date = filterDate;
      }

      try {
        const result = await fetchCalculations({
          trash: folder === "trash",
          limit: PAGE_SIZE,
          page,
          ...dateOpts,
        });
        serverData = result.data || [];
        inboxCount = result.inboxCount ?? 0;
        trashCount = result.trashCount ?? 0;
        pageTotal = result.total ?? serverData.length;
        pagePages = result.pages ?? 1;
        pageNum = result.page ?? page;
      } catch (err) {
        if (folder === "inbox" && offline.length > 0 && page === 1 && !filterDate) {
          setError("");
        } else {
          setError(err.message || "Could not load");
        }
      }

      // Offline pending only on page 1 with no date filter
      if (folder === "inbox" && page === 1 && !filterDate) {
        setRecords([...offline, ...serverData]);
        setInboxCount(inboxCount + offline.length);
        setTrashCount(trashCount);
        setTotal(pageTotal + offline.length);
      } else {
        setRecords(serverData);
        setInboxCount(inboxCount);
        setTrashCount(trashCount);
        setTotal(pageTotal);
      }
      setPages(pagePages);
      if (pageNum !== page) setPage(pageNum);
      setSelected(new Set());
    } catch (err) {
      setError(err.message || "Could not load");
      setRecords([]);
      setTotal(0);
      setPages(1);
    } finally {
      setLoading(false);
    }
  }, [folder, page, filterDate, filterDateTo]);

  useEffect(() => {
    if (!open) return;
    setSelected(new Set());
    load();
  }, [open, refreshKey, folder, page, filterDate, filterDateTo, load]);

  // List is already filtered by the server
  const filtered = records;

  const allSelected =
    filtered.length > 0 && filtered.every((r) => selected.has(r._id));
  const someSelected = selected.size > 0;
  const partialSelected = someSelected && !allSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = partialSelected;
    }
  }, [partialSelected]);

  const switchFolder = (next) => {
    if (next === folder) return;
    setFolder(next);
    setFilterDate("");
    setFilterDateTo("");
    setPage(1);
    setSelected(new Set());
    setError("");
  };

  const clearDateFilter = () => {
    setFilterDate("");
    setFilterDateTo("");
    setPage(1);
  };

  const applyDate = (fromVal, toVal = "") => {
    setFilterDate(fromVal || "");
    setFilterDateTo(toVal || "");
    setPage(1);
  };


  const toggleOne = (id) => {
    if (!isAuthenticated) {
      toast.error("Please login to select items.");
      return;
    }
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (!isAuthenticated) {
      toast.error("Please login to select items.");
      return;
    }
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map((r) => r._id)));
  };

  const removeFromLocal = (ids) => {
    const idSet = new Set(ids.map(String));
    setRecords((prev) => prev.filter((r) => !idSet.has(String(r._id))));
    ids.forEach((id) => onDeleted?.(id));
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  };

  const runConfirmed = async () => {
    if (!confirm) return;
    setBusy(true);
    setError("");
    try {
      const { type, ids } = confirm;

      if (type === "empty_trash") {
        await emptyTrash();
        const allIds = records.map(r => r._id);
        setRecords([]);
        setTrashCount(0);
        setSelected(new Set());
        allIds.forEach(id => onDeleted?.(id));
        onDeleted?.("__all_trash__");
        toast.success("Trash emptied successfully");
      } else if (type === "trash") {
        const offlineIds = ids.filter((id) => String(id).startsWith("offline-"));
        const serverIds = ids.filter((id) => !String(id).startsWith("offline-"));

        // Offline pending: delete from IndexedDB (no server trash)
        for (const oid of offlineIds) {
          const num = Number(String(oid).replace("offline-", ""));
          if (!Number.isNaN(num)) await removePendingSave(num);
        }

        if (serverIds.length === 1) await trashCalculation(serverIds[0]);
        else if (serverIds.length > 1) await bulkCalculations("trash", serverIds);

        removeFromLocal(ids);
        setInboxCount((c) => Math.max(0, c - ids.length));
        if (serverIds.length) {
          setTrashCount((c) => c + serverIds.length);
          toast.success(
            offlineIds.length
              ? `${serverIds.length} moved to trash, ${offlineIds.length} offline removed`
              : `${serverIds.length} item(s) moved to trash`
          );
        } else {
          toast.success(
            offlineIds.length === 1
              ? "Offline save removed"
              : `${offlineIds.length} offline saves removed`
          );
        }
      } else if (type === "restore") {
        if (ids.length === 1) await restoreCalculation(ids[0]);
        else await bulkCalculations("restore", ids);
        removeFromLocal(ids);
        setTrashCount((c) => Math.max(0, c - ids.length));
        setInboxCount((c) => c + ids.length);
        toast.success(`${ids.length} item(s) restored`);
      } else if (type === "purge") {
        if (ids.length === 1) await purgeCalculation(ids[0]);
        else await bulkCalculations("purge", ids);
        removeFromLocal(ids);
        setTrashCount((c) => Math.max(0, c - ids.length));
        toast.success(`${ids.length} item(s) permanently deleted`);
      }

      setConfirm(null);
      await load();
    } catch (err) {
      setError(err.message || "Action failed");
      toast.error(err.message || "Action failed");
      setConfirm(null);
      await load();
    } finally {
      setBusy(false);
    }
  };

  // Export data as JSON
  const handleExport = () => {
    try {
      const dataStr = JSON.stringify(records, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `calculations_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Export successful');
    } catch {
      toast.error('Export failed');
    }
  };

  if (!open) return null;

  return (
    <>
      <aside
        className={`${
          pageMode
            ? "w-full h-full flex flex-col bg-white shadow-xl shrink-0 overflow-hidden rounded-lg border border-slate-200"
            : "w-full sm:w-[440px] xl:w-[480px] h-full flex flex-col bg-white border-r border-slate-200 shadow-xl shrink-0 overflow-hidden rounded-none md:rounded-2xl md:border md:border-slate-200"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-3 bg-gradient-to-r from-emerald-700 to-teal-800 text-white shrink-0">
          <h2 className="text-xs md:text-sm font-black tracking-wide uppercase">
            {isTrash ? "Trash" : "History"}
          </h2>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleExport}
              disabled={records.length === 0 || loading}
              className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/30 active:scale-95 transition-all disabled:opacity-50"
              aria-label="Export data"
            >
              ⬇ Export
            </button>
            <button
              type="button"
              onClick={load}
              disabled={loading || busy}
              className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/30 active:scale-95 transition-all disabled:opacity-50"
            >
              Refresh
            </button>
            {!pageMode && (
              <button
                type="button"
                onClick={onClose}
                className="text-lg font-bold w-8 h-8 rounded-lg hover:bg-white/25 active:scale-95 transition-all leading-none"
                aria-label="Close"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Auth Status Banner */}
        {!isAuthenticated && (
          <div className="px-3 py-2 bg-amber-50 border-b border-amber-200 shrink-0">
            <p className="text-[10px] font-medium text-amber-800 text-center">
              🔒 <span className="font-bold">Read-only mode.</span> Login to manage calculations (delete, restore, trash).
            </p>
          </div>
        )}

        {/* Tabs with counts */}
        <div className="flex border-b border-slate-200 shrink-0 bg-slate-50">
          <button
            type="button"
            onClick={() => switchFolder("inbox")}
            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wide transition-all ${!isTrash
                ? "text-emerald-700 border-b-2 border-emerald-600 bg-white"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              }`}
          >
            History
            <span className="ml-1.5 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-[10px] font-black bg-slate-200 text-slate-700">
              {inboxCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => switchFolder("trash")}
            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wide transition-all ${isTrash
                ? "text-red-700 border-b-2 border-red-500 bg-white"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              }`}
          >
            Trash
            <span
              className={`ml-1.5 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-[10px] font-black ${trashCount > 0
                  ? "bg-red-100 text-red-700"
                  : "bg-slate-200 text-slate-600"
                }`}
            >
              {trashCount}
            </span>
          </button>
        </div>

        {isTrash && (
          <div className="px-3 py-2 bg-amber-50 border-b border-amber-100 shrink-0 flex items-start justify-between gap-2">
            <p className="text-[10px] font-medium text-amber-900 leading-snug">
              Deleted items stay in Trash until an admin permanently deletes them.
              Expired trash is auto-purged after the retention period (default 30 days).
              Restore to put them back in History.
            </p>
            {trashCount > 0 && isAdmin && (
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  setConfirm({
                    type: "empty_trash",
                    ids: [],
                    title: "Empty Trash?",
                    message: `Permanently delete all ${trashCount} item(s) in Trash? This cannot be undone.`,
                  })
                }
                className="shrink-0 text-[10px] font-extrabold uppercase text-red-700 hover:text-red-900 underline disabled:opacity-50"
              >
                Empty trash
              </button>
            )}
            {trashCount > 0 && isAuthenticated && !isAdmin && (
              <span className="shrink-0 text-[10px] font-medium text-amber-700">
                Admin only — permanent delete
              </span>
            )}
            {trashCount > 0 && !isAuthenticated && (
              <span className="shrink-0 text-[10px] font-medium text-amber-700">
                🔒 Login to manage trash
              </span>
            )}
          </div>
        )}

        {/* Custom date filter */}
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 shrink-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-[10px] font-bold uppercase text-slate-500 shrink-0">Date</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => applyDate(e.target.value, filterDateTo)}
              className="flex-1 min-w-[8rem] h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              aria-label="Filter from date"
            />
            <span className="text-[10px] font-bold text-slate-400">to</span>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => applyDate(filterDate, e.target.value)}
              min={filterDate || undefined}
              className="flex-1 min-w-[8rem] h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              aria-label="Filter to date"
            />
            {(filterDate || filterDateTo) ? (
              <button
                type="button"
                onClick={clearDateFilter}
                className="h-8 px-2.5 rounded-lg text-[10px] font-bold text-slate-600 border border-slate-200 bg-white hover:bg-slate-100 transition-all"
              >
                Clear
              </button>
            ) : null}
          </div>
          {filterDate ? (
            <p className="text-[10px] text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-700">
                {filterDateTo && filterDateTo !== filterDate
                  ? `${filterDate} → ${filterDateTo}`
                  : filterDate}
              </span>
              {" · "}
              <span className="font-semibold text-slate-700">{total}</span> record{total === 1 ? "" : "s"}
            </p>
          ) : null}
        </div>

        {/* Selection toolbar */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-200 bg-white shrink-0">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              ref={selectAllRef}
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              disabled={filtered.length === 0 || loading || !isAuthenticated}
              className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50"
            />
            <span className="text-[10px] font-bold text-slate-500 uppercase">
              {someSelected ? `${selected.size} selected` : "Select all"}
            </span>
          </label>

          <div className="flex-1" />

          {someSelected && !isTrash && isAuthenticated && (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                setConfirm({
                  type: "trash",
                  ids: [...selected],
                  title: "Move to Trash?",
                  message: `${selected.size} item(s) will be moved to Trash. You can restore them anytime from Trash.`,
                })
              }
              className="h-7 px-2.5 rounded-lg text-[10px] font-extrabold uppercase bg-red-600 text-white hover:bg-red-500 shadow-sm active:scale-95 transition-all disabled:opacity-50"
            >
              Move to Trash
            </button>
          )}

          {someSelected && !isTrash && !isAuthenticated && (
            <span className="text-[10px] font-bold text-amber-600">
              🔒 Login to move to trash
            </span>
          )}

          {someSelected && isTrash && isAuthenticated && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  setConfirm({
                    type: "restore",
                    ids: [...selected],
                    title: "Restore to History?",
                    message: `${selected.size} item(s) will return to History.`,
                  })
                }
                className="h-7 px-2.5 rounded-lg text-[10px] font-extrabold uppercase bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm active:scale-95 transition-all disabled:opacity-50"
              >
                Restore
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  setConfirm({
                    type: "purge",
                    ids: [...selected],
                    title: "Delete forever?",
                    message: `${selected.size} item(s) will be permanently deleted. This cannot be undone.`,
                  })
                }
                className="h-7 px-2.5 rounded-lg text-[10px] font-extrabold uppercase bg-red-700 text-white hover:bg-red-600 shadow-sm active:scale-95 transition-all disabled:opacity-50"
              >
                Delete forever
              </button>
            </div>
          )}

          {someSelected && isTrash && !isAuthenticated && (
            <span className="text-[10px] font-bold text-amber-600">
              🔒 Login to manage trash
            </span>
          )}
        </div>

        {/* List body */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading && (
            <div className="p-3">
              <SkeletonTable rows={8} columns={5} dark={false} />
            </div>
          )}
          {!loading && error && (
            <div className="px-4 py-8 text-center space-y-2">
              <p className="text-sm text-red-600 font-semibold">{error}</p>
              <button
                type="button"
                onClick={load}
                className="text-xs font-bold text-emerald-700 underline"
              >
                Try again
              </button>
            </div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <p className="text-center text-sm text-slate-500 py-10 font-medium px-4">
              {isTrash
                ? "Trash is empty."
                : filterDate
                  ? "No records for the selected date."
                  : "No saved calculations yet."}
            </p>
          )}
          {!loading && !error && filtered.length > 0 && (
            <table className="w-full table-fixed border-collapse history-mobile-table" style={{ tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: "2.25rem" }} />
                <col style={{ width: "3rem" }} />
                <col style={{ width: "4rem" }} />
                <col style={{ width: "4rem" }} />
                {isAdmin ? <col style={{ width: "4.5rem" }} /> : null}
                <col />
              </colgroup>
              <thead className="sticky top-0 z-10 bg-slate-100 shadow-sm">
                <tr className="border-b border-slate-200">
                  <th className="py-2 overflow-hidden" />
                  <th className="py-2 text-center font-bold text-slate-600 text-[10px] uppercase overflow-hidden">
                    #
                  </th>
                  <th className="py-2 text-center font-bold text-slate-600 text-[10px] uppercase overflow-hidden">
                    Date
                  </th>
                  <th className="py-2 text-center font-bold text-slate-600 text-[10px] uppercase overflow-hidden">
                    Time
                  </th>
                  {isAdmin && (
                    <th className="py-2 text-center font-bold text-slate-600 text-[10px] uppercase overflow-hidden">
                      By
                    </th>
                  )}
                  <th className="py-2 text-center font-bold text-slate-600 text-[10px] uppercase overflow-hidden">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r, index) => {
                  const { date, time } = splitDateTime(
                    r.createdAt || r.calculatedAt
                  );
                  const isActive = selectedId === r._id;
                  const checked = selected.has(r._id);
                  const left = isTrash ? daysLeftInTrash(r.deletedAt) : null;

                  return (
                    <tr
                      key={r._id}
                      className={
                        checked
                          ? "bg-sky-50 hover:bg-sky-100 transition-colors"
                          : isActive
                            ? "bg-emerald-50 hover:bg-emerald-100 transition-colors"
                            : index % 2 === 0
                              ? "bg-white hover:bg-emerald-50/70 transition-colors"
                              : "bg-slate-100/70 hover:bg-emerald-50/70 transition-colors"
                      }
                    >
                      <td className="py-2 text-center">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleOne(r._id)}
                          disabled={!isAuthenticated}
                          className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={!isAuthenticated ? "Login to select items" : ""}
                        />
                      </td>
                      <td className="py-2 text-center text-xs font-bold text-slate-600 font-mono overflow-hidden">
                        {(page - 1) * PAGE_SIZE + index + 1}
                      </td>
                      <td className="py-2 text-center text-[10px] font-semibold text-slate-800 overflow-hidden">
                        {date}
                        {r.isOffline && (
                          <span className="block text-[9px] font-bold text-amber-600">
                            Offline
                          </span>
                        )}
                        {(r.hasActiveRing ||
                          (r.feeders || []).some((f) => f.ringActive)) && (
                          <span
                            className="inline-flex mt-0.5 items-center gap-0.5 text-[8px] font-extrabold uppercase tracking-wide text-amber-800 bg-amber-100 border border-amber-300 rounded px-1"
                            title="Ring line active"
                          >
                            Ring
                          </span>
                        )}
                        {isTrash && left != null && (
                          <span
                            className={`block text-[9px] font-bold ${left <= 3 ? "text-red-600" : "text-amber-700"
                              }`}
                          >
                            {left === 0 ? "Expires today" : `${left}d left`}
                          </span>
                        )}
                      </td>
                      <td className="py-2 text-center text-[10px] font-mono font-semibold text-slate-700 overflow-hidden">
                        {time}
                      </td>
                      {isAdmin && (
                        <td className="py-2 text-center text-[9px] font-semibold text-slate-600 overflow-hidden" title={r.updatedByUsername || r.createdByUsername || ""}>
                          <span className="block truncate px-0.5">
                            {r.updatedByUsername || r.createdByUsername || "—"}
                          </span>
                        </td>
                      )}
                      <td className="py-1.5 px-1">
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => onView(r)}
                            className="min-w-[2.6rem] px-2 py-1 rounded-md bg-slate-700 hover:bg-slate-600 text-white text-[9px] font-extrabold uppercase shadow-sm active:scale-95 transition-all"
                          >
                            View
                          </button>
                          {!isTrash ? (
                            isAuthenticated && canWrite ? (
                              <>
                              <button
                                type="button"
                                onClick={() => {
                                  if (typeof onEdit === "function") onEdit(r);
                                  else if (typeof onView === "function") onView(r);
                                  else window.location.href = `/manual?edit=${encodeURIComponent(r._id)}`;
                                }}
                                className="min-w-[2.6rem] px-2 py-1 rounded-md bg-sky-600 hover:bg-sky-500 text-white text-[9px] font-extrabold uppercase shadow-sm active:scale-95 transition-all"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setConfirm({
                                    type: "trash",
                                    ids: [r._id],
                                    title: "Move to Trash?",
                                    message: `This calculation will move to Trash. You can restore it anytime.`,
                                  })
                                }
                                className="min-w-[2.6rem] px-2 py-1 rounded-md bg-red-600 hover:bg-red-500 text-white text-[9px] font-extrabold uppercase shadow-sm active:scale-95 transition-all"
                              >
                                Trash
                              </button>
                              </>
                            ) : isAuthenticated ? (
                              <span className="text-[9px] font-bold text-slate-500 px-1">View only</span>
                            ) : (
                              <span className="text-[9px] font-bold text-amber-600 px-1">
                                🔒
                              </span>
                            )
                          ) : (
                            <>
                              {isAuthenticated ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setConfirm({
                                        type: "restore",
                                        ids: [r._id],
                                        title: "Restore to History?",
                                        message:
                                          "This calculation will appear in History again.",
                                      })
                                    }
                                    className="min-w-[2.6rem] px-2 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-extrabold uppercase shadow-sm active:scale-95 transition-all"
                                  >
                                    Restore
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setConfirm({
                                        type: "purge",
                                        ids: [r._id],
                                        title: "Delete forever?",
                                        message:
                                          "This calculation will be permanently deleted. This cannot be undone.",
                                      })
                                    }
                                    className="min-w-[2.6rem] px-2 py-1 rounded-md bg-red-800 hover:bg-red-700 text-white text-[9px] font-extrabold uppercase shadow-sm active:scale-95 transition-all"
                                  >
                                    Forever
                                  </button>
                                </>
                              ) : (
                                <span className="text-[9px] font-bold text-amber-600 px-1">
                                  🔒 Login
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && !error && pages > 1 && (
          <div className="shrink-0 px-3 py-2 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 px-3 rounded-lg text-[10px] font-extrabold uppercase border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <p className="text-[10px] font-semibold text-slate-600 text-center tabular-nums">
              Page <span className="font-black text-slate-800">{page}</span> of{" "}
              <span className="font-black text-slate-800">{pages}</span>
              <span className="text-slate-400"> · </span>
              <span className="font-bold text-slate-700">{total}</span> total
            </p>
            <button
              type="button"
              disabled={page >= pages || loading}
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              className="h-8 px-3 rounded-lg text-[10px] font-extrabold uppercase border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
        {!loading && !error && pages <= 1 && total > 0 && (
          <div className="shrink-0 px-3 py-1.5 border-t border-slate-200 bg-slate-50 text-center text-[10px] font-semibold text-slate-500">
            {total} record{total === 1 ? "" : "s"}
          </div>
        )}
      </aside>

      <ConfirmModal
        open={!!confirm}
        title={confirm?.title || "Confirm"}
        message={confirm?.message || ""}
        confirmLabel={
          confirm?.type === "restore"
            ? "Restore"
            : confirm?.type === "purge" || confirm?.type === "empty_trash"
              ? "Delete forever"
              : "Move to Trash"
        }
        cancelLabel="Cancel"
        danger={confirm?.type !== "restore"}
        loading={busy}
        onConfirm={runConfirmed}
        onCancel={() => !busy && setConfirm(null)}
      />
    </>
  );
}
