"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { fetchDistrictDay } from "@/lib/api";
import { useLiveClock } from "@/hooks/useLiveClock";

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

/** Same as Circle Load / calculator: one decimal MW */
function fmt(n) {
  if (n == null || n === "" || Number.isNaN(Number(n))) return "—";
  return (Math.round((Number(n) + Number.EPSILON) * 10) / 10).toFixed(1);
}

export default function KushtiaDistrictLoadView() {
  const liveClock = useLiveClock();
  const [day, setDay] = useState(dayKeyNow);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchDistrictDay({ day });
      setData(res.data);
    } catch (err) {
      toast.error(err.message || "Failed to load");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [day]);

  useEffect(() => {
    load();
  }, [load]);

  const slots = data?.slots || [];
  const boundary = data?.boundary || "22:00";

  return (
    <div className="h-full flex flex-col min-h-0 bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xl shadow-slate-900/10">
      {/* Clock — same as Circle Load */}
      <div className="shrink-0 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-emerald-400 text-center font-semibold tracking-wide font-mono border-b border-slate-800/80 py-2 text-[11px] sm:text-[12px] shadow-sm">
        <span className="opacity-60 mr-1.5">⏱</span>
        {liveClock || "—"}
      </div>

      {/* Toolbar — Logsheet / Circle Load style */}
      <div className="flex-shrink-0 flex flex-wrap items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 bg-gradient-to-b from-slate-50 to-slate-100/80 border-b border-slate-200/90">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">
            Kushtia district
          </p>
          <p className="text-[13px] sm:text-sm font-semibold text-slate-900 tracking-tight">
            Bottail + Bheramara load
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5 font-mono truncate">
            {data?.rangeLabel || `Boundary ${boundary}`}
          </p>
        </div>

        <label
          htmlFor="district-day"
          className="text-[11px] font-semibold uppercase tracking-wider text-slate-500"
        >
          Day ends
        </label>
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            onClick={() => setDay((d) => shiftDay(d, -1))}
            title="Previous operational day"
            aria-label="Previous operational day"
            className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 active:scale-95 transition-all"
          >
            ‹
          </button>
          <input
            id="district-day"
            type="date"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className="text-sm font-medium bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
          />
          <button
            type="button"
            onClick={() => setDay((d) => shiftDay(d, 1))}
            title="Next operational day"
            aria-label="Next operational day"
            className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 active:scale-95 transition-all"
          >
            ›
          </button>
        </div>

        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50 transition-colors ml-auto sm:ml-0"
        >
          {loading ? "…" : "Refresh"}
        </button>
      </div>

      {/* Sheet */}
      <div className="flex-1 min-h-0 overflow-auto">
        <table
          className="w-full text-left min-w-[680px]"
          style={{
            tableLayout: "fixed",
            borderCollapse: "separate",
            borderSpacing: 0,
          }}
        >
          <thead className="sticky top-0 z-10">
            <tr className="text-[9px] sm:text-[10px] uppercase tracking-wider text-white font-semibold">
              <th
                rowSpan={2}
                className="px-2 py-2.5 border-b border-r border-slate-600 bg-slate-800 text-center align-middle"
              >
                Time
              </th>
              <th
                colSpan={4}
                className="px-1 py-2 border-b border-r border-slate-600 bg-teal-800 text-center"
              >
                Bottail
              </th>
              <th
                colSpan={4}
                className="px-1 py-2 border-b border-r border-slate-600 bg-amber-700 text-center"
              >
                Bheramara
              </th>
              <th
                colSpan={4}
                className="px-1 py-2 border-b border-slate-600 bg-slate-700 text-center"
              >
                Total
              </th>
            </tr>
            <tr className="text-[9px] uppercase tracking-wide text-white font-semibold">
              {/* Bottail — same order as Circle Load: Cons · LS · Demand · Allot */}
              <th className="px-1 py-2 border-b border-r border-slate-600 bg-teal-900/90 text-center">
                Cons.
              </th>
              <th className="px-1 py-2 border-b border-r border-slate-600 bg-teal-900/90 text-center">
                LS
              </th>
              <th className="px-1 py-2 border-b border-r border-slate-600 bg-emerald-800 text-center">
                Demand
              </th>
              <th className="px-1 py-2 border-b border-r border-slate-600 bg-teal-900/90 text-center">
                Allot.
              </th>
              {/* Bheramara */}
              <th className="px-1 py-2 border-b border-r border-slate-600 bg-amber-800 text-center">
                Cons.
              </th>
              <th className="px-1 py-2 border-b border-r border-slate-600 bg-amber-800 text-center">
                LS
              </th>
              <th className="px-1 py-2 border-b border-r border-slate-600 bg-emerald-800 text-center">
                Demand
              </th>
              <th className="px-1 py-2 border-b border-r border-slate-600 bg-amber-800 text-center">
                Allot.
              </th>
              {/* Total */}
              <th className="px-1 py-2 border-b border-r border-slate-600 bg-slate-800 text-center">
                Cons.
              </th>
              <th className="px-1 py-2 border-b border-r border-slate-600 bg-emerald-800 text-center">
                Demand
              </th>
              <th className="px-1 py-2 border-b border-r border-slate-600 bg-slate-800 text-center">
                Allot.
              </th>
              <th className="px-1 py-2 border-b border-slate-600 bg-slate-800 text-center">
                LS
              </th>
            </tr>
          </thead>
          <tbody>
            {slots.map((row, i) => {
              const b = row.bottail || {};
              const h = row.bheramara || {};
              const t = row.total || {};
              const prev = row.isPreviousDay;
              const alt = i % 2 === 1;

              const rowBg = prev
                ? alt
                  ? "bg-violet-50/80"
                  : "bg-violet-50/50"
                : alt
                  ? "bg-slate-50"
                  : "bg-white";

              const cell =
                "px-1 py-1.5 border-b border-r border-slate-200 text-center font-mono text-[11px] sm:text-xs tabular-nums text-slate-800";
              const demandCell = `${cell} font-bold text-emerald-800 bg-emerald-50/50`;

              return (
                <tr key={`${row.dayKey}-${row.hourSlot}`} className={rowBg}>
                  <td
                    className={`px-1.5 py-1.5 border-b border-r border-slate-200 text-center ${
                      prev ? "bg-violet-100/70" : "bg-slate-100/80"
                    }`}
                  >
                    <span className="block font-mono text-[11px] sm:text-xs font-bold text-slate-900">
                      {row.hourSlot}
                    </span>
                    {prev ? (
                      <span className="block text-[8px] font-bold uppercase tracking-wide text-violet-600">
                        prev
                      </span>
                    ) : null}
                  </td>
                  {/* Bottail: Cons, LS, Demand, Allot — app order */}
                  <td className={cell}>{fmt(b.consumption)}</td>
                  <td className={cell}>{fmt(b.loadshed)}</td>
                  <td className={demandCell}>{fmt(b.demand)}</td>
                  <td className={cell}>{fmt(b.allotment)}</td>
                  {/* Bheramara */}
                  <td className={cell}>{fmt(h.consumption)}</td>
                  <td className={cell}>{fmt(h.loadshed)}</td>
                  <td className={demandCell}>{fmt(h.demand)}</td>
                  <td className={cell}>{fmt(h.allotment)}</td>
                  {/* Total: Cons, Demand, Allot, LS */}
                  <td className={`${cell} font-semibold`}>
                    {fmt(t.consumption)}
                  </td>
                  <td className={demandCell}>{fmt(t.demand)}</td>
                  <td className={cell}>{fmt(t.allotment)}</td>
                  <td className={cell}>{fmt(t.loadshed)}</td>
                </tr>
              );
            })}
            {!loading && slots.length === 0 && (
              <tr>
                <td
                  colSpan={13}
                  className="px-4 py-14 text-center text-slate-400 text-sm"
                >
                  No data for this operational day
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="shrink-0 px-3 py-2 text-[10px] text-slate-500 border-t border-slate-100 bg-slate-50 leading-relaxed">
        Same rules as Circle Load: <strong>Demand = Cons. + LS</strong>,{" "}
        <strong>Allot.</strong> defaults to demand when not set. Window: previous{" "}
        {boundary} → selected day {boundary}. Violet = previous calendar day.
      </p>
    </div>
  );
}
