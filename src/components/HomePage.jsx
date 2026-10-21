"use client";

import Link from "next/link";
import { APP_META, FEEDERS } from "@/lib/constants";

const FEATURES = [
  {
    href: "/calculator",
    title: "Load Calculator",
    desc: "Compute feeder MW from bus voltages and amperes. Save readings with hourly time slots.",
    step: "01",
  },
  {
    href: "/history",
    title: "History",
    desc: "Search and manage saved calculations. Soft-delete, restore, and export records.",
    step: "02",
  },
  {
    href: "/max-load",
    title: "Max Load",
    desc: "Top five monthly peaks per feeder, prioritising hourly and special-slot saves.",
    step: "03",
  },
  {
    href: "/statistics",
    title: "Statistics",
    desc: "Aggregate averages, station peak total, and per-feeder mean load from recent data.",
    step: "04",
  },
];

export default function HomePage() {
  return (
    <div className="w-full">
      {/* Hero */}
      <section className="relative border-b border-slate-800 bg-gradient-to-b from-[#0f172a] via-[#0f1f2e] to-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(16,185,129,0.15),transparent)]" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-18 md:py-22">
          <div className="flex flex-col lg:flex-row lg:items-center gap-10 lg:gap-16">
            <div className="flex-1 min-w-0">
              <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-400/90 mb-4">
                <span className="w-8 h-px bg-emerald-500/60" />
                West Zone Power Distribution Co. Ltd.
              </p>
              <h1 className="text-3xl sm:text-4xl md:text-[2.75rem] font-semibold text-white tracking-tight leading-[1.15]">
                Bottail–Kushtia
                <span className="block text-slate-300 font-normal mt-1 text-[0.85em]">
                  33/11 kV Substation
                </span>
              </h1>
              <p className="mt-5 text-[15px] text-slate-400 max-w-xl leading-relaxed">
                Operational dashboard for SBA-Bottail: load calculation, hourly
                records, monthly peak analysis, and station statistics in one
                secure workspace.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/calculator"
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 shadow-md shadow-emerald-900/30 transition-colors"
                >
                  Open Calculator
                </Link>
                <Link
                  href="/max-load"
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-slate-600 text-slate-200 text-sm font-medium hover:bg-slate-800/80 hover:border-slate-500 transition-colors"
                >
                  Max Load Report
                </Link>
              </div>
            </div>

            <div className="flex-shrink-0 flex justify-center lg:justify-end">
              <div className="relative">
                <div className="absolute -inset-3 rounded-full bg-emerald-500/10 blur-xl" />
                <img
                  src={APP_META.logoUrl}
                  alt="WZPDCL Logo"
                  className="relative w-32 h-32 sm:w-40 sm:h-40 object-contain bg-white rounded-full p-3 shadow-2xl ring-1 ring-slate-600/40"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
            System modules
          </h2>
          <p className="text-sm text-slate-400 mt-1.5 max-w-2xl">
            Use the navigation bar or select a module below. Sign in is required
            to save calculations to the database.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className="group flex flex-col rounded-xl bg-slate-800/40 border border-slate-700/70 p-5 hover:border-emerald-600/50 hover:bg-slate-800/70 transition-all duration-200"
            >
              <span className="text-[11px] font-semibold text-emerald-500/80 tracking-wider mb-3">
                {f.step}
              </span>
              <h3 className="text-[15px] font-semibold text-slate-100 group-hover:text-emerald-300 transition-colors">
                {f.title}
              </h3>
              <p className="mt-2 text-[13px] text-slate-400 leading-relaxed flex-1">
                {f.desc}
              </p>
              <span className="mt-4 text-[12px] font-medium text-emerald-500/90 group-hover:text-emerald-400">
                Open →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Feeders */}
      <section className="border-t border-slate-800 bg-slate-900/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 mb-4">
            Feeders · Bottail SS
          </h2>
          <div className="flex flex-wrap gap-2">
            {FEEDERS.map((f) => (
              <span
                key={f.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80 text-[13px] font-medium text-slate-200"
              >
                {f.name}
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                    f.bus === 1
                      ? "bg-sky-950 text-sky-300 border border-sky-800/50"
                      : "bg-violet-950 text-violet-300 border border-violet-800/50"
                  }`}
                >
                  BUS-{f.bus}
                </span>
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
