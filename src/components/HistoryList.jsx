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

const TRASH_RETENTION_DAYS = 30;

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

function daysLeftInTrash(deletedAt) {
  if (!deletedAt) return null;
  const end = new Date(deletedAt);
  end.setDate(end.getDate() + TRASH_RETENTION_DAYS);
  return Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86400000));
}

export default function HistoryList({
  open,
  onClose,
  onView,
  selectedId,
  refreshKey,
  onDeleted,
}) {
  const { isAuthenticated } = useAuth();

  const [folder, setFolder] = useState("inbox");
  const [records, setRecords] = useState([]);
  const [inboxCount, setInboxCount] = useState(0);
  const [trashCount, setTrashCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [selected, setSelected] = useState(() => new Set());
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const selectAllRef = useRef(null);

  const isTrash = folder === "trash";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchCalculations({
        trash: folder === "trash",
        limit: 200,
      });
      setRecords(result.data);
      setInboxCount(result.inboxCount);
      setTrashCount(result.trashCount);
      setSelected(new Set());
    } catch (err) {
      setError(err.message || "Could not load");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [folder]);

  useEffect(() => {
    if (!open) return;
    setSearchDate("");
    setSelected(new Set());
    load();
  }, [open, refreshKey, folder, load]);

  const parsedDay = useMemo(() => parseDdMmYyyy(searchDate), [searchDate]);
  const dateInvalid = searchDate.length === 10 && !parsedDay;

  const filtered = useMemo(() => {
    if (dateInvalid) return [];
    if (!parsedDay) return records;
    return records.filter(
      (r) => toDayKey(r.createdAt || r.calculatedAt) === parsedDay
    );
  }, [records, parsedDay, dateInvalid]);

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
    setSearchDate("");
    setSelected(new Set());
    setError("");
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
        if (ids.length === 1) await trashCalculation(ids[0]);
        else await bulkCalculations("trash", ids);
        removeFromLocal(ids);
        setInboxCount((c) => Math.max(0, c - ids.length));
        setTrashCount((c) => c + ids.length);
        toast.success(`${ids.length} item(s) moved to trash`);
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
      // Refresh counts accurately
      const snap = await fetchCalculations({
        trash: folder === "trash",
        limit: 200,
      });
      setRecords(snap.data);
      setInboxCount(snap.inboxCount);
      setTrashCount(snap.trashCount);
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
      <aside className="w-full sm:w-[440px] xl:w-[480px] h-full flex flex-col bg-white border-r border-slate-200 shadow-xl shrink-0 overflow-hidden rounded-none md:rounded-2xl md:border md:border-slate-200">
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
            <button
              type="button"
              onClick={onClose}
              className="text-lg font-bold w-8 h-8 rounded-lg hover:bg-white/25 active:scale-95 transition-all leading-none"
              aria-label="Close"
            >
              ×
            </button>
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
              Deleted items stay here for {TRASH_RETENTION_DAYS} days, then are
              removed automatically. Restore to put them back in History.
            </p>
            {trashCount > 0 && isAuthenticated && (
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
            {trashCount > 0 && !isAuthenticated && (
              <span className="shrink-0 text-[10px] font-medium text-amber-700">
                🔒 Login to empty trash
              </span>
            )}
          </div>
        )}

        {/* Date search */}
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              placeholder="Search date DD/MM/YYYY"
              value={searchDate}
              onChange={(e) => setSearchDate(formatDateInput(e.target.value))}
              maxLength={10}
              className={`flex-1 min-w-0 h-8 px-2 rounded-lg border bg-white text-xs font-semibold font-mono focus:outline-none focus:ring-2 transition-all ${dateInvalid
                  ? "border-red-400 text-red-700 focus:ring-red-500/30"
                  : "border-slate-200 text-slate-800 focus:ring-emerald-500/30 focus:border-emerald-500"
                }`}
            />
            {searchDate ? (
              <button
                type="button"
                onClick={() => setSearchDate("")}
                className="h-8 px-2.5 rounded-lg text-[10px] font-bold text-slate-600 border border-slate-200 bg-white hover:bg-slate-100 transition-all"
              >
                Clear
              </button>
            ) : null}
          </div>
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
                  message: `${selected.size} item(s) will be moved to Trash. You can restore them within ${TRASH_RETENTION_DAYS} days.`,
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
            <div className="flex flex-col items-center justify-center py-10">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-center text-sm text-slate-500 mt-3 font-medium">
                Loading…
              </p>
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
                : parsedDay
                  ? "No records on this date."
                  : "No saved calculations yet."}
            </p>
          )}
          {!loading && !error && filtered.length > 0 && (
            <table className="w-full table-fixed border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-100 shadow-sm">
                <tr className="border-b border-slate-200">
                  <th className="w-[10%] py-2" />
                  <th className="w-[8%] py-2 text-center font-bold text-slate-600 text-[10px] uppercase">
                    #
                  </th>
                  <th className="w-[22%] py-2 text-center font-bold text-slate-600 text-[10px] uppercase">
                    Date
                  </th>
                  <th className="w-[18%] py-2 text-center font-bold text-slate-600 text-[10px] uppercase">
                    Time
                  </th>
                  <th className="w-[42%] py-2 text-center font-bold text-slate-600 text-[10px] uppercase">
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
                          ? "bg-sky-50"
                          : isActive
                            ? "bg-emerald-50"
                            : index % 2 === 0
                              ? "bg-white hover:bg-slate-50"
                              : "bg-slate-50/40 hover:bg-slate-50"
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
                      <td className="py-2 text-center text-xs font-bold text-slate-600 font-mono">
                        {index + 1}
                      </td>
                      <td className="py-2 text-center text-[10px] font-semibold text-slate-800">
                        {date}
                        {isTrash && left != null && (
                          <span
                            className={`block text-[9px] font-bold ${left <= 3 ? "text-red-600" : "text-amber-700"
                              }`}
                          >
                            {left === 0 ? "Expires today" : `${left}d left`}
                          </span>
                        )}
                      </td>
                      <td className="py-2 text-center text-[10px] font-mono font-semibold text-slate-700">
                        {time}
                      </td>
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
                            isAuthenticated ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setConfirm({
                                    type: "trash",
                                    ids: [r._id],
                                    title: "Move to Trash?",
                                    message: `This calculation will move to Trash and can be restored within ${TRASH_RETENTION_DAYS} days.`,
                                  })
                                }
                                className="min-w-[2.6rem] px-2 py-1 rounded-md bg-red-600 hover:bg-red-500 text-white text-[9px] font-extrabold uppercase shadow-sm active:scale-95 transition-all"
                              >
                                Trash
                              </button>
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