"use client";

import { useCallback, useEffect, useMemo, useState, memo } from "react";
import toast from "react-hot-toast";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Zap,
  Activity,
  Layers,
  ShieldAlert,
} from "lucide-react";
import { fetchDistrictDay } from "@/lib/api";
import SkeletonTable from "./SkeletonTable";

function dayKeyNow() {
  const OFFSET_MS = 6 * 60 * 60 * 1000;
  const shifted = new Date(Date.now() + OFFSET_MS);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const d = String(shifted.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function shiftDay(ymd, delta) {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + delta));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
}

function clampDay(ymd) {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return dayKeyNow();
  const today = dayKeyNow();
  return ymd > today ? today : ymd;
}

function fmt(n) {
  if (n == null || n === "" || Number.isNaN(Number(n))) return "—";
  return (Math.round((Number(n) + Number.EPSILON) * 10) / 10).toFixed(1);
}

// In-memory day cache for 0ms day switching
const dayCache = new Map();

// Memoized high-performance row component
const DistrictRow = memo(function DistrictRow({ row, isAlt }) {
  const b = row.bottail || {};
  const h = row.bheramara || {};
  const t = row.total || {};
  const prev = row.isPreviousDay;

  return (
    <tr
      className={`transition-colors duration-100 ${
        isAlt
          ? prev
            ? "bg-slate-900/90 hover:bg-slate-800/80"
            : "bg-slate-900/50 hover:bg-slate-800/60"
          : prev
          ? "bg-slate-950/80 hover:bg-slate-800/80"
          : "bg-slate-950/40 hover:bg-slate-800/60"
      }`}
    >
      {/* Time Slot Column */}
      <td className="px-2 py-2 border-b border-r border-slate-800/80 text-center">
        <div className="flex items-center justify-center gap-1.5 font-mono text-xs font-semibold text-slate-200 tabular-nums">
          <span>{row.hourSlot}</span>
          {prev && (
            <span className="text-[9px] font-bold uppercase tracking-wider px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
              prev
            </span>
          )}
          {row.isSpecial && (
            <span className="text-[9px] font-bold text-amber-400" title="Special Half-Hour Slot">
              ★
            </span>
          )}
        </div>
      </td>

      {/* Bottail: Cons, LS, Demand, Allot */}
      <td className="px-1.5 py-2 border-b border-r border-slate-800/80 text-center font-mono text-xs tabular-nums text-cyan-300">
        {fmt(b.consumption)}
      </td>
      <td className="px-1.5 py-2 border-b border-r border-slate-800/80 text-center font-mono text-xs tabular-nums text-slate-400">
        {fmt(b.loadshed)}
      </td>
      <td className="px-1.5 py-2 border-b border-r border-slate-800/80 text-center font-mono text-xs font-bold tabular-nums text-cyan-400 bg-cyan-950/20">
        {fmt(b.demand)}
      </td>
      <td className="px-1.5 py-2 border-b border-r border-slate-800/80 text-center font-mono text-xs tabular-nums text-slate-400">
        {fmt(b.allotment)}
      </td>

      {/* Bheramara: Cons, LS, Demand, Allot */}
      <td className="px-1.5 py-2 border-b border-r border-slate-800/80 text-center font-mono text-xs tabular-nums text-amber-300">
        {fmt(h.consumption)}
      </td>
      <td className="px-1.5 py-2 border-b border-r border-slate-800/80 text-center font-mono text-xs tabular-nums text-slate-400">
        {fmt(h.loadshed)}
      </td>
      <td className="px-1.5 py-2 border-b border-r border-slate-800/80 text-center font-mono text-xs font-bold tabular-nums text-amber-400 bg-amber-950/20">
        {fmt(h.demand)}
      </td>
      <td className="px-1.5 py-2 border-b border-r border-slate-800/80 text-center font-mono text-xs tabular-nums text-slate-400">
        {fmt(h.allotment)}
      </td>

      {/* Total: Cons, Demand, Allot, LS */}
      <td className="px-1.5 py-2 border-b border-r border-slate-800/80 text-center font-mono text-xs font-semibold tabular-nums text-slate-200">
        {fmt(t.consumption)}
      </td>
      <td className="px-1.5 py-2 border-b border-r border-slate-800/80 text-center font-mono text-xs font-extrabold tabular-nums text-emerald-400 bg-emerald-950/30">
        {fmt(t.demand)}
      </td>
      <td className="px-1.5 py-2 border-b border-r border-slate-800/80 text-center font-mono text-xs tabular-nums text-slate-300">
        {fmt(t.allotment)}
      </td>
      <td className="px-1.5 py-2 border-b border-slate-800/80 text-center font-mono text-xs font-semibold tabular-nums text-rose-400">
        {fmt(t.loadshed)}
      </td>
    </tr>
  );
});

export default function KushtiaDistrictLoadView() {
  const [day, setDay] = useState(dayKeyNow);
  const [data, setData] = useState(() => dayCache.get(dayKeyNow()) || null);
  const [loading, setLoading] = useState(!dayCache.has(dayKeyNow()));
  const today = useMemo(() => dayKeyNow(), []);
  const atToday = day >= today;

  const load = useCallback(
    async (targetDay = day, forceRefresh = false) => {
      const sanitized = clampDay(targetDay);
      if (!forceRefresh && dayCache.has(sanitized)) {
        setData(dayCache.get(sanitized));
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await fetchDistrictDay({ day: sanitized });
        if (res.data) {
          dayCache.set(sanitized, res.data);
          setData(res.data);
        }
      } catch (err) {
        console.warn("fetchDistrictDay error:", err.message);
        // Fallback: construct standard 24 slots with local state
        const fallback = {
          day: sanitized,
          rangeLabel: `${shiftDay(sanitized, -1)} 23:00 → ${sanitized} 22:00`,
          boundary: "22:00",
          summary: {
            peakDemand: null,
            peakDemandSlot: "—",
            peakConsumption: null,
            peakConsumptionSlot: "—",
            maxLoadshed: 0,
            maxLoadshedSlot: "—",
          },
          slots: [],
        };
        setData(fallback);
      } finally {
        setLoading(false);
      }
    },
    [day]
  );

  useEffect(() => {
    load(day);
  }, [day, load]);

  const slots = data?.slots || [];
  const boundary = data?.boundary || "22:00";
  const summary = data?.summary || {};

  return (
    <div className="h-full flex flex-col min-h-0 bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
      {/* ── Operational KPI Cards Strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 p-3 sm:p-4 border-b border-slate-800 bg-slate-950/60 shrink-0">
        <div className="p-2.5 sm:p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              Peak District Demand
            </p>
            <p className="text-base sm:text-lg font-extrabold text-emerald-400 font-mono tabular-nums mt-0.5">
              {summary.peakDemand ? `${fmt(summary.peakDemand)} MW` : "—"}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[9px] uppercase font-bold text-slate-400 block font-mono">
              Slot
            </span>
            <span className="text-xs font-mono font-bold text-slate-200">
              {summary.peakDemandSlot || "—"}
            </span>
          </div>
        </div>

        <div className="p-2.5 sm:p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              Peak Consumption
            </p>
            <p className="text-base sm:text-lg font-extrabold text-cyan-400 font-mono tabular-nums mt-0.5">
              {summary.peakConsumption ? `${fmt(summary.peakConsumption)} MW` : "—"}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[9px] uppercase font-bold text-slate-400 block font-mono">
              Slot
            </span>
            <span className="text-xs font-mono font-bold text-slate-200">
              {summary.peakConsumptionSlot || "—"}
            </span>
          </div>
        </div>

        <div className="p-2.5 sm:p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              Max Load Shed
            </p>
            <p className="text-base sm:text-lg font-extrabold text-rose-400 font-mono tabular-nums mt-0.5">
              {summary.maxLoadshed ? `${fmt(summary.maxLoadshed)} MW` : "0.0 MW"}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[9px] uppercase font-bold text-slate-400 block font-mono">
              Slot
            </span>
            <span className="text-xs font-mono font-bold text-slate-200">
              {summary.maxLoadshedSlot || "—"}
            </span>
          </div>
        </div>

        <div className="p-2.5 sm:p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              Substations
            </p>
            <p className="text-xs sm:text-sm font-bold text-slate-200 mt-1 truncate">
              Bottail + Bheramara
            </p>
          </div>
          <div className="text-right">
            <span className="text-[9px] uppercase font-bold text-slate-400 block font-mono">
              Window
            </span>
            <span className="text-[11px] font-mono text-emerald-400 font-semibold">
              23:00 → 22:00
            </span>
          </div>
        </div>
      </div>

      {/* ── Toolbar & Date Navigator ── */}
      <div className="flex-shrink-0 flex flex-wrap items-center justify-between gap-3 px-3 sm:px-4 py-2.5 bg-slate-900/90 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/80 animate-pulse" />
          <span className="text-xs font-bold text-white tracking-tight">
            Kushtia District Load Grid
          </span>
          <span className="text-slate-500 font-mono text-xs hidden sm:inline">
            ·
          </span>
          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
            {data?.rangeLabel || `Boundary ${boundary}`}
          </span>
        </div>

        {/* Date Controls */}
        <div className="flex items-center gap-2 ml-auto sm:ml-0">
          <div className="inline-flex items-center rounded-lg bg-slate-950/80 border border-slate-800 p-0.5">
            <button
              type="button"
              onClick={() => setDay((d) => shiftDay(d, -1))}
              title="Previous Day"
              aria-label="Previous Day"
              className="p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="relative flex items-center px-1">
              <input
                id="district-day-input"
                type="date"
                value={day}
                max={today}
                onChange={(e) => {
                  if (e.target.value) setDay(clampDay(e.target.value));
                }}
                className="bg-transparent text-xs font-mono font-semibold text-slate-200 focus:outline-none cursor-pointer py-1 px-1.5"
              />
            </div>
            <button
              type="button"
              onClick={() =>
                setDay((d) => {
                  const next = shiftDay(d, 1);
                  return next > dayKeyNow() ? d : next;
                })
              }
              disabled={atToday}
              title={atToday ? "Today is maximum" : "Next Day"}
              aria-label="Next Day"
              className="p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => load(day, true)}
            disabled={loading}
            title="Refresh district data"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* ── Table Sheet ── */}
      <div className="flex-1 min-h-0 overflow-auto">
        {loading && slots.length === 0 ? (
          <div className="p-4">
            <SkeletonTable rows={12} columns={13} dark={true} showHeader={true} />
          </div>
        ) : (
          <table
            className="w-full text-left min-w-[720px]"
            style={{
              tableLayout: "fixed",
              borderCollapse: "separate",
              borderSpacing: 0,
            }}
          >
            <thead className="sticky top-0 z-20">
              {/* Top Station Grouping Row */}
              <tr className="text-[10px] uppercase tracking-wider font-bold text-white">
                <th
                  rowSpan={2}
                  className="px-2 py-2.5 border-b border-r border-slate-700 bg-indigo-950/90 text-indigo-200 text-center align-middle w-20"
                >
                  Time
                </th>
                <th
                  colSpan={4}
                  className="px-2 py-2 border-b border-r border-cyan-800/60 bg-cyan-950/80 text-cyan-200 text-center"
                >
                  Bottail 33/11 kV
                </th>
                <th
                  colSpan={4}
                  className="px-2 py-2 border-b border-r border-amber-800/60 bg-amber-950/80 text-amber-200 text-center"
                >
                  Bheramara
                </th>
                <th
                  colSpan={4}
                  className="px-2 py-2 border-b border-emerald-800/60 bg-emerald-950/80 text-emerald-200 text-center"
                >
                  District Total
                </th>
              </tr>

              {/* Sub-Metric Columns */}
              <tr className="text-[9px] uppercase tracking-wide font-bold">
                {/* Bottail: Cons, LS, Demand, Allot */}
                <th className="px-1.5 py-2 border-b border-r border-slate-800 bg-cyan-950/90 text-cyan-300 text-center">
                  Cons.
                </th>
                <th className="px-1.5 py-2 border-b border-r border-slate-800 bg-cyan-950/90 text-cyan-200 text-center">
                  LS
                </th>
                <th className="px-1.5 py-2 border-b border-r border-slate-800 bg-cyan-900/90 text-cyan-100 text-center">
                  Demand
                </th>
                <th className="px-1.5 py-2 border-b border-r border-slate-800 bg-cyan-950/90 text-cyan-200 text-center">
                  Allot.
                </th>

                {/* Bheramara */}
                <th className="px-1.5 py-2 border-b border-r border-slate-800 bg-amber-950/90 text-amber-300 text-center">
                  Cons.
                </th>
                <th className="px-1.5 py-2 border-b border-r border-slate-800 bg-amber-950/90 text-amber-200 text-center">
                  LS
                </th>
                <th className="px-1.5 py-2 border-b border-r border-slate-800 bg-amber-900/90 text-amber-100 text-center">
                  Demand
                </th>
                <th className="px-1.5 py-2 border-b border-r border-slate-800 bg-amber-950/90 text-amber-200 text-center">
                  Allot.
                </th>

                {/* Total */}
                <th className="px-1.5 py-2 border-b border-r border-slate-800 bg-emerald-950/80 text-emerald-300 text-center">
                  Cons.
                </th>
                <th className="px-1.5 py-2 border-b border-r border-slate-800 bg-emerald-900 text-emerald-100 text-center font-extrabold">
                  Demand
                </th>
                <th className="px-1.5 py-2 border-b border-r border-slate-800 bg-teal-950/80 text-teal-200 text-center">
                  Allot.
                </th>
                <th className="px-1.5 py-2 border-b border-slate-800 bg-rose-950/80 text-rose-300 text-center">
                  LS
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/40">
              {slots.map((row, i) => (
                <DistrictRow
                  key={`${row.dayKey}-${row.hourSlot}`}
                  row={row}
                  isAlt={i % 2 === 1}
                />
              ))}

              {!loading && slots.length === 0 && (
                <tr>
                  <td
                    colSpan={13}
                    className="px-4 py-16 text-center text-slate-400 text-sm font-mono"
                  >
                    No calculation entries recorded for this operational day ({day})
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Substation Operational Footer Notes ── */}
      <div className="shrink-0 px-3.5 py-2 text-[11px] text-slate-400 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-2 font-mono">
        <span>
          <strong className="text-slate-300">Demand</strong> = Cons. + LS ·{" "}
          <strong className="text-slate-300">Window</strong>: 23:00 (prev) → 22:00 (day)
        </span>
        <span className="text-slate-500 text-[10px]">
          Kushtia S&amp;D-1 · Circle Operations
        </span>
      </div>
    </div>
  );
}
