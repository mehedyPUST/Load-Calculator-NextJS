"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Hash } from "lucide-react";
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

function formatRoundedTotal(v) {
  if (v == null || !Number.isFinite(Number(v))) return "—";
  return String(Math.round(Number(v)));
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
 * Cohesive substation bus-coded column palette per feeder (BUS-2 purple, BUS-1 sky).
 * Mirrors StatisticsView's Total (emerald) / Bottail (teal) / Bus (purple/sky) style.
 */
const FEEDER_COL = {
  1: { // BRB (BUS-2)
    head: "bg-purple-950/85 text-purple-200",
    cell: "text-slate-100 bg-purple-950/10",
    empty: "text-slate-600 bg-purple-950/5",
    foot: "bg-purple-950/85 text-purple-200",
    max: "text-amber-300 bg-amber-950/35",
  },
  2: { // MRS (BUS-1)
    head: "bg-sky-950/85 text-sky-200",
    cell: "text-slate-100 bg-sky-950/10",
    empty: "text-slate-600 bg-sky-950/5",
    foot: "bg-sky-950/85 text-sky-200",
    max: "text-amber-300 bg-amber-950/35",
  },
  3: { // Mozompur (BUS-2)
    head: "bg-purple-950/85 text-purple-200",
    cell: "text-slate-100 bg-purple-950/10",
    empty: "text-slate-600 bg-purple-950/5",
    foot: "bg-purple-950/85 text-purple-200",
    max: "text-amber-300 bg-amber-950/35",
  },
  4: { // Housing (BUS-1)
    head: "bg-sky-950/85 text-sky-200",
    cell: "text-slate-100 bg-sky-950/10",
    empty: "text-slate-600 bg-sky-950/5",
    foot: "bg-sky-950/85 text-sky-200",
    max: "text-amber-300 bg-amber-950/35",
  },
  5: { // Rajbari (BUS-1)
    head: "bg-sky-950/85 text-sky-200",
    cell: "text-slate-100 bg-sky-950/10",
    empty: "text-slate-600 bg-sky-950/5",
    foot: "bg-sky-950/85 text-sky-200",
    max: "text-amber-300 bg-amber-950/35",
  },
  6: { // Campus (BUS-2)
    head: "bg-purple-950/85 text-purple-200",
    cell: "text-slate-100 bg-purple-950/10",
    empty: "text-slate-600 bg-purple-950/5",
    foot: "bg-purple-950/85 text-purple-200",
    max: "text-amber-300 bg-amber-950/35",
  },
  7: { // Koburhat (BUS-2)
    head: "bg-purple-950/85 text-purple-200",
    cell: "text-slate-100 bg-purple-950/10",
    empty: "text-slate-600 bg-purple-950/5",
    foot: "bg-purple-950/85 text-purple-200",
    max: "text-amber-300 bg-amber-950/35",
  },
  8: { // H-3 (BUS-1)
    head: "bg-sky-950/85 text-sky-200",
    cell: "text-slate-100 bg-sky-950/10",
    empty: "text-slate-600 bg-sky-950/5",
    foot: "bg-sky-950/85 text-sky-200",
    max: "text-amber-300 bg-amber-950/35",
  },
  9: { // T-3 (BUS-2)
    head: "bg-purple-950/85 text-purple-200",
    cell: "text-slate-100 bg-purple-950/10",
    empty: "text-slate-600 bg-purple-950/5",
    foot: "bg-purple-950/85 text-purple-200",
    max: "text-amber-300 bg-amber-950/35",
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
  const [roundTotal, setRoundTotal] = useState(false);
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
    if (isAmps) return formatAmps(row.totalAmps);
    return roundTotal ? formatRoundedTotal(row.totalMW) : formatMW(row.totalMW);
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
    boxShadow: "2px 0 6px -2px rgba(0,0,0,0.5)",
  };

  return (
    <div className="h-full flex flex-col min-h-0 bg-slate-900/60 rounded-2xl border border-white/10 overflow-hidden shadow-xl shadow-black/40">
      <div className="flex-shrink-0 flex flex-wrap items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 bg-slate-950/75 border-b border-white/10">
        <label
          htmlFor="logsheet-day"
          className="text-[11px] font-semibold uppercase tracking-wider text-slate-400"
        >
          Day
        </label>
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            onClick={() => shiftDay(-1)}
            title="Previous day"
            aria-label="Previous day"
            className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-white/10 bg-slate-900 text-slate-200 hover:bg-slate-800 hover:border-white/20 active:scale-95 transition-all"
          >
            ‹
          </button>
          <input
            id="logsheet-day"
            type="date"
            value={selectedDay}
            onChange={handleDayChange}
            max={todayKey()}
            className="text-sm font-medium bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
            aria-label="Select date"
          />
          <button
            type="button"
            onClick={() => shiftDay(1)}
            title="Next day"
            aria-label="Next day"
            disabled={selectedDay >= todayKey()}
            className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-white/10 bg-slate-900 text-slate-200 hover:bg-slate-800 hover:border-white/20 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ›
          </button>
        </div>
        <span className="text-xs text-slate-300 font-medium hidden sm:inline">
          {formatDayLabel(selectedDay)}
        </span>
        <span className="text-xs text-slate-400 tabular-nums">
          {filledCount}/26 slots · {isAmps ? "Amps" : "MW"}
        </span>
        <span className="hidden sm:inline text-[11px] font-medium text-amber-300/90">
          * ring active
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setRoundTotal((v) => !v)}
            aria-pressed={roundTotal}
            title="Show Total column as rounded whole numbers (no decimal point)"
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
              roundTotal
                ? "bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-500 shadow-sm"
                : "bg-slate-800 border-white/10 text-slate-100 hover:bg-slate-700"
            }`}
          >
            <Hash className="w-3.5 h-3.5 shrink-0" />
            <span>Round Total</span>
          </button>
          <button
            type="button"
            onClick={() => load(selectedDay)}
            disabled={loading}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 border border-white/10 text-slate-100 hover:bg-slate-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "…" : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div className="px-4 py-2 bg-rose-950/60 text-rose-300 text-sm border-b border-rose-500/30">
          {error}
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto relative sheet-scroll-x">
        {loading && !records.length ? (
          <div className="p-3">
            <SkeletonTable rows={12} columns={10} dark />
          </div>
        ) : (
          <table
            className="table-fixed sheet-table w-full text-left min-w-full border border-slate-800"
            style={{ borderCollapse: "separate", borderSpacing: 0 }}
          >
            <thead className="sticky top-0 z-40">
              <tr className="bg-slate-950 text-slate-200 text-[10px] uppercase tracking-wider">
                <th
                  className="px-1 py-2.5 font-semibold text-center bg-indigo-950 text-indigo-200 border-b border-r border-slate-800"
                  style={{ ...stickyTime, zIndex: 50 }}
                >
                  Time
                </th>
                <th
                  className="px-1.5 py-2.5 font-semibold text-center border-b border-r border-slate-800 bg-emerald-950/90 text-emerald-300"
                  style={{ width: `${100 / COL_COUNT}%`, minWidth: COL_WIDTH }}
                >
                  Total
                </th>
                {FEEDERS.map((f) => {
                  const col = FEEDER_COL[f.id] || { head: "bg-slate-900 text-slate-200" };
                  return (
                    <th
                      key={f.id}
                      className={`px-1 py-2.5 font-semibold text-center whitespace-nowrap border-b border-r border-slate-800 ${col.head}`}
                      title={`BUS-${f.bus}`}
                      style={{ width: `${100 / COL_COUNT}%`, minWidth: COL_WIDTH }}
                    >
                      {f.name}
                    </th>
                  );
                })}
                <th
                  className="px-1 py-2.5 font-semibold text-center whitespace-nowrap bg-teal-950/90 text-teal-300 border-b border-r border-slate-800"
                  style={{ width: `${100 / COL_COUNT}%`, minWidth: COL_WIDTH }}
                  title="H-3 + T-3"
                >
                  H3+T3
                </th>
                <th
                  className="px-1 py-2.5 font-semibold text-center whitespace-nowrap bg-purple-950/90 text-purple-300 border-b border-r border-slate-800"
                  style={{ width: `${100 / COL_COUNT}%`, minWidth: COL_WIDTH }}
                  title="BUS-2 voltage (kV)"
                >
                  Bus 2
                </th>
                <th
                  className="px-1 py-2.5 font-semibold text-center whitespace-nowrap bg-sky-950/90 text-sky-300 border-b border-slate-800"
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
                // Alternating depth: special slots stay amber; others dark slate
                const rowBg = row.isSpecial
                  ? "bg-amber-950/30 hover:bg-amber-950/50"
                  : alt
                    ? "bg-slate-900/75 hover:bg-slate-800/80"
                    : "bg-[#0b1220] hover:bg-slate-800/70";
                const stickyBg = row.isSpecial
                  ? "var(--sticky-special)"
                  : alt
                    ? "var(--sticky-odd)"
                    : "var(--sticky-even)";
                const stickyHover = row.isSpecial
                  ? "var(--sticky-special-hover)"
                  : "var(--sticky-hover)";
                const dataRow = (
                  <tr
                    key={row.time}
                    className={`text-xs group transition-colors duration-150 ${rowBg}`}
                  >
                    <td
                      className={`px-1 py-1.5 text-center align-middle font-mono font-semibold border-b border-r border-slate-800 group-hover:!bg-[var(--sticky-row-hover)] ${row.isSpecial ? "text-amber-300" : "text-slate-200"
                        }`}
                      style={{
                        ...stickyTime,
                        backgroundColor: stickyBg,
                        ["--sticky-row-hover"]: stickyHover,
                      }}
                    >
                      {row.time}
                    </td>
                    <td
                      className={`px-2 py-1.5 text-center align-middle font-mono font-bold tabular-nums border-b border-r border-slate-800 ${has
                          ? "text-emerald-400 bg-emerald-950/25 group-hover:bg-emerald-950/40"
                          : "text-slate-600 bg-emerald-950/10 group-hover:bg-emerald-950/20"
                        }`}
                      title={row.hasRing ? "Ring line active on one or more feeders" : undefined}
                    >
                      <span className="inline-flex items-center justify-center gap-0.5">
                        {fmtTotal(row)}
                        {row.hasRing ? (
                          <span
                            className="text-amber-400 text-[12px] font-bold leading-none"
                            aria-label="ring active"
                          >
                            *
                          </span>
                        ) : null}
                      </span>
                    </td>
                    {FEEDERS.map((f) => {
                      const col = FEEDER_COL[f.id] || {
                        cell: "text-slate-100",
                        empty: "text-slate-600",
                      };
                      return (
                        <td
                          key={f.id}
                          className={`px-1.5 py-1.5 text-center align-middle font-mono tabular-nums border-b border-r border-slate-800 relative ${has
                              ? `${col.cell} group-hover:bg-slate-800/70`
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
                                className="text-[12px] font-bold leading-none text-amber-400"
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
                      className={`px-1.5 py-1.5 text-center align-middle font-mono tabular-nums font-semibold border-b border-r border-slate-800 ${has
                          ? "text-teal-300 bg-teal-950/25 group-hover:bg-teal-950/40"
                          : "text-slate-600 bg-teal-950/10 group-hover:bg-teal-950/20"
                        }`}
                    >
                      {fmtBottail(row)}
                    </td>
                    <td
                      className={`px-1.5 py-1.5 text-center align-middle font-mono tabular-nums border-b border-r border-slate-800 ${has
                          ? "text-purple-300 bg-purple-950/20 group-hover:bg-purple-950/35"
                          : "text-slate-600 bg-purple-950/10 group-hover:bg-purple-950/20"
                        }`}
                    >
                      {has ? formatKv(row.bus2) : "—"}
                    </td>
                    <td
                      className={`px-1.5 py-1.5 text-center align-middle font-mono tabular-nums border-b border-slate-800 ${has
                          ? "text-sky-300 bg-sky-950/20 group-hover:bg-sky-950/35"
                          : "text-slate-600 bg-sky-950/10 group-hover:bg-sky-950/20"
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
                        className="border-b border-slate-800 bg-slate-950/90 p-0"
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
                <tr className="bg-slate-950 text-slate-300 text-[9px] uppercase tracking-wide">
                  <td
                    className="px-1 py-1.5 text-center font-bold border-t-2 border-slate-700 border-r border-slate-800"
                    style={{
                      ...stickyTime,
                      zIndex: 40,
                      backgroundColor: "var(--sticky-foot-head)",
                      boxShadow: "var(--sticky-shadow)",
                    }}
                  >
                    Day max
                  </td>
                  <td className="px-1 py-1 text-center font-semibold border-t-2 border-slate-700 border-r border-slate-800 bg-emerald-950 text-emerald-300">
                    Total
                  </td>
                  {FEEDERS.map((f) => {
                    const col = FEEDER_COL[f.id] || { foot: "bg-slate-900 text-slate-200" };
                    return (
                      <td
                        key={f.id}
                        className={`px-1 py-1 text-center font-semibold border-t-2 border-slate-700 border-r border-slate-800 ${col.foot}`}
                      >
                        {f.name}
                      </td>
                    );
                  })}
                  <td className="px-1 py-1 text-center font-semibold border-t-2 border-slate-700 border-r border-slate-800 bg-teal-950 text-teal-300">
                    B11
                  </td>
                  <td className="px-1 py-1 text-center font-semibold border-t-2 border-slate-700 border-r border-slate-800 bg-purple-950 text-purple-300">
                    Bus2
                  </td>
                  <td className="px-1 py-1 text-center font-semibold border-t-2 border-slate-700 bg-sky-950 text-sky-300">
                    Bus1
                  </td>
                </tr>
                <tr className="text-[11px] bg-amber-950/35">
                  <td
                    className="px-1 py-1.5 text-center font-bold text-amber-300 border-b border-r border-slate-800"
                    style={{
                      ...stickyTime,
                      backgroundColor: "var(--sticky-special)",
                      zIndex: 40,
                    }}
                  >
                    Max
                  </td>
                  <td className="px-1 py-1.5 text-center font-mono font-bold text-emerald-300 border-b border-r border-slate-800 bg-emerald-950/70">
                    {columnMaxes.total
                      ? isAmps
                        ? formatAmps(columnMaxes.total.value)
                        : roundTotal
                          ? formatRoundedTotal(columnMaxes.total.value)
                          : formatMW(columnMaxes.total.value)
                      : "—"}
                  </td>
                  {FEEDERS.map((f) => {
                    const m = columnMaxes.feeders[f.id];
                    const col = FEEDER_COL[f.id] || {
                      max: "text-amber-300 bg-amber-950/35",
                    };
                    return (
                      <td
                        key={f.id}
                        className={`px-1 py-1.5 text-center font-mono font-bold border-b border-r border-slate-800 ${col.max}`}
                      >
                        {m
                          ? isAmps
                            ? formatAmps(m.value)
                            : formatMW(m.value)
                          : "—"}
                      </td>
                    );
                  })}
                  <td className="px-1 py-1.5 text-center font-mono font-bold text-teal-300 border-b border-r border-slate-800 bg-teal-950/70">
                    {columnMaxes.bottail
                      ? isAmps
                        ? formatAmps(columnMaxes.bottail.value)
                        : formatMW(columnMaxes.bottail.value)
                      : "—"}
                  </td>
                  <td className="px-1 py-1.5 text-center font-mono font-bold text-purple-300 border-b border-r border-slate-800 bg-purple-950/70">
                    {columnMaxes.bus2 ? formatKv(columnMaxes.bus2.value) : "—"}
                  </td>
                  <td className="px-1 py-1.5 text-center font-mono font-bold text-sky-300 border-b border-slate-800 bg-sky-950/70">
                    {columnMaxes.bus1 ? formatKv(columnMaxes.bus1.value) : "—"}
                  </td>
                </tr>
                <tr className="text-[10px] bg-slate-950/90">
                  <td
                    className="px-1 py-1 text-center font-semibold text-slate-400 border-r border-slate-800"
                    style={{
                      ...stickyTime,
                      backgroundColor: "var(--sticky-foot-sub)",
                      zIndex: 40,
                    }}
                  >
                    At
                  </td>
                  <td className="px-1 py-1 text-center font-mono text-emerald-400/90 border-r border-slate-800 bg-emerald-950/40">
                    {columnMaxes.total?.slot || "—"}
                  </td>
                  {FEEDERS.map((f) => (
                    <td
                      key={f.id}
                      className="px-1 py-1 text-center font-mono text-slate-400 border-r border-slate-800 bg-slate-950/80"
                    >
                      {columnMaxes.feeders[f.id]?.slot || "—"}
                    </td>
                  ))}
                  <td className="px-1 py-1 text-center font-mono text-teal-400/90 border-r border-slate-800 bg-teal-950/40">
                    {columnMaxes.bottail?.slot || "—"}
                  </td>
                  <td className="px-1 py-1 text-center font-mono text-purple-400/90 border-r border-slate-800 bg-purple-950/40">
                    {columnMaxes.bus2?.slot || "—"}
                  </td>
                  <td className="px-1 py-1 text-center font-mono text-sky-400/90 bg-sky-950/40">
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