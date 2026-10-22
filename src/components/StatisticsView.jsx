"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import { fetchCalculations } from "@/lib/api";
import { FEEDERS, BOTTAIL_11KV_IDS } from "@/lib/constants";
import Link from "next/link";

function formatMW(v) {
  if (v == null || !Number.isFinite(Number(v))) return "—";
  return (Math.round((Number(v) + Number.EPSILON) * 10) / 10).toFixed(1);
}

function formatPct(v) {
  if (v == null || !Number.isFinite(Number(v))) return "—";
  return `${(Math.round((Number(v) + Number.EPSILON) * 10) / 10).toFixed(1)}%`;
}

function dayKey(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDayLabel(key) {
  if (!key) return "—";
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
}

function formatWhen(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function ymdOffset(daysAgo) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function todayYmd() {
  return ymdOffset(0);
}

function monthStartYmd() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

const RANGES = [
  { id: "7d", label: "7 days", from: () => ymdOffset(6), to: todayYmd },
  { id: "30d", label: "30 days", from: () => ymdOffset(29), to: todayYmd },
  { id: "month", label: "This month", from: monthStartYmd, to: todayYmd },
  { id: "all", label: "Recent (all)", from: () => null, to: () => null },
];

const FEEDER_COLORS = [
  "#10b981",
  "#0ea5e9",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
  "#14b8a6",
  "#6366f1",
  "#ec4899",
  "#84cc16",
];

const tooltipStyle = {
  backgroundColor: "#0f172a",
  border: "1px solid #334155",
  borderRadius: 10,
  fontSize: 12,
  color: "#e2e8f0",
};

/**
 * Prefer hourly logsheet samples for demand statistics.
 * Falls back to all positive totals if no hourly data exists.
 */
function isHourlySample(r) {
  return (
    r.isHourly === true ||
    (typeof r.hourSlot === "string" && r.hourSlot.trim().length > 0)
  );
}

function totalOf(r) {
  return Number(r.totalMW) || 0;
}

function bottailOf(r) {
  if (r.bottail11kV != null && Number.isFinite(Number(r.bottail11kV))) {
    return Number(r.bottail11kV);
  }
  return (r.feeders || [])
    .filter((f) => BOTTAIL_11KV_IDS.includes(f.id))
    .reduce((s, f) => s + (Number(f.mw) || 0), 0);
}

function hasRing(r) {
  if (r.hasActiveRing === true) return true;
  return (r.feeders || []).some((f) => f.ringActive === true);
}

export default function StatisticsView() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [records, setRecords] = useState([]);
  const [rangeId, setRangeId] = useState("30d");
  const [ringFilter, setRingFilter] = useState("all"); // all | with | without

  const range = RANGES.find((r) => r.id === rangeId) || RANGES[1];

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const from = range.from();
      const to = range.to();
      const opts = { limit: rangeId === "all" ? 500 : 400 };
      if (from) opts.from = from;
      if (to) opts.to = to;
      const res = await fetchCalculations(opts);
      setRecords(res.data || []);
    } catch (err) {
      setError(err?.message || "Failed to load statistics");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [range, rangeId]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    let pool = records.filter((r) => totalOf(r) > 0.001);
    if (ringFilter === "with") pool = pool.filter(hasRing);
    if (ringFilter === "without") pool = pool.filter((r) => !hasRing(r));

    const hourly = pool.filter(isHourlySample);
    // Use hourly for means when available; otherwise all positive samples
    const meanPool = hourly.length >= 3 ? hourly : pool;

    if (!pool.length) {
      return {
        empty: true,
        sampleCount: 0,
        hourlyCount: 0,
        uniqueDays: 0,
        ringCount: 0,
        peak: 0,
        peakAt: null,
        peakSlot: null,
        min: 0,
        minAt: null,
        mean: 0,
        loadFactor: null,
        bottailPeak: 0,
        bottailMean: 0,
        daily: [],
        feederBars: [],
        hourHist: [],
        meanSource: "none",
      };
    }

    let peak = -Infinity;
    let peakAt = null;
    let peakSlot = null;
    let min = Infinity;
    let minAt = null;
    let sum = 0;
    let bottailSum = 0;
    let bottailPeak = -Infinity;
    const feederSums = {};
    const feederCounts = {};
    const byDay = {};
    const hourHistMap = {};

    for (const r of pool) {
      const t = totalOf(r);
      const when = r.calculatedAt || r.createdAt;
      if (t > peak) {
        peak = t;
        peakAt = when;
        peakSlot = r.hourSlot || null;
      }
      if (t < min) {
        min = t;
        minAt = when;
      }
      const b = bottailOf(r);
      if (b > bottailPeak) bottailPeak = b;
      if (hasRing(r)) {
        /* counted below */
      }

      const dk = dayKey(when);
      if (dk) {
        if (!byDay[dk]) byDay[dk] = { peak: 0, sum: 0, n: 0 };
        byDay[dk].peak = Math.max(byDay[dk].peak, t);
        byDay[dk].sum += t;
        byDay[dk].n += 1;
      }

      const slot = r.hourSlot || "—";
      if (isHourlySample(r)) {
        hourHistMap[slot] = (hourHistMap[slot] || 0) + 1;
      }
    }

    for (const r of meanPool) {
      sum += totalOf(r);
      bottailSum += bottailOf(r);
      for (const f of r.feeders || []) {
        const id = f.id;
        feederSums[id] = (feederSums[id] || 0) + (Number(f.mw) || 0);
        feederCounts[id] = (feederCounts[id] || 0) + 1;
      }
    }

    const mean = meanPool.length ? sum / meanPool.length : 0;
    const bottailMean = meanPool.length ? bottailSum / meanPool.length : 0;
    const loadFactor = peak > 0 ? (mean / peak) * 100 : null;
    const ringCount = pool.filter(hasRing).length;

    const daily = Object.keys(byDay)
      .sort()
      .map((k) => ({
        day: k,
        label: formatDayLabel(k),
        peakMW: Number(byDay[k].peak.toFixed(2)),
        avgMW: Number((byDay[k].sum / byDay[k].n).toFixed(2)),
        samples: byDay[k].n,
      }));

    const feederBars = FEEDERS.map((f, i) => {
      const c = feederCounts[f.id] || 0;
      const avg = c ? feederSums[f.id] / c : 0;
      const share = mean > 0 ? (avg / mean) * 100 : 0;
      return {
        name: f.name,
        avgMW: Number(avg.toFixed(3)),
        share: Number(share.toFixed(1)),
        bus: f.bus,
        fill: FEEDER_COLORS[i % FEEDER_COLORS.length],
      };
    }).sort((a, b) => b.avgMW - a.avgMW);

    const hourHist = Object.entries(hourHistMap)
      .map(([slot, count]) => ({ slot, count }))
      .sort((a, b) => {
        const pa = a.slot.replace(":", "");
        const pb = b.slot.replace(":", "");
        return pa.localeCompare(pb);
      });

    return {
      empty: false,
      sampleCount: pool.length,
      hourlyCount: hourly.length,
      uniqueDays: Object.keys(byDay).length,
      ringCount,
      peak: peak === -Infinity ? 0 : peak,
      peakAt,
      peakSlot,
      min: min === Infinity ? 0 : min,
      minAt,
      mean,
      loadFactor,
      bottailPeak: bottailPeak === -Infinity ? 0 : bottailPeak,
      bottailMean,
      daily,
      feederBars,
      hourHist,
      meanSource: hourly.length >= 3 ? "hourly" : "all",
    };
  }, [records, ringFilter]);

  return (
    <div className="page-frame py-4 sm:py-6">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 sm:mb-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-500/90 mb-1">
              Operations analytics
            </p>
            <h1 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
              Station load statistics
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-xl leading-relaxed">
              Demand metrics use{" "}
              <span className="text-slate-300 font-medium">hourly logsheet samples</span> when
              available (mean demand, feeder share). Peak is the highest recorded total in range.
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="px-4 py-2 rounded-full text-[13px] font-semibold bg-slate-800 text-slate-200 border border-white/10 hover:bg-slate-700 hover:text-white disabled:opacity-50 transition-colors"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-0.5">
            {RANGES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRangeId(r.id)}
                className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${
                  rangeId === r.id
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/40"
                    : "text-slate-400 hover:text-slate-100"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <div className="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-0.5">
            {[
              { id: "all", label: "All samples" },
              { id: "without", label: "No ring" },
              { id: "with", label: "Ring only" },
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRingFilter(r.id)}
                className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${
                  ringFilter === r.id
                    ? r.id === "with"
                      ? "bg-amber-500 text-white"
                      : "bg-slate-600 text-white"
                    : "text-slate-400 hover:text-slate-100"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-24">
          <div className="w-9 h-9 rounded-full border-2 border-emerald-500/80 border-t-transparent animate-spin" />
        </div>
      )}

      {!loading && error && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-8 text-center">
          <p className="text-red-300 text-sm font-medium">{error}</p>
          <button
            type="button"
            onClick={load}
            className="mt-4 px-4 py-2 rounded-full bg-slate-800 text-white text-[13px] font-semibold border border-slate-700"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && stats.empty && (
        <div className="rounded-lg border border-white/[0.07] bg-slate-800/40 p-12 text-center">
          <p className="text-slate-200 font-semibold">No demand data in this range</p>
          <p className="text-slate-400 text-sm mt-2 max-w-sm mx-auto leading-relaxed">
            Save hourly readings from the calculator or manual entry to build station statistics.
          </p>
          <Link
            href="/calculator"
            className="inline-block mt-6 px-5 py-2.5 rounded-full bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500"
          >
            Open Calculator
          </Link>
        </div>
      )}

      {!loading && !error && !stats.empty && (
        <>
          {/* KPI grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
            <Kpi
              label="Peak demand"
              value={formatMW(stats.peak)}
              unit="MW"
              sub={
                stats.peakSlot
                  ? `${formatWhen(stats.peakAt)} · ${stats.peakSlot}`
                  : formatWhen(stats.peakAt)
              }
              accent
            />
            <Kpi
              label="Mean demand"
              value={formatMW(stats.mean)}
              unit="MW"
              sub={
                stats.meanSource === "hourly"
                  ? `Avg of ${stats.hourlyCount} hourly samples`
                  : `Avg of ${stats.sampleCount} samples (few hourly)`
              }
            />
            <Kpi
              label="Load factor"
              value={formatPct(stats.loadFactor)}
              unit=""
              sub="Mean ÷ peak · higher = flatter profile"
            />
            <Kpi
              label="Minimum"
              value={formatMW(stats.min)}
              unit="MW"
              sub={formatWhen(stats.minAt)}
            />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <Kpi label="H3+T3 peak" value={formatMW(stats.bottailPeak)} unit="MW" />
            <Kpi
              label="H3+T3 mean"
              value={formatMW(stats.bottailMean)}
              unit="MW"
              sub="Same sample set as mean demand"
            />
            <Kpi
              label="Coverage"
              value={String(stats.uniqueDays)}
              unit="days"
              sub={`${stats.sampleCount} samples · ${stats.hourlyCount} hourly`}
            />
            <Kpi
              label="Ring samples"
              value={String(stats.ringCount)}
              unit=""
              sub={`${stats.sampleCount ? Math.round((stats.ringCount / stats.sampleCount) * 100) : 0}% of filtered set`}
            />
          </div>

          {/* Daily peak & average */}
          <div className="rounded-lg bg-slate-800/40 border border-white/[0.07] p-4 sm:p-5 mb-6">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-slate-100 tracking-tight">
                Daily peak and average demand
              </h2>
              <p className="text-[12px] text-slate-500 mt-0.5">
                Each day: peak = highest reading · avg = mean of that day&apos;s readings
              </p>
            </div>
            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={stats.daily}
                  margin={{ top: 8, right: 12, left: 0, bottom: 8 }}
                >
                  <defs>
                    <linearGradient id="peakFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="avgFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                    interval="preserveStartEnd"
                    minTickGap={28}
                  />
                  <YAxis
                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                    width={42}
                    unit=" MW"
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v, name) => [
                      `${formatMW(v)} MW`,
                      name === "peakMW" ? "Day peak" : "Day average",
                    ]}
                    labelFormatter={(_, payload) => {
                      const p = payload?.[0]?.payload;
                      return p
                        ? `${p.day} · ${p.samples} sample${p.samples === 1 ? "" : "s"}`
                        : "";
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 12, color: "#94a3b8" }}
                    formatter={(v) =>
                      v === "peakMW" ? "Day peak" : "Day average"
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="peakMW"
                    stroke="#10b981"
                    fill="url(#peakFill)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="avgMW"
                    stroke="#38bdf8"
                    fill="url(#avgFill)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
            {/* Feeder share */}
            <div className="lg:col-span-3 rounded-lg bg-slate-800/40 border border-white/[0.07] p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-slate-100 tracking-tight">
                Feeder mean demand
              </h2>
              <p className="text-[12px] text-slate-500 mt-0.5 mb-4">
                Average MW per feeder over the mean sample set · sorted by contribution
              </p>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.feederBars}
                    layout="vertical"
                    margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fill: "#94a3b8", fontSize: 10 }}
                      unit=" MW"
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={72}
                      tick={{ fill: "#cbd5e1", fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v, name, props) => {
                        if (name === "avgMW") {
                          return [
                            `${formatMW(v)} MW (${props.payload.share}% of station mean)`,
                            "Mean",
                          ];
                        }
                        return [v, name];
                      }}
                    />
                    <Bar dataKey="avgMW" radius={[0, 6, 6, 0]} maxBarSize={22}>
                      {stats.feederBars.map((entry, i) => (
                        <Cell key={entry.name} fill={entry.fill || FEEDER_COLORS[i % 9]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Feeder table */}
            <div className="lg:col-span-2 rounded-lg bg-slate-800/40 border border-white/[0.07] p-4 sm:p-5 overflow-hidden">
              <h2 className="text-sm font-semibold text-slate-100 tracking-tight mb-3">
                Contribution share
              </h2>
              <div className="overflow-auto max-h-80">
                <table className="w-full text-left text-[12px]">
                  <thead>
                    <tr className="text-slate-500 border-b border-white/10">
                      <th className="py-2 font-semibold">Feeder</th>
                      <th className="py-2 font-semibold text-right">Mean MW</th>
                      <th className="py-2 font-semibold text-right">Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {stats.feederBars.map((f) => (
                      <tr key={f.name} className="text-slate-200">
                        <td className="py-2 font-medium">
                          <span
                            className="inline-block w-1.5 h-1.5 rounded-full mr-2 align-middle"
                            style={{ background: f.fill }}
                          />
                          {f.name}
                          <span className="text-slate-500 ml-1">B{f.bus}</span>
                        </td>
                        <td className="py-2 text-right font-mono tabular-nums">
                          {formatMW(f.avgMW)}
                        </td>
                        <td className="py-2 text-right font-mono tabular-nums text-slate-400">
                          {f.share.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Hour-of-day coverage */}
          {stats.hourHist.length > 0 && (
            <div className="rounded-lg bg-slate-800/40 border border-white/[0.07] p-4 sm:p-5 mb-6">
              <h2 className="text-sm font-semibold text-slate-100 tracking-tight">
                Hourly slot coverage
              </h2>
              <p className="text-[12px] text-slate-500 mt-0.5 mb-4">
                Number of saved readings per logsheet hour in the selected range
              </p>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.hourHist} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="slot"
                      tick={{ fill: "#94a3b8", fontSize: 9 }}
                      interval={0}
                      angle={-35}
                      textAnchor="end"
                      height={48}
                    />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} width={28} allowDecimals={false} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v) => [v, "Readings"]}
                    />
                    <Bar dataKey="count" fill="#64748b" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <p className="text-[11px] text-slate-500 leading-relaxed max-w-3xl">
            <span className="font-semibold text-slate-400">Method:</span> Peak / minimum use all
            positive totals in range. Mean demand and feeder means prefer hourly logsheet rows
            (≥3 samples); otherwise all positive samples are used. Load factor = mean ÷ peak.
            Ring filter applies to the whole set before aggregation.
          </p>
        </>
      )}
    </div>
  );
}

function Kpi({ label, value, unit, sub, accent }) {
  return (
    <div
      className={`rounded-lg border p-4 sm:p-5 ${
        accent
          ? "bg-gradient-to-br from-emerald-950/80 to-slate-900/80 border-emerald-500/25"
          : "bg-slate-800/40 border-white/[0.07]"
      }`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-xl sm:text-2xl font-semibold text-white tabular-nums tracking-tight">
        {value}
        {unit ? (
          <span className="text-sm font-medium text-slate-400 ml-1.5">{unit}</span>
        ) : null}
      </p>
      {sub ? <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">{sub}</p> : null}
    </div>
  );
}
