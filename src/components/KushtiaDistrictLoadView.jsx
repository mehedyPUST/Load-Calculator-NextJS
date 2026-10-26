"use client";

import { useCallback, useEffect, useMemo, useState, memo } from "react";
import toast from "react-hot-toast";
import { fetchDistrictDay } from "@/lib/api";

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

const dayCache = new Map();

function StationMini({ title, tone, cons, ls, demand, allot }) {
  const tones = {
    teal: {
      bar: "bg-teal-600",
      head: "text-teal-800",
      demand: "text-teal-700 bg-teal-50",
    },
    amber: {
      bar: "bg-amber-600",
      head: "text-amber-900",
      demand: "text-amber-800 bg-amber-50",
    },
    slate: {
      bar: "bg-slate-700",
      head: "text-slate-800",
      demand: "text-emerald-800 bg-emerald-50",
    },
  };
  const t = tones[tone] || tones.slate;
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className={`h-0.5 ${t.bar}`} />
      <div className="px-2.5 py-1.5 border-b border-slate-100">
        <p className={`text-[10px] font-bold uppercase tracking-wider ${t.head}`}>
          {title}
        </p>
      </div>
      <div className="grid grid-cols-4 gap-px bg-slate-100">
        {[
          { label: "Consumption", value: cons },
          { label: "LS", value: ls },
          { label: "Demand", value: demand, strong: true },
          { label: "Allotment", value: allot },
        ].map((c) => (
          <div
            key={c.label}
            className={`px-1 py-1.5 text-center ${
              c.strong ? t.demand : "bg-white"
            }`}
          >
            <p className="text-[8px] font-semibold uppercase text-slate-400 tracking-wide">
              {c.label}
            </p>
            <p
              className={`font-mono text-[11px] font-semibold tabular-nums ${
                c.strong ? "font-bold" : "text-slate-800"
              }`}
            >
              {fmt(c.value)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

const MobileSlotCard = memo(function MobileSlotCard({ row }) {
  const b = row.bottail || {};
  const h = row.bheramara || {};
  const t = row.total || {};
  return (
    <article
      className={`rounded-2xl border shadow-sm overflow-hidden ${
        row.isPreviousDay
          ? "border-violet-200 bg-violet-50/40"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100/80">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold text-slate-900 tabular-nums">
            {row.hourSlot}
          </span>
          {row.isPreviousDay && (
            <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700">
              prev day
            </span>
          )}
          {row.isSpecial && (
            <span className="text-[10px] text-amber-600 font-bold">★</span>
          )}
        </div>
        <div className="text-right">
          <p className="text-[9px] font-semibold uppercase text-slate-400">
            Total demand
          </p>
          <p className="font-mono text-sm font-bold text-emerald-700 tabular-nums">
            {fmt(t.demand)}
            <span className="text-[10px] text-slate-400 font-semibold ml-0.5">
              MW
            </span>
          </p>
        </div>
      </div>
      <div className="p-2.5 space-y-2">
        <StationMini
          title="Bottail"
          tone="teal"
          cons={b.consumption}
          ls={b.loadshed}
          demand={b.demand}
          allot={b.allotment}
        />
        <StationMini
          title="Bheramara"
          tone="amber"
          cons={h.consumption}
          ls={h.loadshed}
          demand={h.demand}
          allot={h.allotment}
        />
        <StationMini
          title="District total"
          tone="slate"
          cons={t.consumption}
          ls={t.loadshed}
          demand={t.demand}
          allot={t.allotment}
        />
      </div>
    </article>
  );
});

const DesktopRow = memo(function DesktopRow({ row, isAlt }) {
  const b = row.bottail || {};
  const h = row.bheramara || {};
  const t = row.total || {};
  const prev = row.isPreviousDay;
  const base = prev
    ? isAlt
      ? "bg-violet-50/80"
      : "bg-violet-50/40"
    : isAlt
      ? "bg-slate-50"
      : "bg-white";
  const cell =
    "px-1 py-1.5 border-b border-r border-slate-200 text-center font-mono text-[11px] sm:text-xs tabular-nums text-slate-800";
  const demand =
    "px-1 py-1.5 border-b border-r border-slate-200 text-center font-mono text-[11px] sm:text-xs font-bold tabular-nums text-emerald-800 bg-emerald-50/70";

  return (
    <tr className={`${base} hover:bg-emerald-50/40 transition-colors`}>
      <td
        className={`sticky left-0 z-[1] px-1.5 py-1.5 border-b border-r border-slate-200 text-center ${
          prev ? "bg-violet-100/90" : "bg-slate-100/95"
        } backdrop-blur-sm`}
      >
        <span className="block font-mono text-[11px] sm:text-xs font-bold text-slate-900 tabular-nums">
          {row.hourSlot}
        </span>
        {prev && (
          <span className="block text-[8px] font-bold uppercase text-violet-600 tracking-wide">
            prev
          </span>
        )}
      </td>
      <td className={cell}>{fmt(b.consumption)}</td>
      <td className={cell}>{fmt(b.loadshed)}</td>
      <td className={demand}>{fmt(b.demand)}</td>
      <td className={cell}>{fmt(b.allotment)}</td>
      <td className={cell}>{fmt(h.consumption)}</td>
      <td className={cell}>{fmt(h.loadshed)}</td>
      <td className={demand}>{fmt(h.demand)}</td>
      <td className={cell}>{fmt(h.allotment)}</td>
      <td className={`${cell} font-semibold`}>{fmt(t.consumption)}</td>
      <td className={demand}>{fmt(t.demand)}</td>
      <td className={cell}>{fmt(t.allotment)}</td>
      <td className={cell}>{fmt(t.loadshed)}</td>
    </tr>
  );
});

export default function KushtiaDistrictLoadView() {
  const [day, setDay] = useState(dayKeyNow);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const today = dayKeyNow();

  const load = useCallback(
    async (force = false) => {
      if (!force && dayCache.has(day)) {
        setData(dayCache.get(day));
        return;
      }
      setLoading(true);
      try {
        const res = await fetchDistrictDay({ day });
        const payload = res.data;
        dayCache.set(day, payload);
        setData(payload);
      } catch (err) {
        toast.error(err.message || "Failed to load");
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    [day]
  );

  useEffect(() => {
    load();
  }, [load]);

  const slots = data?.slots || [];
  const boundary = data?.boundary || "22:00";

  const summary = useMemo(() => {
    let peakDemand = 0;
    let peakDemandSlot = "";
    let peakConsumption = 0;
    let peakConsumptionSlot = "";
    let maxLoadshed = 0;
    let maxLoadshedSlot = "";
    for (const row of slots) {
      const d = Number(row.total?.demand) || 0;
      const c = Number(row.total?.consumption) || 0;
      const ls = Number(row.total?.loadshed) || 0;
      if (d >= peakDemand) {
        peakDemand = d;
        peakDemandSlot = row.hourSlot;
      }
      if (c >= peakConsumption) {
        peakConsumption = c;
        peakConsumptionSlot = row.hourSlot;
      }
      if (ls >= maxLoadshed) {
        maxLoadshed = ls;
        maxLoadshedSlot = row.hourSlot;
      }
    }
    return {
      peakDemand: peakDemand || null,
      peakDemandSlot,
      peakConsumption: peakConsumption || null,
      peakConsumptionSlot,
      maxLoadshed,
      maxLoadshedSlot,
    };
  }, [slots]);

  return (
    <div className="h-full flex flex-col min-h-0 bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xl shadow-slate-900/10">
      {/* Header */}
      <div className="shrink-0 px-3 sm:px-4 pt-3 pb-2 border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">
              Kushtia district
            </p>
            <h2 className="text-[15px] sm:text-base font-semibold text-slate-900 tracking-tight">
              Bottail + Bheramara load
            </h2>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-[18rem] sm:max-w-none">
              {data?.rangeLabel || `Boundary ${boundary}`}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setDay((d) => shiftDay(d, -1))}
              className="h-9 w-9 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:scale-95"
              aria-label="Previous day"
            >
              ‹
            </button>
            <input
              type="date"
              value={day}
              max={today}
              onChange={(e) => {
                if (e.target.value) setDay(clampDay(e.target.value));
              }}
              className="h-9 px-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-mono font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
            <button
              type="button"
              onClick={() =>
                setDay((d) => {
                  const n = shiftDay(d, 1);
                  return n > today ? today : n;
                })
              }
              disabled={day >= today}
              className="h-9 w-9 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:scale-95 disabled:opacity-40"
              aria-label="Next day"
            >
              ›
            </button>
            <button
              type="button"
              onClick={() => load(true)}
              disabled={loading}
              className="h-9 px-3 rounded-xl bg-slate-800 text-white text-[11px] font-bold uppercase tracking-wide hover:bg-slate-700 disabled:opacity-50"
            >
              {loading ? "…" : "↻"}
            </button>
          </div>
        </div>

        {/* Summary — professional muted cards */}
        <div className="mt-3 grid grid-cols-2 lg:grid-cols-4 gap-2">
          {[
            {
              label: "Peak demand",
              value: summary.peakDemand,
              slot: summary.peakDemandSlot,
              accent: "text-emerald-700",
            },
            {
              label: "Peak consumption",
              value: summary.peakConsumption,
              slot: summary.peakConsumptionSlot,
              accent: "text-teal-700",
            },
            {
              label: "Max LS",
              value: summary.maxLoadshed,
              slot: summary.maxLoadshedSlot,
              accent: "text-rose-700",
            },
            {
              label: "Stations",
              value: null,
              text: "Bottail · Bheramara",
              slot: `${boundary} window`,
              accent: "text-slate-800",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 shadow-sm"
            >
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                {s.label}
              </p>
              <p
                className={`mt-0.5 font-mono text-sm sm:text-base font-bold tabular-nums ${s.accent}`}
              >
                {s.text
                  ? s.text
                  : s.value != null
                    ? `${fmt(s.value)} MW`
                    : "—"}
              </p>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                {s.slot || "—"}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-auto">
        {loading && !data ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading…</div>
        ) : (
          <>
            {/* Mobile: cards */}
            <div className="md:hidden p-2.5 space-y-2.5 pb-4">
              {slots.map((row) => (
                <MobileSlotCard
                  key={`${row.dayKey}-${row.hourSlot}`}
                  row={row}
                />
              ))}
              {!loading && slots.length === 0 && (
                <p className="text-center text-slate-400 text-sm py-12">
                  No data for this operational day
                </p>
              )}
            </div>

            {/* Desktop / tablet: table */}
            <div className="hidden md:block overflow-auto">
              <table
                className="w-full min-w-[720px] text-left"
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
                      className="sticky left-0 z-20 px-2 py-2.5 border-b border-r border-slate-600 bg-slate-800 text-center align-middle"
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
                    <th className="px-1 py-2 border-b border-r border-slate-600 bg-teal-900 text-center">
                      Consumption
                    </th>
                    <th className="px-1 py-2 border-b border-r border-slate-600 bg-teal-900 text-center">
                      LS
                    </th>
                    <th className="px-1 py-2 border-b border-r border-slate-600 bg-emerald-800 text-center">
                      Demand
                    </th>
                    <th className="px-1 py-2 border-b border-r border-slate-600 bg-teal-900 text-center">
                      Allotment
                    </th>
                    <th className="px-1 py-2 border-b border-r border-slate-600 bg-amber-800 text-center">
                      Consumption
                    </th>
                    <th className="px-1 py-2 border-b border-r border-slate-600 bg-amber-800 text-center">
                      LS
                    </th>
                    <th className="px-1 py-2 border-b border-r border-slate-600 bg-emerald-800 text-center">
                      Demand
                    </th>
                    <th className="px-1 py-2 border-b border-r border-slate-600 bg-amber-800 text-center">
                      Allotment
                    </th>
                    <th className="px-1 py-2 border-b border-r border-slate-600 bg-slate-800 text-center">
                      Consumption
                    </th>
                    <th className="px-1 py-2 border-b border-r border-slate-600 bg-emerald-800 text-center">
                      Demand
                    </th>
                    <th className="px-1 py-2 border-b border-r border-slate-600 bg-slate-800 text-center">
                      Allotment
                    </th>
                    <th className="px-1 py-2 border-b border-slate-600 bg-slate-800 text-center">
                      LS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {slots.map((row, i) => (
                    <DesktopRow
                      key={`${row.dayKey}-${row.hourSlot}`}
                      row={row}
                      isAlt={i % 2 === 1}
                    />
                  ))}
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
          </>
        )}
      </div>

      <p className="shrink-0 px-3 py-2 text-[10px] text-slate-500 border-t border-slate-100 bg-slate-50 leading-relaxed">
        <strong className="text-slate-700">Demand</strong> = Consumption + LS · Allotment
        defaults to demand · Window ends on selected date at{" "}
        <strong className="text-slate-700">{boundary}</strong>
      </p>
    </div>
  );
}
