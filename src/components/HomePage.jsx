"use client";

import Link from "next/link";
import { FEEDERS } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";

const FEATURES = [
  {
    href: "/calculator",
    title: "Load Calculator",
    desc: "Compute feeder MW from bus voltages and amperes. Save readings with hourly time slots.",
    step: "01",
  },
  {
    href: "/manual",
    title: "Manual Entry",
    desc: "Fill empty hourly slots by date. Enter Amps or MW; the other is calculated automatically.",
    step: "02",
    authOnly: true,
  },
  {
    href: "/history",
    title: "History",
    desc: "Search and manage saved calculations. Soft-delete, restore, edit, and export records.",
    step: "03",
  },
  {
    href: "/max-load",
    title: "Max Load",
    desc: "Top five monthly peaks per feeder, prioritising hourly and special-slot saves.",
    step: "04",
  },
  {
    href: "/statistics",
    title: "Statistics",
    desc: "Aggregate averages, station peak total, and per-feeder mean load from recent data.",
    step: "05",
  },
];

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const modules = FEATURES.filter((f) => !f.authOnly || isAuthenticated);

  return (
    <div className="w-full">
      {/* Professional hero banner */}
      <section className="relative border-b border-slate-800">
        {/* Fixed-aspect media strip */}
        <div className="relative w-full h-[220px] sm:h-[280px] md:h-[340px] lg:h-[380px] overflow-hidden bg-slate-900">
          <img
            src="/hero-banner.jpg"
            alt="Bottail–Kushtia 33/11 kV Substation"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          {/* Soft left-to-right veil for text legibility */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.72) 38%, rgba(15,23,42,0.35) 68%, rgba(15,23,42,0.15) 100%)",
            }}
          />
          {/* Bottom fade into page */}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/70 to-transparent" />

          {/* Content overlaid on the image */}
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-6xl w-full mx-auto px-4 sm:px-6">
              <div className="max-w-xl">
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="h-px w-10 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400" />
                  <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-400/90">
                    West Zone Power Distribution Co. Ltd.
                  </p>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-[2.75rem] font-semibold text-white tracking-tight leading-[1.15]">
                  Bottail–Kushtia
                </h1>
                <p className="mt-1.5 text-sm sm:text-base text-slate-300/90 font-medium">
                  33/11 kV Substation · SBA-Bottail
                </p>
                <p className="mt-3 sm:mt-4 text-[13px] sm:text-[14px] text-slate-400/90 leading-relaxed max-w-md hidden sm:block">
                  Load calculation, hourly records, peak analysis, and station
                  statistics in one secure operational workspace.
                </p>
                <div className="mt-5 sm:mt-6 flex flex-wrap gap-2.5">
                  <Link
                    href="/calculator"
                    className="inline-flex items-center justify-center px-5 sm:px-6 py-2.5 rounded-full bg-emerald-600 text-white text-xs sm:text-sm font-semibold hover:bg-emerald-500 shadow-lg shadow-emerald-950/50 transition-all hover:shadow-emerald-600/25 hover:-translate-y-0.5"
                  >
                    Open Calculator
                  </Link>
                  <Link
                    href="/max-load"
                    className="inline-flex items-center justify-center px-5 sm:px-6 py-2.5 rounded-full border border-white/15 bg-white/[0.06] backdrop-blur-md text-slate-200 text-xs sm:text-sm font-medium hover:bg-white/[0.1] hover:border-white/25 transition-all"
                  >
                    Max Load Report
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Thin institutional accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500" />
      </section>

      {/* Modules */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-500/80 mb-2">
            Workspace
          </p>
          <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
            System modules
          </h2>
          <p className="text-sm text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
            Use the navigation bar or select a module below. Sign in is required
            to save calculations to the database.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className="group relative flex flex-col rounded-2xl bg-gradient-to-b from-slate-800/50 to-slate-900/40 border border-white/[0.07] p-5 sm:p-6 hover:border-emerald-500/40 hover:from-slate-800/70 hover:to-slate-900/60 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-950/20"
            >
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 text-[11px] font-bold text-emerald-400 tracking-wider mb-4 border border-emerald-500/20">
                {f.step}
              </span>
              <h3 className="text-[15px] font-semibold text-slate-50 group-hover:text-emerald-300 transition-colors tracking-tight">
                {f.title}
              </h3>
              <p className="mt-2 text-[13px] text-slate-400 leading-relaxed flex-1">
                {f.desc}
              </p>
              <span className="mt-5 text-[12px] font-semibold text-emerald-500/80 group-hover:text-emerald-400 inline-flex items-center gap-1.5 transition-colors">
                Open
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
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
