"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { fetchMaxLoad } from "@/lib/api";
import { FEEDERS } from "@/lib/constants";
import { getNearestHourSlot } from "@/lib/hourSlot";
import StationHeader from "./StationHeader";
import AppFooter from "./AppFooter";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const RANGE_OPTIONS = [
  { id: "today", label: "Today" },
  { id: "last7days", label: "Last 7 days" },
  { id: "lastweek", label: "Last week" },
  { id: "monthly", label: "Monthly" },
  { id: "yearly", label: "Yearly" },
  { id: "alltime", label: "All time" },
];

function splitDateTime(iso) {
  if (!iso) return { date: "—", time: "—" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "—", time: "—" };
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

function formatMW(v) {
  if (v == null || !Number.isFinite(Number(v))) return "—";
  const r = Math.round((Number(v) + Number.EPSILON) * 10) / 10;
  return r.toFixed(1);
}

function formatAmps(v) {
  if (v == null || !Number.isFinite(Number(v))) return "—";
  return String(Math.round(Number(v)));
}

function RefreshIcon({ className = "w-3.5 h-3.5" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

/** Excel-style groups: SN + Feeder span rows; each peak is a sub-row */
function buildGroups(feederData, bottail11Peaks) {
  const groups = [];
  let sn = 1;

  for (const f of FEEDERS) {
    const hit = feederData.find((r) => r.feederId === f.id);
    const peaksRaw =
      hit?.peaks?.length
        ? hit.peaks
        : hit?.maxMW != null
          ? [{ maxMW: hit.maxMW, maxLoadAt: hit.maxLoadAt, ampsAtMax: hit.ampsAtMax, hourSlot: hit.hourSlot }]
          : [];

    const peaks = peaksRaw.map((p) => {
      const { date, time } = splitDateTime(p.maxLoadAt);
      let slot = (p.hourSlot && String(p.hourSlot).trim()) || "";
      if (!slot && p.maxLoadAt) {
        const d = new Date(p.maxLoadAt);
        if (!Number.isNaN(d.getTime())) slot = getNearestHourSlot(d).label;
      }
      return {
        amps: p.ampsAtMax,
        mw: p.maxMW,
        slot: slot || "—",
        time,
        date,
      };
    });

    groups.push({
      sn: sn++,
      name: f.name,
      isBottail: false,
      peaks: peaks.length > 0 ? peaks : [{ amps: null, mw: null, slot: "—", time: "—", date: "—" }],
    });
  }

  const bRaw = Array.isArray(bottail11Peaks) ? bottail11Peaks : [];
  const bPeaks = bRaw.map((p) => {
    const { date, time } = splitDateTime(p.maxLoadAt);
    let slot = (p.hourSlot && String(p.hourSlot).trim()) || "";
    if (!slot && p.maxLoadAt) {
      const d = new Date(p.maxLoadAt);
      if (!Number.isNaN(d.getTime())) slot = getNearestHourSlot(d).label;
    }
    return { amps: p.ampsAtMax, mw: p.maxMW, slot: slot || "—", time, date };
  });

  groups.push({
    sn: sn++,
    name: "Bottail 11 kV",
    isBottail: true,
    peaks: bPeaks.length > 0 ? bPeaks : [{ amps: null, mw: null, slot: "—", time: "—", date: "—" }],
  });

  return groups;
}

export default function MaxLoadView() {
  const [range, setRange] = useState("monthly");
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(1);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);
  const [bottail11Peaks, setBottail11Peaks] = useState([]);
  const [sampleCount, setSampleCount] = useState(0);
  const [totalPeak, setTotalPeak] = useState(null);
  const [hourlyOnly, setHourlyOnly] = useState(false);
  const [periodLabel, setPeriodLabel] = useState("");

  useEffect(() => {
    const n = new Date();
    setYear(n.getFullYear());
    setMonth(n.getMonth() + 1);
    setReady(true);
  }, []);

  const load = useCallback(async () => {
    if (!ready) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchMaxLoad({ range, year, month });
      setRows(res.data || []);
      setBottail11Peaks(res.bottail11Peaks || []);
      setSampleCount(res.sampleCount ?? 0);
      setTotalPeak(res.totalPeak || null);
      setHourlyOnly(res.hourlyOnly === true);
      setPeriodLabel(res.label || "");
    } catch (err) {
      const msg = err?.message || "Failed to load max load data";
      setError(msg);
      setRows([]);
      setBottail11Peaks([]);
      setSampleCount(0);
      setTotalPeak(null);
      setHourlyOnly(false);
      setPeriodLabel("");
      toast.error(msg, { style: { fontWeight: "bold" } });
    } finally {
      setLoading(false);
    }
  }, [range, year, month, ready]);

  useEffect(() => {
    if (ready) load();
  }, [load, ready]);

  const groups = useMemo(() => buildGroups(rows, bottail11Peaks), [rows, bottail11Peaks]);

  const yearOptions = useMemo(() => {
    const y = new Date().getFullYear();
    const list = [];
    for (let i = y; i >= y - 8; i--) list.push(i);
    return list;
  }, []);

  const peakDt = totalPeak?.maxTotalAt ? splitDateTime(totalPeak.maxTotalAt) : null;

  const selectClass =
    "appearance-none text-xs font-semibold bg-white text-slate-800 border border-slate-200 rounded-lg px-2.5 py-1.5 pr-7 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer";

  const showMonth = range === "monthly";
  const showYear = range === "monthly" || range === "yearly";

  return (
    <div className="calc-shell w-full max-w-2xl h-full bg-white rounded-none md:rounded-xl shadow-xl shadow-black/40 overflow-hidden flex flex-col border-0 md:border md:border-slate-700/50">
      <StationHeader tagline="Max Load Report" />

      <div
        className="flex-shrink-0 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200"
        style={{
          paddingLeft: "var(--calc-section-px)",
          paddingRight: "var(--calc-section-px)",
          paddingTop: "0.5rem",
          paddingBottom: "0.5rem",
        }}
      >
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="min-w-0">
            <p className="font-bold text-slate-800 tracking-wide uppercase leading-tight" style={{ fontSize: "var(--calc-sub)" }}>
              Peak load sheet
            </p>
            <p className="text-slate-500 leading-tight mt-0.5" style={{ fontSize: "var(--calc-tag)" }}>
              {periodLabel || "—"}
              {sampleCount > 0 ? ` · ${sampleCount} records` : ""}
              {hourlyOnly ? " · hourly slots" : ""}
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
            <div className="relative">
              <select
                value={range}
                onChange={(e) => setRange(e.target.value)}
                className={selectClass}
                aria-label="Period"
              >
                {RANGE_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">▾</span>
            </div>
            {showMonth && (
              <div className="relative">
                <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className={selectClass} aria-label="Month">
                  {MONTH_NAMES.map((name, i) => (
                    <option key={name} value={i + 1}>{MONTH_SHORT[i]}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">▾</span>
              </div>
            )}
            {showYear && (
              <div className="relative">
                <select value={year} onChange={(e) => setYear(Number(e.target.value))} className={selectClass} aria-label="Year">
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">▾</span>
              </div>
            )}
            <button type="button" onClick={load} disabled={loading || !ready} title="Refresh" aria-label="Refresh"
              className="inline-flex items-center justify-center h-[30px] min-w-[30px] px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm disabled:opacity-50">
              <RefreshIcon className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {totalPeak && !loading && !error && (
          <div className="mt-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-3 py-2 shadow-sm flex items-center justify-between gap-2">
            <div>
              <p className="uppercase tracking-wider opacity-80 font-semibold" style={{ fontSize: "var(--calc-tag)" }}>Station peak total</p>
              <p className="font-extrabold tabular-nums" style={{ fontSize: "var(--calc-title)" }}>
                {formatMW(totalPeak.maxTotalMW)} <span className="font-semibold opacity-90 text-[0.85em]">MW</span>
              </p>
            </div>
            {peakDt && (
              <div className="text-right">
                <p className="font-semibold" style={{ fontSize: "var(--calc-sub)" }}>{peakDt.date}</p>
                <p className="font-mono opacity-80" style={{ fontSize: "var(--calc-tag)" }}>{peakDt.time}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-auto">
        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-12 px-4">
            <p className="text-red-600 text-sm font-semibold">{error}</p>
            <button type="button" onClick={load} className="mt-3 text-xs font-semibold px-4 py-2 rounded-lg bg-slate-800 text-white">Retry</button>
          </div>
        )}

        {!loading && !error && sampleCount === 0 && (
          <div className="text-center py-14 px-4">
            <p className="text-slate-700 font-semibold text-sm">No data for {periodLabel || "this period"}</p>
            <p className="text-slate-400 text-xs mt-1">Save hourly readings from the calculator first.</p>
          </div>
        )}

        {!loading && !error && sampleCount > 0 && (
          <table className="w-full border-collapse text-left min-w-[560px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-100 border-b-2 border-slate-300 text-[10px] uppercase tracking-wide text-slate-600">
                <th className="px-2 py-2.5 font-bold text-center border border-slate-300 w-10">SN</th>
                <th className="px-2 py-2.5 font-bold text-center border border-slate-300 min-w-[5.5rem]">Feeder</th>
                <th className="px-2 py-2.5 font-bold text-center border border-slate-300">Max Amps</th>
                <th className="px-2 py-2.5 font-bold text-center border border-slate-300">Max MW</th>
                <th className="px-2 py-2.5 font-bold text-center border border-slate-300 bg-sky-50">Slot</th>
                <th className="px-2 py-2.5 font-bold text-center border border-slate-300">Time</th>
                <th className="px-2 py-2.5 font-bold text-center border border-slate-300">Date</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => {
                const span = g.peaks.length;
                const groupBg = g.isBottail ? "bg-teal-50/90" : "bg-white";
                let maxIdx = -1;
                let maxVal = -Infinity;
                g.peaks.forEach((p, i) => {
                  const v = Number(p.mw);
                  if (Number.isFinite(v) && v > maxVal) {
                    maxVal = v;
                    maxIdx = i;
                  }
                });
                return g.peaks.map((p, i) => {
                  const empty = p.mw == null && (p.slot === "—" || !p.slot);
                  const isTop = !empty && i === maxIdx && maxVal > 0;
                  const rowAlt = isTop
                    ? "bg-red-50"
                    : i % 2 === 1
                      ? g.isBottail ? "bg-teal-100/50" : "bg-slate-50"
                      : groupBg;
                  return (
                    <tr key={`${g.sn}-${i}`} className={`text-xs ${rowAlt}`}>
                      {i === 0 && (
                        <>
                          <td rowSpan={span} className={`px-2 py-1 text-center font-bold text-slate-700 border border-slate-300 align-middle ${groupBg}`}>
                            {g.sn}
                          </td>
                          <td rowSpan={span} className={`px-2 py-1 text-center font-semibold border border-slate-300 align-middle ${g.isBottail ? "text-teal-900" : "text-slate-800"} ${groupBg}`}>
                            {g.name}
                          </td>
                        </>
                      )}
                      <td className={`px-2 py-1.5 text-center font-mono tabular-nums border border-slate-200 ${empty ? "text-slate-300" : isTop ? "text-red-700 font-semibold" : "text-slate-800"}`}>
                        {empty ? "—" : formatAmps(p.amps)}
                      </td>
                      <td className={`px-2 py-1.5 text-center font-mono font-bold tabular-nums border border-slate-200 ${empty ? "text-slate-300" : isTop ? "text-red-600 bg-red-50" : g.isBottail ? "text-teal-700" : "text-emerald-700"}`}>
                        {empty ? "—" : formatMW(p.mw)}
                        {isTop ? " ★" : ""}
                      </td>
                      <td className={`px-2 py-1.5 text-center font-mono font-semibold border border-slate-200 ${empty ? "text-slate-300 bg-sky-50/40" : isTop ? "text-red-700 bg-red-50" : "text-sky-800 bg-sky-50/60"}`}>
                        {p.slot || "—"}
                      </td>
                      <td className={`px-2 py-1.5 text-center font-mono border border-slate-200 ${empty ? "text-slate-300" : isTop ? "text-red-700" : "text-slate-700"}`}>
                        {p.time}
                      </td>
                      <td className={`px-2 py-1.5 text-center border border-slate-200 whitespace-nowrap ${empty ? "text-slate-300" : isTop ? "text-red-700 font-medium" : "text-slate-600"}`}>
                        {p.date}
                      </td>
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex-shrink-0 px-3 py-1.5 border-t border-slate-200 bg-slate-50 text-[10px] text-slate-500 flex flex-wrap gap-x-4 gap-y-0.5">
        <span><strong className="text-slate-600">Slot</strong> = nearest hour</span>
        <span><strong className="text-red-600">★</strong> = highest peak for that feeder</span>
      </div>

      <AppFooter />
    </div>
  );
}
