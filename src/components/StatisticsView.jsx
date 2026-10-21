"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import { fetchCalculations } from "@/lib/api";
import { FEEDERS } from "@/lib/constants";
import Link from "next/link";

function formatMW(v) {
  if (v == null || !Number.isFinite(Number(v))) return "—";
  return Number(v).toFixed(2);
}

function splitDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function shortTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

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
  borderRadius: 8,
  fontSize: 12,
  color: "#e2e8f0",
};

export default function StatisticsView() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [records, setRecords] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchCalculations({ limit: 200 });
      setRecords(res.data || []);
    } catch (err) {
      setError(err?.message || "Failed to load statistics");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    if (!records.length) {
      return {
        count: 0,
        avgTotal: 0,
        maxTotal: 0,
        maxTotalAt: null,
        minTotal: 0,
        feederAvg: {},
        trend: [],
        feederBars: [],
      };
    }

    let sum = 0;
    let maxTotal = -Infinity;
    let minTotal = Infinity;
    let maxTotalAt = null;
    const feederSums = {};
    const feederCounts = {};

    // chronological for trend (oldest → newest)
    const sorted = [...records].sort((a, b) => {
      const ta = new Date(a.calculatedAt || a.createdAt).getTime();
      const tb = new Date(b.calculatedAt || b.createdAt).getTime();
      return ta - tb;
    });

    const trend = sorted.map((r) => ({
      label: shortTime(r.calculatedAt || r.createdAt),
      totalMW: Number(r.totalMW) || 0,
      bottail11: Number(r.bottail11kV) || 0,
    }));

    for (const r of records) {
      const t = Number(r.totalMW) || 0;
      sum += t;
      if (t > maxTotal) {
        maxTotal = t;
        maxTotalAt = r.calculatedAt || r.createdAt;
      }
      if (t < minTotal) minTotal = t;

      for (const f of r.feeders || []) {
        const id = f.id;
        feederSums[id] = (feederSums[id] || 0) + (Number(f.mw) || 0);
        feederCounts[id] = (feederCounts[id] || 0) + 1;
      }
    }

    const feederAvg = {};
    const feederBars = FEEDERS.map((f, i) => {
      const c = feederCounts[f.id] || 0;
      const avg = c ? feederSums[f.id] / c : 0;
      feederAvg[f.id] = avg;
      return {
        name: f.name,
        avgMW: Number(avg.toFixed(3)),
        bus: f.bus,
        fill: FEEDER_COLORS[i % FEEDER_COLORS.length],
      };
    });

    return {
      count: records.length,
      avgTotal: sum / records.length,
      maxTotal: maxTotal === -Infinity ? 0 : maxTotal,
      maxTotalAt,
      minTotal: minTotal === Infinity ? 0 : minTotal,
      feederAvg,
      trend,
      feederBars,
    };
  }, [records]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <p className="text-sm text-slate-400">
          Up to 200 recent saved calculations
        </p>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="px-4 py-2 rounded-lg text-[13px] font-semibold bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 hover:text-white disabled:opacity-50 transition-colors"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-24">
          <div className="w-9 h-9 rounded-full border-2 border-emerald-500/80 border-t-transparent animate-spin" />
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-8 text-center">
          <p className="text-red-300 text-sm font-medium">{error}</p>
          <button
            type="button"
            onClick={load}
            className="mt-4 px-4 py-2 rounded-lg bg-slate-800 text-white text-[13px] font-semibold border border-slate-700"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && stats.count === 0 && (
        <div className="rounded-xl border border-slate-700/80 bg-slate-800/40 p-12 text-center">
          <p className="text-slate-200 font-semibold">No data available</p>
          <p className="text-slate-400 text-sm mt-2 max-w-sm mx-auto">
            Save load readings from the calculator to populate statistics.
          </p>
          <Link
            href="/calculator"
            className="inline-block mt-6 px-5 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500"
          >
            Open Calculator
          </Link>
        </div>
      )}

      {!loading && !error && stats.count > 0 && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            {[
              { label: "Records", value: String(stats.count), unit: "" },
              {
                label: "Average total",
                value: formatMW(stats.avgTotal),
                unit: "MW",
              },
              {
                label: "Peak total",
                value: formatMW(stats.maxTotal),
                unit: "MW",
                sub: splitDate(stats.maxTotalAt),
              },
              {
                label: "Lowest total",
                value: formatMW(stats.minTotal),
                unit: "MW",
              },
            ].map((card) => (
              <div
                key={card.label}
                className="rounded-xl bg-slate-800/50 border border-slate-700/80 p-4 sm:p-5"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  {card.label}
                </p>
                <p className="mt-2 text-xl sm:text-2xl font-semibold text-white tabular-nums tracking-tight">
                  {card.value}
                  {card.unit && (
                    <span className="text-sm font-medium text-slate-400 ml-1.5">
                      {card.unit}
                    </span>
                  )}
                </p>
                {card.sub && (
                  <p className="text-[11px] text-slate-500 mt-1.5">{card.sub}</p>
                )}
              </div>
            ))}
          </div>

          {/* Station total trend */}
          <div className="rounded-xl bg-slate-800/40 border border-slate-700/80 p-4 sm:p-5 mb-6">
            <h2 className="text-sm font-semibold text-slate-100 mb-1">
              Station total MW over time
            </h2>
            <p className="text-[11px] text-slate-500 mb-4">
              Chronological total load from recent saves
            </p>
            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={stats.trend}
                  margin={{ top: 8, right: 12, left: 0, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                    interval="preserveStartEnd"
                    minTickGap={40}
                  />
                  <YAxis
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    width={48}
                    unit=" MW"
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v, name) => [
                      `${Number(v).toFixed(2)} MW`,
                      name === "totalMW" ? "Total" : "Bottail 11 kV",
                    ]}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 12, color: "#cbd5e1" }}
                    formatter={(v) =>
                      v === "totalMW" ? "Station total" : "Bottail 11 kV"
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="totalMW"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="bottail11"
                    stroke="#14b8a6"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Feeder average bar chart */}
          <div className="rounded-xl bg-slate-800/40 border border-slate-700/80 p-4 sm:p-5 mb-6">
            <h2 className="text-sm font-semibold text-slate-100 mb-1">
              Average load by feeder
            </h2>
            <p className="text-[11px] text-slate-500 mb-4">
              Mean MW across the loaded sample
            </p>
            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.feederBars}
                  margin={{ top: 8, right: 12, left: 0, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                  />
                  <YAxis
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    width={48}
                    unit=" MW"
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v) => [`${Number(v).toFixed(2)} MW`, "Avg"]}
                  />
                  <Bar dataKey="avgMW" radius={[6, 6, 0, 0]} maxBarSize={48}>
                    {stats.feederBars.map((entry, index) => (
                      <Cell key={`c-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl bg-slate-800/40 border border-slate-700/80 overflow-hidden">
            <div className="px-4 sm:px-5 py-3.5 border-b border-slate-700/80 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-100">
                Feeder averages (table)
              </h2>
              <span className="text-[11px] text-slate-500 font-medium">MW</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-700/60">
                    <th className="px-4 sm:px-5 py-2.5 font-semibold">Feeder</th>
                    <th className="px-4 py-2.5 font-semibold text-center">Bus</th>
                    <th className="px-4 sm:px-5 py-2.5 font-semibold text-right">
                      Avg MW
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {FEEDERS.map((f, i) => (
                    <tr
                      key={f.id}
                      className={`border-b border-slate-800/80 text-sm ${
                        i % 2 === 0 ? "bg-slate-900/20" : ""
                      }`}
                    >
                      <td className="px-4 sm:px-5 py-3 font-medium text-slate-200">
                        {f.name}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex min-w-[1.5rem] justify-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            f.bus === 1
                              ? "bg-sky-950 text-sky-300 border border-sky-900"
                              : "bg-violet-950 text-violet-300 border border-violet-900"
                          }`}
                        >
                          {f.bus}
                        </span>
                      </td>
                      <td className="px-4 sm:px-5 py-3 text-right font-mono font-semibold text-emerald-400/95 tabular-nums">
                        {formatMW(stats.feederAvg[f.id])}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
