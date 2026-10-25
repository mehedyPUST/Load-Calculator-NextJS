"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchCalculations } from "@/lib/api";
import { FEEDERS, BOTTAIL_11KV_IDS } from "@/lib/constants";
import {
  LOGSHEET_SLOTS,
  toDayKey,
  recordSlotLabel,
  formatDayLabel,
} from "@/lib/logsheetSlots";
import SkeletonTable from "./SkeletonTable";

function formatMW(v) {
  if (v == null || !Number.isFinite(Number(v))) return "—";
  const n = Number(v);
  const r = Math.round((n + Number.EPSILON) * 10) / 10;
  return r.toFixed(1);
}

function formatAmps(v) {
  if (v == null || !Number.isFinite(Number(v))) return "—";
  return String(Math.round(Number(v)));
}

function formatKv(v) {
  if (v == null || !Number.isFinite(Number(v))) return "—";
  const n = Number(v);
  if (n === 0) return "0";
  return n.toFixed(2);
}

function todayKey() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

const COL_COUNT = 14;
const COL_WIDTH = 70;

/**
 * Distinct column palette per feeder (header + body cell tints).
 * Mirrors the existing Total (emerald) / Bottail (teal) / Bus (violet/sky) style.
 */
const FEEDER_COL = {
  1: { // BRB
    head: "bg-rose-900",
    cell: "text-rose-900 bg-rose-50/80",
    empty: "text-slate-300 bg-rose-50/30",
    foot: "bg-rose-800",
    max: "text-rose-950 bg-rose-100",
  },
  2: { // MRS
    head: "bg-orange-900",
    cell: "text-orange-900 bg-orange-50/80",
    empty: "text-slate-300 bg-orange-50/30",
    foot: "bg-orange-800",
    max: "text-orange-950 bg-orange-100",
  },
  3: { // Mozompur
    head: "bg-amber-800",
    cell: "text-amber-950 bg-amber-50/80",
    empty: "text-slate-300 bg-amber-50/30",
    foot: "bg-amber-700",
    max: "text-amber-950 bg-amber-100",
  },
  4: { // Housing
    head: "bg-lime-900",
    cell: "text-lime-900 bg-lime-50/80",
    empty: "text-slate-300 bg-lime-50/30",
    foot: "bg-lime-800",
    max: "text-lime-950 bg-lime-100",
  },
  5: { // Rajbari
    head: "bg-cyan-900",
    cell: "text-cyan-900 bg-cyan-50/80",
    empty: "text-slate-300 bg-cyan-50/30",
    foot: "bg-cyan-800",
    max: "text-cyan-950 bg-cyan-100",
  },
  6: { // Campus
    head: "bg-blue-900",
    cell: "text-blue-900 bg-blue-50/80",
    empty: "text-slate-300 bg-blue-50/30",
    foot: "bg-blue-800",
    max: "text-blue-950 bg-blue-100",
  },
  7: { // Koburhat
    head: "bg-indigo-900",
    cell: "text-indigo-900 bg-indigo-50/80",
    empty: "text-slate-300 bg-indigo-50/30",
    foot: "bg-indigo-800",
    max: "text-indigo-950 bg-indigo-100",
  },
  8: { // H-3
    head: "bg-pink-900",
    cell: "text-pink-900 bg-pink-50/80",
    empty: "text-slate-300 bg-pink-50/30",
    foot: "bg-pink-800",
    max: "text-pink-950 bg-pink-100",
  },
  9: { // T-3
    head: "bg-fuchsia-900",
    cell: "text-fuchsia-900 bg-fuchsia-50/80",
    empty: "text-slate-300 bg-fuchsia-50/30",
    foot: "bg-fuchsia-800",
    max: "text-fuchsia-950 bg-fuchsia-100",
  },
};

/**
 * @param {{ refreshKey?: number, unitMode?: 'mw' | 'amps' }} props
 */
export default function LogsheetView({ refreshKey = 0, unitMode = "mw" }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [records, setRecords] = useState([]);
  const [selectedDay, setSelectedDay] = useState(todayKey);
  const isAmps = unitMode === "amps";

  const load = useCallback(async (day = selectedDay) => {
    setLoading(true);
    setError("");
    try {
      // Fetch a ±1 calendar-day window so timezone edge cases never drop
      // the selected Dhaka day, then filter client-side with toDayKey.
      const pad = (ymd, delta) => {
        const [y, m, d] = String(ymd).split("-").map(Number);
        const dt = new Date(Date.UTC(y, m - 1, d + delta));
        return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
      };
      const res = await fetchCalculations({
        limit: 200,
        from: day ? pad(day, -1) : undefined,
        to: day ? pad(day, 1) : undefined,
      });
      setRecords(res.data || []);
    } catch (err) {
      setError(err?.message || "Failed to load");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDay]);

  useEffect(() => {
    load(selectedDay);
  }, [selectedDay, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDayChange = (e) => {
    const v = e.target.value; // YYYY-MM-DD from calendar
    if (v) setSelectedDay(v);
  };

  const shiftDay = (delta) => {
    const [y, m, d] = selectedDay.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + delta);
    const next = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
    if (delta > 0 && next > todayKey()) return;
    setSelectedDay(next);
  };

  const slotMap = useMemo(() => {
    const map = new Map();
    for (const r of records) {
      const day = toDayKey(r.calculatedAt || r.createdAt);
      if (day !== selectedDay) continue;
      const slot = recordSlotLabel(r);
      if (!slot) continue;
      const prev = map.get(slot);
      if (!prev) {
        map.set(slot, r);
        continue;
      }
      const preferNew =
        (r.isHourly && !prev.isHourly) ||
        (r.isHourly === prev.isHourly &&
          (Number(r.totalMW) || 0) >= (Number(prev.totalMW) || 0));
      if (preferNew) map.set(slot, r);
    }
    return map;
  }, [records, selectedDay]);

  const rows = useMemo(() => {
    return LOGSHEET_SLOTS.map((slot, idx) => {
      const rec = slotMap.get(slot.label) || null;
      const mwByFeeder = {};
      const ampsByFeeder = {};
      const ringByFeeder = {};
      if (rec?.feeders) {
        for (const f of rec.feeders) {
          mwByFeeder[f.id] = f.mw;
          ampsByFeeder[f.id] = f.amps;
          if (f.ringActive === true) ringByFeeder[f.id] = true;
        }
      }
      const hasRing =
        Object.keys(ringByFeeder).length > 0 ||
        rec?.hasActiveRing === true;

      let bottail11Mw = null;
      let bottail11Amps = null;
      if (rec) {
        bottail11Mw =
          Number(rec.bottail11kV) ||
          BOTTAIL_11KV_IDS.reduce(
            (s, id) => s + (Number(mwByFeeder[id]) || 0),
            0
          );
        bottail11Amps = BOTTAIL_11KV_IDS.reduce(
          (s, id) => s + (Number(ampsByFeeder[id]) || 0),
          0
        );
      }

      const totalMW =
        rec?.totalMW != null
          ? Number(rec.totalMW)
          : rec
            ? FEEDERS.reduce((s, f) => s + (Number(mwByFeeder[f.id]) || 0), 0)
            : null;

      const totalAmps = rec
        ? FEEDERS.reduce((s, f) => s + (Number(ampsByFeeder[f.id]) || 0), 0)
        : null;

      const bus1 =
        rec?.busVoltages?.bus1 != null ? Number(rec.busVoltages.bus1) : null;
      const bus2 =
        rec?.busVoltages?.bus2 != null ? Number(rec.busVoltages.bus2) : null;

      return {
        sn: idx + 1,
        time: slot.label,
        isSpecial: slot.isSpecial,
        record: rec,
        mwByFeeder,
        ampsByFeeder,
        ringByFeeder,
        hasRing,
        bottail11Mw,
        bottail11Amps,
        totalMW,
        totalAmps,
        bus1,
        bus2,
      };
    });
  }, [slotMap]);

  const filledCount = rows.filter((r) => r.record).length;

  /**
   * Day max per column individually:
   * Total, each feeder, H3+T3, Bus 2, Bus 1
   */
  const columnMaxes = useMemo(() => {
    const pick = (getVal) => {
      let best = null;
      for (const row of rows) {
        if (!row.record) continue;
        const v = getVal(row);
        if (v == null || !Number.isFinite(Number(v))) continue;
        const n = Number(v);
        if (!best || n > best.value) {
          best = { value: n, slot: row.time };
        }
      }
      return best;
    };

    const feeders = {};
    for (const f of FEEDERS) {
      feeders[f.id] = pick((row) =>
        isAmps ? row.ampsByFeeder[f.id] : row.mwByFeeder[f.id]
      );
    }

    return {
      total: pick((row) => (isAmps ? row.totalAmps : row.totalMW)),
      feeders,
      bottail: pick((row) => (isAmps ? row.bottail11Amps : row.bottail11Mw)),
      bus2: pick((row) => row.bus2),
      bus1: pick((row) => row.bus1),
    };
  }, [rows, isAmps]);

  const fmtFeeder = (row, feederId) => {
    if (!row.record) return "—";
    return isAmps
      ? formatAmps(row.ampsByFeeder[feederId])
      : formatMW(row.mwByFeeder[feederId]);
  };

  const fmtTotal = (row) => {
    if (!row.record) return "—";
    return isAmps ? formatAmps(row.totalAmps) : formatMW(row.totalMW);
  };

  const fmtBottail = (row) => {
    if (!row.record) return "—";
    return isAmps ? formatAmps(row.bottail11Amps) : formatMW(row.bottail11Mw);
  };

  const stickyTime = {
    position: "sticky",
    left: 0,
    width: `${100 / COL_COUNT}%`,
    minWidth: COL_WIDTH,
    zIndex: 30,
    boxShadow: "2px 0 4px -2px rgba(0,0,0,0.15)",
  };

  return (
    <div className="h-full flex flex-col min-h-0 bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xl shadow-slate-900/10">
      <div className="flex-shrink-0 flex flex-wrap items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 bg-gradient-to-b from-slate-50 to-slate-100/80 border-b border-slate-200/90">
        <label
          htmlFor="logsheet-day"
          className="text-[11px] font-semibold uppercase tracking-wider text-slate-500"
        >
          Day
        </label>
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            onClick={() => shiftDay(-1)}
            title="Previous day"
            aria-label="Previous day"
            className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 active:scale-95 transition-all"
          >
            ‹
          </button>
          <input
            id="logsheet-day"
            type="date"
            value={selectedDay}
            onChange={handleDayChange}
            max={todayKey()}
            className="text-sm font-medium bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
            aria-label="Select date"
          />
          <button
            type="button"
            onClick={() => shiftDay(1)}
            title="Next day"
            aria-label="Next day"
            disabled={selectedDay >= todayKey()}
            className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ›
          </button>
        </div>
        <span className="text-xs text-slate-600 font-medium hidden sm:inline">
          {formatDayLabel(selectedDay)}
        </span>
        <span className="text-xs text-slate-500">
          {filledCount}/26 slots · {isAmps ? "Amps" : "MW"}
        </span>
        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 rounded-full px-2 py-0.5">
          <span className="font-bold">*</span>
          = ring active
        </span>
        <button
          type="button"
          onClick={() => load(selectedDay)}
          disabled={loading}
          className="ml-auto text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {loading ? "…" : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="px-4 py-2 bg-red-50 text-red-700 text-sm border-b border-red-100">
          {error}
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto relative sheet-scroll-x">
        {loading && !records.length ? (
          <div className="p-3">
            <SkeletonTable rows={12} columns={10} dark={false} />
          </div>
        ) : (
          <table
            className="table-fixed sheet-table w-full text-left min-w-full border border-slate-300"
            style={{ borderCollapse: "separate", borderSpacing: 0 }}
          >
            <thead className="sticky top-0 z-40">
              <tr className="bg-slate-800 text-white text-[10px] uppercase tracking-wider">
                <th
                  className="px-1 py-2.5 font-semibold text-center bg-slate-800 border-b border-r border-slate-600"
                  style={{ ...stickyTime, zIndex: 50 }}
                >
                  Time
                </th>
                <th
                  className="px-1.5 py-2.5 font-semibold text-center border-b border-r border-slate-600 bg-emerald-900"
                  style={{ width: `${100 / COL_COUNT}%`, minWidth: COL_WIDTH }}
                >
                  Total
                </th>
                {FEEDERS.map((f) => {
                  const col = FEEDER_COL[f.id] || { head: "bg-slate-800" };
                  return (
                    <th
                      key={f.id}
                      className={`px-1 py-2.5 font-semibold text-center whitespace-nowrap border-b border-r border-slate-600 ${col.head}`}
                      title={`BUS-${f.bus}`}
                      style={{ width: `${100 / COL_COUNT}%`, minWidth: COL_WIDTH }}
                    >
                      {f.name}
                    </th>
                  );
                })}
                <th
                  className="px-1 py-2.5 font-semibold text-center whitespace-nowrap bg-teal-900 border-b border-r border-slate-600"
                  style={{ width: `${100 / COL_COUNT}%`, minWidth: COL_WIDTH }}
                  title="H-3 + T-3"
                >
                  H3+T3
                </th>
                <th
                  className="px-1 py-2.5 font-semibold text-center whitespace-nowrap bg-violet-900 border-b border-r border-slate-600"
                  style={{ width: `${100 / COL_COUNT}%`, minWidth: COL_WIDTH }}
                  title="BUS-2 voltage (kV)"
                >
                  Bus 2
                </th>
                <th
                  className="px-1 py-2.5 font-semibold text-center whitespace-nowrap bg-sky-900 border-b border-slate-600"
                  style={{ width: `${100 / COL_COUNT}%`, minWidth: COL_WIDTH }}
                  title="BUS-1 voltage (kV)"
                >
                  Bus 1
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.flatMap((row, idx) => {
                const has = !!row.record;
                const alt = idx % 2 === 1;
                // Alternating depth: special slots stay amber; others light/deep slate
                const rowBg = row.isSpecial
                  ? "bg-amber-50 hover:bg-amber-100/90"
                  : alt
                    ? "bg-slate-100/80 hover:bg-emerald-50"
                    : "bg-white hover:bg-emerald-50/80";
                const stickyBg = row.isSpecial
                  ? "#fffbeb"
                  : alt
                    ? "#f1f5f9"
                    : "#ffffff";
                const stickyHover = row.isSpecial
                  ? "#fef3c7"
                  : "#ecfdf5";
                const dataRow = (
                  <tr
                    key={row.time}
                    className={`text-xs group transition-colors duration-150 ${rowBg}`}
                  >
                    <td
                      className={`px-1 py-1.5 text-center align-middle font-mono font-semibold border-b border-r border-slate-200 group-hover:!bg-[var(--sticky-hover)] ${row.isSpecial ? "text-amber-800" : "text-slate-700"
                        }`}
                      style={{
                        ...stickyTime,
                        backgroundColor: stickyBg,
                        ["--sticky-hover"]: stickyHover,
                      }}
                    >
                      {row.time}
                    </td>
                    <td
                      className={`px-2 py-1.5 text-center align-middle font-mono font-bold tabular-nums border-b border-r border-slate-200 ${has
                          ? "text-emerald-800 bg-emerald-50/70 group-hover:bg-emerald-100"
                          : "text-slate-300 bg-emerald-50/30 group-hover:bg-emerald-50/50"
                        }`}
                      title={row.hasRing ? "Ring line active on one or more feeders" : undefined}
                    >
                      <span className="inline-flex items-center justify-center gap-0.5">
                        {fmtTotal(row)}
                        {row.hasRing ? (
                          <span
                            className="text-emerald-700 text-[12px] font-bold leading-none"
                            aria-label="ring active"
                          >
                            *
                          </span>
                        ) : null}
                      </span>
                    </td>
                    {FEEDERS.map((f) => {
                      const col = FEEDER_COL[f.id] || {
                        cell: "text-slate-800",
                        empty: "text-slate-300",
                      };
                      return (
                        <td
                          key={f.id}
                          className={`px-1.5 py-1.5 text-center align-middle font-mono tabular-nums border-b border-r border-slate-200 relative ${has
                              ? `${col.cell} group-hover:brightness-95`
                              : col.empty
                            } ${row.ringByFeeder?.[f.id] ? "ring-1 ring-inset ring-amber-400/60" : ""}`}
                          title={
                            row.ringByFeeder?.[f.id]
                              ? `${f.name}: ring line active`
                              : undefined
                          }
                        >
                          <span className="inline-flex items-center justify-center gap-0.5">
                            {fmtFeeder(row, f.id)}
                            {row.ringByFeeder?.[f.id] ? (
                              <span
                                className="text-[12px] font-bold leading-none opacity-90"
                                style={{ color: "currentColor" }}
                                aria-label="ring on"
                              >
                                *
                              </span>
                            ) : null}
                          </span>
                        </td>
                      );
                    })}
                    <td
                      className={`px-1.5 py-1.5 text-center align-middle font-mono tabular-nums font-semibold border-b border-r border-slate-200 ${has
                          ? "text-teal-800 bg-teal-50/80 group-hover:bg-teal-100"
                          : "text-slate-300 bg-teal-50/40 group-hover:bg-teal-50/60"
                        }`}
                    >
                      {fmtBottail(row)}
                    </td>
                    <td
                      className={`px-1.5 py-1.5 text-center align-middle font-mono tabular-nums border-b border-r border-slate-200 ${has
                          ? "text-violet-900 bg-violet-50/70 group-hover:bg-violet-100"
                          : "text-slate-300 bg-violet-50/30 group-hover:bg-violet-50/50"
                        }`}
                    >
                      {has ? formatKv(row.bus2) : "—"}
                    </td>
                    <td
                      className={`px-1.5 py-1.5 text-center align-middle font-mono tabular-nums border-b border-r border-slate-200 ${has
                          ? "text-sky-900 bg-sky-50/70 group-hover:bg-sky-100"
                          : "text-slate-300 bg-sky-50/30 group-hover:bg-sky-50/50"
                        }`}
                    >
                      {has ? formatKv(row.bus1) : "—"}
                    </td>
                  </tr>
                );

                // Blank separator rows after 08:00, 14:00 and 20:00
                if (row.time === "08:00" || row.time === "14:00" || row.time === "20:00") {
                  return [
                    dataRow,
                    <tr key={`blank-after-${row.time}`} className="h-3">
                      <td
                        colSpan={COL_COUNT}
                        className="border-b border-slate-300 bg-slate-100/80 p-0"
                        style={{ height: "0.75rem" }}
                      />
                    </tr>,
                  ];
                }
                return [dataRow];
              })}
            </tbody>
            {filledCount > 0 && (
              <tfoot className="sticky bottom-0 z-30">
                <tr className="bg-slate-700 text-white text-[9px] uppercase tracking-wide">
                  <td
                    className="px-1 py-1.5 text-center font-bold border-t-2 border-slate-500 border-r border-slate-600"
                    style={{
                      ...stickyTime,
                      zIndex: 40,
                      backgroundColor: "#334155",
                      boxShadow: "2px 0 4px -2px rgba(0,0,0,0.2)",
                    }}
                  >
                    Day max
                  </td>
                  <td className="px-1 py-1 text-center font-semibold border-t-2 border-slate-500 border-r border-slate-600 bg-emerald-800">
                    Total
                  </td>
                  {FEEDERS.map((f) => {
                    const col = FEEDER_COL[f.id] || { foot: "bg-slate-700" };
                    return (
                      <td
                        key={f.id}
                        className={`px-1 py-1 text-center font-semibold border-t-2 border-slate-500 border-r border-slate-600 ${col.foot}`}
                      >
                        {f.name}
                      </td>
                    );
                  })}
                  <td className="px-1 py-1 text-center font-semibold border-t-2 border-slate-500 border-r border-slate-600 bg-teal-800">
                    B11
                  </td>
                  <td className="px-1 py-1 text-center font-semibold border-t-2 border-slate-500 border-r border-slate-600 bg-violet-800">
                    Bus2
                  </td>
                  <td className="px-1 py-1 text-center font-semibold border-t-2 border-slate-500 border-r border-slate-600 bg-sky-800">
                    Bus1
                  </td>
                </tr>
                <tr className="text-[11px] bg-amber-50">
                  <td
                    className="px-1 py-1.5 text-center font-bold text-slate-700 border-b border-r border-slate-300"
                    style={{
                      ...stickyTime,
                      backgroundColor: "#fffbeb",
                      zIndex: 40,
                    }}
                  >
                    Max
                  </td>
                  <td className="px-1 py-1.5 text-center font-mono font-bold text-emerald-900 border-b border-r border-slate-300 bg-emerald-100">
                    {columnMaxes.total
                      ? isAmps
                        ? formatAmps(columnMaxes.total.value)
                        : formatMW(columnMaxes.total.value)
                      : "—"}
                  </td>
                  {FEEDERS.map((f) => {
                    const m = columnMaxes.feeders[f.id];
                    const col = FEEDER_COL[f.id] || {
                      max: "text-slate-900 bg-amber-50",
                    };
                    return (
                      <td
                        key={f.id}
                        className={`px-1 py-1.5 text-center font-mono font-bold border-b border-r border-slate-300 ${col.max}`}
                      >
                        {m
                          ? isAmps
                            ? formatAmps(m.value)
                            : formatMW(m.value)
                          : "—"}
                      </td>
                    );
                  })}
                  <td className="px-1 py-1.5 text-center font-mono font-bold text-teal-900 border-b border-r border-slate-300 bg-teal-100">
                    {columnMaxes.bottail
                      ? isAmps
                        ? formatAmps(columnMaxes.bottail.value)
                        : formatMW(columnMaxes.bottail.value)
                      : "—"}
                  </td>
                  <td className="px-1 py-1.5 text-center font-mono font-bold text-violet-950 border-b border-r border-slate-300 bg-violet-100">
                    {columnMaxes.bus2 ? formatKv(columnMaxes.bus2.value) : "—"}
                  </td>
                  <td className="px-1 py-1.5 text-center font-mono font-bold text-sky-950 border-b border-slate-300 bg-sky-100">
                    {columnMaxes.bus1 ? formatKv(columnMaxes.bus1.value) : "—"}
                  </td>
                </tr>
                <tr className="text-[10px] bg-amber-100/90">
                  <td
                    className="px-1 py-1 text-center font-semibold text-slate-600 border-r border-slate-300"
                    style={{
                      ...stickyTime,
                      backgroundColor: "#fef3c7",
                      zIndex: 40,
                    }}
                  >
                    At
                  </td>
                  <td className="px-1 py-1 text-center font-mono text-emerald-800 border-r border-slate-300 bg-emerald-50">
                    {columnMaxes.total?.slot || "—"}
                  </td>
                  {FEEDERS.map((f) => {
                    const col = FEEDER_COL[f.id] || { empty: "text-slate-600" };
                    return (
                      <td
                        key={f.id}
                        className={`px-1 py-1 text-center font-mono border-r border-slate-300 ${col.empty}`}
                      >
                        {columnMaxes.feeders[f.id]?.slot || "—"}
                      </td>
                    );
                  })}
                  <td className="px-1 py-1 text-center font-mono text-teal-800 border-r border-slate-300 bg-teal-50">
                    {columnMaxes.bottail?.slot || "—"}
                  </td>
                  <td className="px-1 py-1 text-center font-mono text-violet-800 border-r border-slate-300 bg-violet-50">
                    {columnMaxes.bus2?.slot || "—"}
                  </td>
                  <td className="px-1 py-1 text-center font-mono text-sky-800 bg-sky-50">
                    {columnMaxes.bus1?.slot || "—"}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        )}
      </div>
    </div>
  );
}