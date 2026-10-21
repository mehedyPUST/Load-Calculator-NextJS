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

/** Fixed widths so sticky left offsets stay accurate */
const SN_W = 40;
const TIME_W = 56;

/**
 * @param {{ refreshKey?: number, unitMode?: 'mw' | 'amps' }} props
 */
export default function LogsheetView({ refreshKey = 0, unitMode = "mw" }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [records, setRecords] = useState([]);
  const [selectedDay, setSelectedDay] = useState(todayKey);
  const isAmps = unitMode === "amps";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchCalculations({ limit: 200 });
      setRecords(res.data || []);
    } catch (err) {
      setError(err?.message || "Failed to load");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const availableDays = useMemo(() => {
    const set = new Set();
    for (const r of records) {
      const k = toDayKey(r.calculatedAt || r.createdAt);
      if (k) set.add(k);
    }
    return Array.from(set).sort().reverse();
  }, [records]);

  useEffect(() => {
    if (!availableDays.length) return;
    if (!availableDays.includes(selectedDay)) {
      setSelectedDay(availableDays[0]);
    }
  }, [availableDays, selectedDay]);

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
      if (rec?.feeders) {
        for (const f of rec.feeders) {
          mwByFeeder[f.id] = f.mw;
          ampsByFeeder[f.id] = f.amps;
        }
      }

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
   * Total, each feeder, Bottail 11 kV, Bus 2, Bus 1
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

  const stickySn = {
    position: "sticky",
    left: 0,
    width: SN_W,
    minWidth: SN_W,
    maxWidth: SN_W,
    zIndex: 30,
  };
  const stickyTime = {
    position: "sticky",
    left: SN_W,
    width: TIME_W,
    minWidth: TIME_W,
    maxWidth: TIME_W,
    zIndex: 30,
    boxShadow: "2px 0 4px -2px rgba(0,0,0,0.15)",
  };

  return (
    <div className="h-full flex flex-col min-h-0 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-lg">
      <div className="flex-shrink-0 flex flex-wrap items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 bg-slate-50 border-b border-slate-200">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Day
        </label>
        <select
          value={selectedDay}
          onChange={(e) => setSelectedDay(e.target.value)}
          className="text-sm font-medium bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        >
          {availableDays.length === 0 && (
            <option value={selectedDay}>{formatDayLabel(selectedDay)}</option>
          )}
          {availableDays.map((d) => (
            <option key={d} value={d}>
              {formatDayLabel(d)}
            </option>
          ))}
        </select>
        <span className="text-xs text-slate-500">
          {filledCount}/26 slots · {isAmps ? "Amps" : "MW"}
        </span>
        <button
          type="button"
          onClick={load}
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

      <div className="flex-1 min-h-0 overflow-auto relative">
        {loading && !records.length ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          </div>
        ) : (
          <table
            className="w-full text-left min-w-[960px] border border-slate-300"
            style={{ borderCollapse: "separate", borderSpacing: 0 }}
          >
            <thead className="sticky top-0 z-40">
              <tr className="bg-slate-800 text-white text-[10px] uppercase tracking-wider">
                <th
                  className="px-1 py-2.5 font-semibold text-center bg-slate-800 border-b border-r border-slate-600"
                  style={{ ...stickySn, zIndex: 50 }}
                >
                  SN
                </th>
                <th
                  className="px-1 py-2.5 font-semibold text-center bg-slate-800 border-b border-r border-slate-600"
                  style={{ ...stickyTime, zIndex: 50 }}
                >
                  Time
                </th>
                <th className="px-2 py-2.5 font-semibold text-center border-b border-r border-slate-600 bg-emerald-900 min-w-[3.5rem]">
                  Total
                </th>
                {FEEDERS.map((f) => (
                  <th
                    key={f.id}
                    className="px-1.5 py-2.5 font-semibold text-center whitespace-nowrap border-b border-r border-slate-600 bg-slate-800"
                    title={`BUS-${f.bus}`}
                  >
                    {f.name}
                  </th>
                ))}
                <th
                  className="px-1.5 py-2.5 font-semibold text-center whitespace-nowrap bg-teal-900 border-b border-r border-slate-600"
                  title="H-3 + T-3"
                >
                  Bottail 11 kV
                </th>
                <th
                  className="px-1.5 py-2.5 font-semibold text-center whitespace-nowrap bg-violet-900 border-b border-r border-slate-600"
                  title="BUS-2 voltage (kV)"
                >
                  Bus 2
                </th>
                <th
                  className="px-1.5 py-2.5 font-semibold text-center whitespace-nowrap bg-sky-900 border-b border-slate-600"
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
                const rowBg = row.isSpecial
                  ? "bg-amber-50"
                  : alt
                    ? "bg-slate-50"
                    : "bg-white";
                const stickyBg = row.isSpecial
                  ? "#fffbeb"
                  : alt
                    ? "#f8fafc"
                    : "#ffffff";
                const dataRow = (
                  <tr key={row.time} className={`text-xs ${rowBg}`}>
                    <td
                      className="px-1 py-1.5 text-center text-slate-500 font-medium border-b border-r border-slate-200"
                      style={{ ...stickySn, backgroundColor: stickyBg }}
                    >
                      {row.sn}
                    </td>
                    <td
                      className={`px-1 py-1.5 text-center font-mono font-semibold border-b border-r border-slate-200 ${
                        row.isSpecial ? "text-amber-800" : "text-slate-700"
                      }`}
                      style={{ ...stickyTime, backgroundColor: stickyBg }}
                    >
                      {row.time}
                    </td>
                    <td
                      className={`px-2 py-1.5 text-center font-mono font-bold tabular-nums border-b border-r border-slate-200 ${
                        has
                          ? "text-emerald-800 bg-emerald-50/70"
                          : "text-slate-300 bg-emerald-50/30"
                      }`}
                    >
                      {fmtTotal(row)}
                    </td>
                    {FEEDERS.map((f) => (
                      <td
                        key={f.id}
                        className={`px-1.5 py-1.5 text-center font-mono tabular-nums border-b border-r border-slate-200 ${
                          has ? "text-slate-800" : "text-slate-300"
                        }`}
                      >
                        {fmtFeeder(row, f.id)}
                      </td>
                    ))}
                    <td
                      className={`px-1.5 py-1.5 text-center font-mono tabular-nums font-semibold border-b border-r border-slate-200 ${
                        has
                          ? "text-teal-800 bg-teal-50/80"
                          : "text-slate-300 bg-teal-50/40"
                      }`}
                    >
                      {fmtBottail(row)}
                    </td>
                    <td
                      className={`px-1.5 py-1.5 text-center font-mono tabular-nums border-b border-r border-slate-200 ${
                        has
                          ? "text-violet-900 bg-violet-50/70"
                          : "text-slate-300 bg-violet-50/30"
                      }`}
                    >
                      {has ? formatKv(row.bus2) : "—"}
                    </td>
                    <td
                      className={`px-1.5 py-1.5 text-center font-mono tabular-nums border-b border-slate-200 ${
                        has
                          ? "text-sky-900 bg-sky-50/70"
                          : "text-slate-300 bg-sky-50/30"
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
                        colSpan={3 + FEEDERS.length + 3}
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
                    colSpan={2}
                    className="px-1 py-1.5 text-center font-bold border-t-2 border-slate-500 border-r border-slate-600"
                    style={{
                      position: "sticky",
                      left: 0,
                      zIndex: 40,
                      backgroundColor: "#334155",
                      width: SN_W + TIME_W,
                      minWidth: SN_W + TIME_W,
                      boxShadow: "2px 0 4px -2px rgba(0,0,0,0.2)",
                    }}
                  >
                    Day max · {formatDayLabel(selectedDay)}
                  </td>
                  <td className="px-1 py-1 text-center font-semibold border-t-2 border-slate-500 border-r border-slate-600 bg-emerald-800">
                    Total
                  </td>
                  {FEEDERS.map((f) => (
                    <td
                      key={f.id}
                      className="px-1 py-1 text-center font-semibold border-t-2 border-slate-500 border-r border-slate-600 bg-slate-700"
                    >
                      {f.name}
                    </td>
                  ))}
                  <td className="px-1 py-1 text-center font-semibold border-t-2 border-slate-500 border-r border-slate-600 bg-teal-800">
                    B11
                  </td>
                  <td className="px-1 py-1 text-center font-semibold border-t-2 border-slate-500 border-r border-slate-600 bg-violet-800">
                    Bus2
                  </td>
                  <td className="px-1 py-1 text-center font-semibold border-t-2 border-slate-500 bg-sky-800">
                    Bus1
                  </td>
                </tr>
                <tr className="text-[11px] bg-amber-50">
                  <td
                    className="px-1 py-1.5 text-center font-bold text-slate-700 border-b border-r border-slate-300"
                    style={{
                      ...stickySn,
                      backgroundColor: "#fffbeb",
                      zIndex: 40,
                    }}
                  >
                    Max
                  </td>
                  <td
                    className="px-1 py-1.5 text-center text-slate-400 border-b border-r border-slate-300"
                    style={{
                      ...stickyTime,
                      backgroundColor: "#fffbeb",
                      zIndex: 40,
                    }}
                  >
                    —
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
                    return (
                      <td
                        key={f.id}
                        className="px-1 py-1.5 text-center font-mono font-bold text-slate-900 border-b border-r border-slate-300 bg-amber-50"
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
                      ...stickySn,
                      backgroundColor: "#fef3c7",
                      zIndex: 40,
                    }}
                  >
                    At
                  </td>
                  <td
                    className="px-1 py-1 text-center text-slate-400 border-r border-slate-300"
                    style={{
                      ...stickyTime,
                      backgroundColor: "#fef3c7",
                      zIndex: 40,
                    }}
                  >
                    —
                  </td>
                  <td className="px-1 py-1 text-center font-mono text-emerald-800 border-r border-slate-300 bg-emerald-50">
                    {columnMaxes.total?.slot || "—"}
                  </td>
                  {FEEDERS.map((f) => (
                    <td
                      key={f.id}
                      className="px-1 py-1 text-center font-mono text-slate-600 border-r border-slate-300"
                    >
                      {columnMaxes.feeders[f.id]?.slot || "—"}
                    </td>
                  ))}
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
