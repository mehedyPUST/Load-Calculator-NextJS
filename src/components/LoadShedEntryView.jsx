"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { fetchCalculations, saveCalculation, updateCalculation } from "@/lib/api";
import { FEEDERS, LS_PROTECTED_IDS, BOTTAIL_11KV_IDS } from "@/lib/constants";
import { suggestProportionalLs } from "@/lib/calculations";
import {
  LOGSHEET_SLOTS,
  recordSlotLabel,
  formatDayLabel,
} from "@/lib/logsheetSlots";
import { useAuth } from "@/hooks/useAuth";

function todayKey() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(
    n.getDate()
  ).padStart(2, "0")}`;
}

function shiftYmd(ymd, delta) {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(
    dt.getDate()
  ).padStart(2, "0")}`;
}

function round1(n) {
  if (!Number.isFinite(n)) return 0;
  return Math.round((n + Number.EPSILON) * 10) / 10;
}

function formatMW(v) {
  if (v == null || !Number.isFinite(Number(v))) return "—";
  return round1(Number(v)).toFixed(1);
}

function slotDateIso(dayKey, slot) {
  const [y, m, d] = dayKey.split("-").map(Number);
  const dt = new Date(y, m - 1, d, slot.hour, slot.minute, 0, 0);
  return dt.toISOString();
}

function emptyLsMap() {
  const m = {};
  FEEDERS.forEach((f) => {
    m[f.id] = "";
  });
  return m;
}

function slotStateFromRecord(rec) {
  const ls = emptyLsMap();
  if (rec?.feeders) {
    for (const f of rec.feeders) {
      if (f?.id != null) {
        const v = Number(f.lsMW);
        ls[f.id] = Number.isFinite(v) && v > 0 ? String(round1(v)) : "";
      }
    }
  }
  const all =
    rec?.allotment != null && Number.isFinite(Number(rec.allotment))
      ? String(round1(Number(rec.allotment)))
      : "";
  return {
    recordId: rec?._id || null,
    totalMW: Number(rec?.totalMW) || 0,
    busVoltages: rec?.busVoltages || { bus1: 0, bus2: 0 },
    feedersRaw: rec?.feeders || [],
    hasLoad: !!(
      rec &&
      (rec.totalMW > 0 || (rec.feeders || []).some((f) => (f.mw || 0) > 0))
    ),
    allotment: all,
    ls,
    dirty: false,
  };
}

function emptySlotState() {
  return {
    recordId: null,
    totalMW: 0,
    busVoltages: { bus1: 0, bus2: 0 },
    feedersRaw: [],
    hasLoad: false,
    allotment: "",
    ls: emptyLsMap(),
    dirty: false,
  };
}

const SN_W = 28;
const TIME_W = 56;

const FEEDER_COL = {
  1: { head: "bg-rose-900", cell: "bg-rose-50/80", input: "border-rose-200 focus:ring-rose-400" },
  2: { head: "bg-orange-900", cell: "bg-orange-50/80", input: "border-orange-200 focus:ring-orange-400" },
  3: { head: "bg-amber-800", cell: "bg-amber-50/80", input: "border-amber-200 focus:ring-amber-400" },
  4: { head: "bg-lime-900", cell: "bg-lime-50/80", input: "border-lime-200 focus:ring-lime-400" },
  5: { head: "bg-cyan-900", cell: "bg-cyan-50/80", input: "border-cyan-200 focus:ring-cyan-400" },
  6: { head: "bg-blue-900", cell: "bg-blue-50/80", input: "border-blue-200 focus:ring-blue-400" },
  7: { head: "bg-indigo-900", cell: "bg-indigo-50/80", input: "border-indigo-200 focus:ring-indigo-400" },
  8: { head: "bg-pink-900", cell: "bg-pink-50/80", input: "border-pink-200 focus:ring-pink-400" },
  9: { head: "bg-fuchsia-900", cell: "bg-fuchsia-50/80", input: "border-fuchsia-200 focus:ring-fuchsia-400" },
};

export default function LoadShedEntryView() {
  const { isAuthenticated } = useAuth();
  const [dayKey, setDayKey] = useState(todayKey);
  const [loading, setLoading] = useState(true);
  const [savingSlot, setSavingSlot] = useState(null);
  /** Slot labels unlocked for editing */
  const [editingRows, setEditingRows] = useState({});
  const [slots, setSlots] = useState(() => {
    const init = {};
    for (const s of LOGSHEET_SLOTS) init[s.label] = emptySlotState();
    return init;
  });

  const loadDay = useCallback(async (key) => {
    setLoading(true);
    try {
      const res = await fetchCalculations({ date: key, limit: "all" });
      const docs = res?.data || res?.calculations || [];
      const bySlot = {};
      for (const s of LOGSHEET_SLOTS) bySlot[s.label] = emptySlotState();

      for (const doc of docs) {
        const label = recordSlotLabel(doc);
        if (!label || !bySlot[label]) continue;
        const existing = bySlot[label];
        if (existing.recordId && !doc.isHourly && existing.hasLoad) continue;
        bySlot[label] = slotStateFromRecord(doc);
      }
      setSlots(bySlot);
      setEditingRows({});
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to load day data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDay(dayKey);
  }, [dayKey, loadDay]);

  const setSlotField = (label, patch) => {
    setSlots((prev) => ({
      ...prev,
      [label]: { ...prev[label], ...patch, dirty: true },
    }));
  };

  const setLs = (label, feederId, value) => {
    setSlots((prev) => {
      const cur = prev[label] || emptySlotState();
      return {
        ...prev,
        [label]: {
          ...cur,
          ls: { ...cur.ls, [feederId]: value },
          dirty: true,
        },
      };
    });
  };

  const totalsFor = (st) => {
    let totalLs = 0;
    const feederMw = {};
    const feederLs = {};
    for (const f of FEEDERS) {
      const fromRaw = st.feedersRaw?.find((x) => x.id === f.id);
      feederMw[f.id] = Number(fromRaw?.mw) || 0;
      const lsV = parseFloat(st.ls[f.id]) || 0;
      feederLs[f.id] = lsV;
      totalLs += lsV;
    }
    const demand =
      st.totalMW || Object.values(feederMw).reduce((a, b) => a + b, 0);
    const allot = parseFloat(st.allotment);
    const hasAllot = Number.isFinite(allot) && allot >= 0;
    const shortage = hasAllot ? Math.max(0, demand - allot) : 0;
    const remaining = hasAllot ? Math.max(0, shortage - totalLs) : 0;
    const h3t3Ls =
      (feederLs[8] || 0) + (feederLs[9] || 0);
    return {
      demand: round1(demand),
      totalLs: round1(totalLs),
      allotment: hasAllot ? round1(allot) : null,
      shortage: round1(shortage),
      remaining: round1(remaining),
      feederMw,
      h3t3Ls: round1(h3t3Ls),
    };
  };

  const daySummary = useMemo(() => {
    let lsSum = 0;
    let shortageSlots = 0;
    let slotsWithLs = 0;
    let dirtyCount = 0;
    for (const s of LOGSHEET_SLOTS) {
      const st = slots[s.label] || emptySlotState();
      const t = totalsFor(st);
      lsSum += t.totalLs;
      if (t.shortage > 0.05) shortageSlots++;
      if (t.totalLs > 0.05) slotsWithLs++;
      if (st.dirty) dirtyCount++;
    }
    return {
      lsSum: round1(lsSum),
      shortageSlots,
      slotsWithLs,
      dirtyCount,
    };
  }, [slots]);

  const enableRowEdit = (label) => {
    setEditingRows((prev) => ({ ...prev, [label]: true }));
  };

  const disableRowEdit = (label) => {
    setEditingRows((prev) => {
      const next = { ...prev };
      delete next[label];
      return next;
    });
  };

  const autoFillSlot = (label) => {
    const st = slots[label] || emptySlotState();
    const t = totalsFor(st);
    if (t.allotment == null) {
      toast.error("Set allotment (MW) first for this slot.");
      return;
    }
    if (t.demand <= 0) {
      toast.error("No load data for this slot — enter load in Calculator / Manual first.");
      return;
    }
    const feeders = FEEDERS.map((f) => ({
      id: f.id,
      mw: t.feederMw[f.id] || 0,
    }));
    const suggested = suggestProportionalLs(feeders, t.allotment, [
      ...LS_PROTECTED_IDS,
    ]);
    const ls = emptyLsMap();
    for (const f of FEEDERS) {
      const v = suggested[f.id] || 0;
      ls[f.id] = v > 0.05 ? String(round1(v)) : "";
    }
    setSlotField(label, { ls });
    enableRowEdit(label);
    const sum = Object.values(suggested).reduce((a, b) => a + b, 0);
    if (sum < 0.05) {
      toast.success("Within allotment — no LS needed.");
    } else {
      toast.success(
        `Suggested LS ${round1(sum).toFixed(1)} MW (proportional, BRB/MRS free)`
      );
    }
  };

  const copyPrevSlot = (label) => {
    const idx = LOGSHEET_SLOTS.findIndex((s) => s.label === label);
    if (idx <= 0) {
      toast.error("No previous slot.");
      return;
    }
    const prev = slots[LOGSHEET_SLOTS[idx - 1].label];
    if (!prev) return;
    setSlotField(label, {
      ls: { ...prev.ls },
      allotment: prev.allotment,
    });
    enableRowEdit(label);
    toast.success(`Copied LS + allotment from ${LOGSHEET_SLOTS[idx - 1].label}`);
  };

  const clearSlotLs = (label) => {
    setSlotField(label, { ls: emptyLsMap() });
    enableRowEdit(label);
  };

  const applyAllotmentToAll = () => {
    const firstWithAllot = LOGSHEET_SLOTS.map((s) => slots[s.label]).find(
      (st) =>
        st && st.allotment !== "" && Number.isFinite(parseFloat(st.allotment))
    );
    if (!firstWithAllot) {
      toast.error("Set allotment on at least one slot first.");
      return;
    }
    const val = firstWithAllot.allotment;
    setSlots((prev) => {
      const next = { ...prev };
      for (const s of LOGSHEET_SLOTS) {
        const cur = next[s.label] || emptySlotState();
        next[s.label] = { ...cur, allotment: val, dirty: true };
      }
      return next;
    });
    toast.success(`Applied allotment ${val} MW to all slots`);
  };

  const autoFillAllShortage = () => {
    let n = 0;
    setSlots((prev) => {
      const next = { ...prev };
      for (const s of LOGSHEET_SLOTS) {
        const st = next[s.label] || emptySlotState();
        const t = totalsFor(st);
        if (t.allotment == null || t.demand <= 0 || t.shortage < 0.05) continue;
        const feeders = FEEDERS.map((f) => ({
          id: f.id,
          mw: t.feederMw[f.id] || 0,
        }));
        const suggested = suggestProportionalLs(feeders, t.allotment, [
          ...LS_PROTECTED_IDS,
        ]);
        const ls = emptyLsMap();
        for (const f of FEEDERS) {
          const v = suggested[f.id] || 0;
          ls[f.id] = v > 0.05 ? String(round1(v)) : "";
        }
        next[s.label] = { ...st, ls, dirty: true };
        n++;
      }
      return next;
    });
    if (n === 0) toast("No shortage slots to auto-fill.");
    else toast.success(`Auto LS applied to ${n} slot(s)`);
  };

  const buildPayload = (label, st) => {
    const slotMeta = LOGSHEET_SLOTS.find((s) => s.label === label);
    const feeders = FEEDERS.map((f) => {
      const raw = st.feedersRaw?.find((x) => x.id === f.id);
      return {
        id: f.id,
        name: f.name,
        bus: f.bus,
        amps: Number(raw?.amps) || 0,
        mw: Number(raw?.mw) || 0,
        lsMW: Math.max(0, parseFloat(st.ls[f.id]) || 0),
        ringActive: raw?.ringActive === true,
      };
    });
    const totalMW = feeders.reduce((s, f) => s + f.mw, 0);
    const bottail11kV = feeders
      .filter((f) => BOTTAIL_11KV_IDS.includes(f.id))
      .reduce((s, f) => s + f.mw, 0);
    const allotRaw = parseFloat(st.allotment);
    const allotment =
      st.allotment === "" || !Number.isFinite(allotRaw)
        ? null
        : Math.max(0, allotRaw);

    return {
      busVoltages: {
        bus1: Number(st.busVoltages?.bus1) || 0,
        bus2: Number(st.busVoltages?.bus2) || 0,
      },
      feeders,
      bottail11kV,
      totalMW,
      allotment,
      hourSlot: label,
      isHourly: true,
      calculatedAt: slotDateIso(dayKey, slotMeta),
      note: st.hasLoad
        ? `LS entry · ${label}`
        : `LS-only entry · ${label} (no load reading)`,
      hasActiveRing: feeders.some((f) => f.ringActive),
    };
  };

  const saveSlot = async (label) => {
    if (!isAuthenticated) {
      toast.error("Please sign in to save load-shed data.");
      return;
    }
    const st = slots[label];
    if (!st) return;
    setSavingSlot(label);
    try {
      const payload = buildPayload(label, st);
      let res;
      if (st.recordId) {
        res = await updateCalculation(st.recordId, payload);
      } else {
        res = await saveCalculation(payload);
      }
      const saved = res?.data || res;
      setSlots((prev) => ({
        ...prev,
        [label]: {
          ...slotStateFromRecord(saved),
          dirty: false,
        },
      }));
      disableRowEdit(label);
      toast.success(`Saved LS for ${label}`);
    } catch (err) {
      toast.error(err.message || "Save failed");
    } finally {
      setSavingSlot(null);
    }
  };

  const saveAllDirty = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to save.");
      return;
    }
    const dirtyLabels = LOGSHEET_SLOTS.map((s) => s.label).filter(
      (l) => slots[l]?.dirty
    );
    if (!dirtyLabels.length) {
      toast("No unsaved changes.");
      return;
    }
    let ok = 0;
    let fail = 0;
    for (const label of dirtyLabels) {
      try {
        const st = slots[label];
        if (!st) continue;
        setSavingSlot(label);
        const payload = buildPayload(label, st);
        let res;
        if (st.recordId) {
          res = await updateCalculation(st.recordId, payload);
        } else {
          res = await saveCalculation(payload);
        }
        const saved = res?.data || res;
        setSlots((prev) => ({
          ...prev,
          [label]: { ...slotStateFromRecord(saved), dirty: false },
        }));
        disableRowEdit(label);
        ok++;
      } catch {
        fail++;
      } finally {
        setSavingSlot(null);
      }
    }
    if (fail === 0) toast.success(`Saved ${ok} slot(s)`);
    else toast.error(`Saved ${ok}, failed ${fail}`);
  };

  const protectedSet = useMemo(() => new Set(LS_PROTECTED_IDS), []);

  return (
    <div className="h-full flex flex-col min-h-0 bg-white border-0 overflow-hidden h-full">
      {/* Toolbar */}
      <div className="flex-shrink-0 flex flex-wrap items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 bg-gradient-to-b from-slate-50 to-slate-100/80 border-b border-slate-200/90">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Day
        </label>
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            onClick={() => setDayKey((d) => shiftYmd(d, -1))}
            className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
            aria-label="Previous day"
          >
            ‹
          </button>
          <input
            type="date"
            value={dayKey}
            max={todayKey()}
            onChange={(e) => e.target.value && setDayKey(e.target.value)}
            className="text-sm font-medium bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
          <button
            type="button"
            onClick={() => {
              const n = shiftYmd(dayKey, 1);
              if (n <= todayKey()) setDayKey(n);
            }}
            disabled={dayKey >= todayKey()}
            className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40"
            aria-label="Next day"
          >
            ›
          </button>
        </div>

        <span className="text-xs font-medium text-slate-600 hidden sm:inline">
          {formatDayLabel(dayKey)}
        </span>

        <span className="text-xs text-slate-500 tabular-nums">
          Day LS{" "}
          <strong className="text-slate-800">{daySummary.lsSum.toFixed(1)}</strong>{" "}
          MW
          {" · "}
          Slots w/ LS{" "}
          <strong className="text-slate-800">{daySummary.slotsWithLs}</strong>
          {daySummary.shortageSlots > 0 && (
            <>
              {" · "}
              <span className="text-red-600 font-semibold">
                Shortage {daySummary.shortageSlots}
              </span>
            </>
          )}
          {daySummary.dirtyCount > 0 && (
            <>
              {" · "}
              <span className="text-sky-600 font-semibold">
                Unsaved {daySummary.dirtyCount}
              </span>
            </>
          )}
        </span>

        <div className="flex flex-wrap items-center gap-1.5 ml-auto">
          <button
            type="button"
            onClick={applyAllotmentToAll}
            className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            title="Copy first set allotment to every slot"
          >
            Allot → all
          </button>
          <button
            type="button"
            onClick={autoFillAllShortage}
            className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
            title="Auto proportional LS on every shortage slot"
          >
            Auto all
          </button>
          <button
            type="button"
            onClick={() => loadDay(dayKey)}
            disabled={loading}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {loading ? "…" : "Refresh"}
          </button>
          <button
            type="button"
            onClick={saveAllDirty}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm"
          >
            Save all
          </button>
        </div>
      </div>

      <p className="flex-shrink-0 px-3 sm:px-4 py-1.5 text-[11px] text-slate-500 leading-snug border-b border-slate-100 bg-white">
        <strong>Allot</strong> = grid allotment (empty = unlimited).{" "}
        <strong>Total</strong> = running load. Enter <strong>LS MW</strong> per
        feeder after unlocking a row. Remaining shortage is allowed when full LS
        cannot be imposed. BRB &amp; MRS stay free.
      </p>

      <div className="flex-1 min-h-0 overflow-auto relative">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          </div>
        ) : (
          <table
            className="sheet-table w-full text-left min-w-full border border-slate-300"
            style={{ borderCollapse: "separate", borderSpacing: 0 }}
          >
            <thead className="sticky top-0 z-40">
              <tr className="bg-slate-800 text-white text-[10px] uppercase tracking-wider">
                <th
                  className="px-1 py-2.5 font-semibold text-center bg-slate-800 border-b border-r border-slate-600"
                  style={{
                    position: "sticky",
                    left: 0,
                    width: SN_W,
                    minWidth: SN_W,
                    zIndex: 50,
                  }}
                >
                  SN
                </th>
                <th
                  className="px-1 py-2.5 font-semibold text-center bg-slate-800 border-b border-r border-slate-600"
                  style={{
                    position: "sticky",
                    left: SN_W,
                    width: TIME_W,
                    minWidth: TIME_W,
                    zIndex: 50,
                    boxShadow: "2px 0 4px -2px rgba(0,0,0,0.15)",
                  }}
                >
                  Time
                </th>
                <th
                  className="px-2 py-2.5 font-semibold text-center border-b border-r border-slate-600 bg-violet-900"
                  title="Grid allotment MW — empty = unlimited"
                  style={{ width: TIME_W, minWidth: TIME_W }}
                >
                  Allotment
                </th>
                <th
                  className="px-2 py-2.5 font-semibold text-center border-b border-r border-slate-600 bg-emerald-900"
                  title="Running load MW from Calculator / Manual"
                  style={{ width: TIME_W, minWidth: TIME_W }}
                >
                  Total
                </th>
                <th
                  className="px-1.5 py-2.5 font-semibold text-center border-b border-r border-slate-600 bg-red-900"
                  title="Sum of LS MW"
                  style={{ width: TIME_W, minWidth: TIME_W }}
                >
                  Σ LS
                </th>
                {FEEDERS.map((f) => {
                  const col = FEEDER_COL[f.id] || { head: "bg-slate-800" };
                  const isProt = protectedSet.has(f.id);
                  return (
                    <th
                      key={f.id}
                      className={`px-1.5 py-2.5 font-semibold text-center whitespace-nowrap border-b border-r border-slate-600 ${
                        isProt ? "bg-slate-700" : col.head
                      }`}
                      title={
                        isProt
                          ? `${f.name} (protected — free during LS)`
                          : `LS MW · ${f.name}`
                      }
                      style={{ width: TIME_W, minWidth: TIME_W }}
                    >
                      {f.name}
                      {isProt && (
                        <span className="block text-[8px] font-normal normal-case tracking-normal text-emerald-300/90">
                          free
                        </span>
                      )}
                    </th>
                  );
                })}
                <th
                  className="px-1.5 py-2.5 font-semibold text-center whitespace-nowrap bg-teal-900 border-b border-r border-slate-600"
                  title="H-3 + T-3 LS sum"
                  style={{ width: TIME_W, minWidth: TIME_W }}
                >
                  H3+T3
                </th>
                <th className="px-1.5 py-2.5 font-semibold text-center bg-slate-700 border-b border-slate-600 min-w-[9rem] col-action">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {LOGSHEET_SLOTS.map((slot, idx) => {
                const st = slots[slot.label] || emptySlotState();
                const t = totalsFor(st);
                const isEditing = !!editingRows[slot.label];
                const over =
                  t.allotment != null && t.demand > t.allotment + 0.05;
                const underCovered = over && t.remaining > 0.05;
                const alt = idx % 2 === 1;

                let rowBg;
                let stickyBg;
                if (underCovered) {
                  rowBg = "bg-red-50/90 hover:bg-red-50";
                  stickyBg = "#fef2f2";
                } else if (over) {
                  rowBg = "bg-amber-50/80 hover:bg-amber-50";
                  stickyBg = "#fffbeb";
                } else if (st.dirty) {
                  rowBg = "bg-sky-50/80 hover:bg-sky-50";
                  stickyBg = "#f0f9ff";
                } else if (slot.isSpecial) {
                  rowBg = "bg-violet-50/70 hover:bg-violet-50";
                  stickyBg = "#f5f3ff";
                } else if (st.hasLoad) {
                  rowBg = alt
                    ? "bg-emerald-50/70 hover:bg-emerald-50"
                    : "bg-emerald-50/40 hover:bg-emerald-50";
                  stickyBg = alt ? "#d1fae5" : "#ecfdf5";
                } else {
                  rowBg = alt
                    ? "bg-slate-100/80 hover:bg-slate-50"
                    : "bg-white hover:bg-slate-50";
                  stickyBg = alt ? "#f1f5f9" : "#ffffff";
                }

                return (
                  <tr
                    key={slot.label}
                    className={`${rowBg} border-b border-slate-200`}
                  >
                    <td
                      className="px-1 py-1.5 text-center align-middle text-[11px] font-semibold text-slate-500 border-r border-slate-200"
                      style={{
                        position: "sticky",
                        left: 0,
                        width: SN_W,
                        minWidth: SN_W,
                        zIndex: 5,
                        background: stickyBg,
                      }}
                    >
                      {idx + 1}
                    </td>
                    <td
                      className={`px-1 py-1.5 text-center align-middle text-[11px] font-bold tabular-nums border-r border-slate-200 ${
                        slot.isSpecial ? "text-violet-700" : "text-slate-700"
                      }`}
                      style={{
                        position: "sticky",
                        left: SN_W,
                        width: TIME_W,
                        minWidth: TIME_W,
                        zIndex: 5,
                        background: stickyBg,
                        boxShadow: "2px 0 4px -2px rgba(0,0,0,0.08)",
                      }}
                    >
                      {slot.label}
                      
                    </td>

                    {/* Allotment */}
                    <td className="px-0.5 py-1 border-r border-slate-100 bg-violet-50/20 align-middle text-center">
                      {isEditing ? (
                        <input
                          type="number"
                          inputMode="decimal"
                          step="0.1"
                          min="0"
                          placeholder="∞"
                          value={st.allotment}
                          onChange={(e) =>
                            setSlotField(slot.label, {
                              allotment: e.target.value,
                            })
                          }
                          className="w-full min-w-[52px] rounded border border-violet-200 bg-white px-1 py-0.5 text-center text-[11px] tabular-nums font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-violet-400"
                          title="Grid allotment (MW). Empty = unlimited"
                        />
                      ) : (
                        <span className="block text-center text-[11px] tabular-nums font-medium text-slate-700 px-1">
                          {st.allotment !== "" ? formatMW(st.allotment) : "∞"}
                        </span>
                      )}
                    </td>

                    {/* Total (load) */}
                    <td className="px-1.5 py-1 text-center tabular-nums font-semibold text-slate-800 border-r border-slate-100 bg-emerald-50/30">
                      {st.hasLoad ? formatMW(t.demand) : "—"}
                    </td>

                    {/* Σ LS */}
                    <td
                      className={`px-1.5 py-1 text-center tabular-nums font-bold border-r border-slate-100 ${
                        t.totalLs > 0.05 ? "text-red-700" : "text-slate-400"
                      }`}
                      title={
                        underCovered
                          ? `Still short ${formatMW(t.remaining)} MW after LS (allowed)`
                          : over
                            ? "Shortage covered"
                            : undefined
                      }
                    >
                      {formatMW(t.totalLs)}
                    </td>

                    {/* Per-feeder LS */}
                    {FEEDERS.map((f) => {
                      const col = FEEDER_COL[f.id] || {};
                      const isProt = protectedSet.has(f.id);
                      return (
                        <td
                          key={f.id}
                          className={`px-0.5 py-1 border-r border-slate-100 align-middle text-center ${
                            isProt ? "bg-slate-100/60" : col.cell || ""
                          }`}
                        >
                          {isEditing && !isProt ? (
                            <input
                              type="number"
                              inputMode="decimal"
                              step="0.1"
                              min="0"
                              placeholder="0"
                              value={st.ls[f.id] ?? ""}
                              onChange={(e) =>
                                setLs(slot.label, f.id, e.target.value)
                              }
                              className={`w-full min-w-[48px] rounded border px-1 py-0.5 text-center text-[11px] tabular-nums font-medium focus:outline-none focus:ring-1 border-slate-200 bg-white text-slate-800 ${
                                col.input || "focus:ring-emerald-500"
                              }`}
                              title={`LS MW · ${f.name}${
                                t.feederMw[f.id]
                                  ? ` (load ${formatMW(t.feederMw[f.id])} MW)`
                                  : ""
                              }`}
                            />
                          ) : (
                            <span
                              className={`block text-center text-[11px] tabular-nums px-1 ${
                                isProt
                                  ? "text-slate-400"
                                  : st.ls[f.id]
                                    ? "font-medium text-slate-800"
                                    : "text-slate-400"
                              }`}
                            >
                              {isProt
                                ? "—"
                                : st.ls[f.id]
                                  ? formatMW(st.ls[f.id])
                                  : "—"}
                            </span>
                          )}
                        </td>
                      );
                    })}

                    {/* H3+T3 LS sum */}
                    <td className="px-1.5 py-1 text-center tabular-nums font-semibold text-teal-800 border-r border-slate-100 bg-teal-50/40">
                      {t.h3t3Ls > 0.05 ? formatMW(t.h3t3Ls) : "—"}
                    </td>

                    {/* Action: Edit / Update (save) like Manual */}
                    <td className="px-1 py-0.5">
                      <div className="flex flex-wrap items-center justify-center gap-0.5">
                        {!isEditing ? (
                          <button
                            type="button"
                            onClick={() => enableRowEdit(slot.label)}
                            className="rounded px-2 py-0.5 text-[10px] font-bold bg-sky-100 text-sky-900 hover:bg-sky-200 border border-sky-200"
                          >
                            Edit
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => clearSlotLs(slot.label)}
                              className="rounded px-2 py-0.5 text-[10px] font-semibold bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                            >
                              Clear
                            </button>
                            <button
                              type="button"
                              onClick={() => saveSlot(slot.label)}
                              disabled={savingSlot === slot.label}
                              className="rounded px-2 py-0.5 text-[10px] font-bold bg-emerald-600 text-white border border-emerald-600 hover:bg-emerald-500"
                            >
                              {savingSlot === slot.label ? "…" : "Update"}
                            </button>
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
    </div>
  );
}
