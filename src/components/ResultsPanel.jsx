"use client";

export default function ResultsPanel({ calculate, bottail11kV, totalMW }) {
  const bottail = calculate ? bottail11kV.toFixed(2) : "0.00";
  const total = calculate ? totalMW.toFixed(2) : "0.00";

  return (
    <section className="px-2 md:px-4 pb-2.5 grid grid-cols-2 gap-2 md:gap-3">
      <div className="bg-gradient-to-br from-slate-700 to-slate-800 text-white rounded-xl h-11 md:h-14 flex items-center justify-between px-2.5 md:px-4 shadow-md border border-slate-600/50">
        <span className="text-[10px] md:text-xs font-bold tracking-wide uppercase opacity-90">
          Bottail 11kV
        </span>
        <span className="text-sm md:text-xl font-black font-mono tracking-tight text-emerald-400">
          {bottail}{" "}
          <span className="text-[10px] md:text-xs font-bold opacity-80">MW</span>
        </span>
      </div>

      <div className="bg-gradient-to-br from-emerald-700 to-emerald-800 text-white rounded-xl h-11 md:h-14 flex items-center justify-between px-2.5 md:px-4 shadow-md border border-emerald-600/50">
        <span className="text-[10px] md:text-xs font-bold tracking-wide uppercase opacity-90">
          Total
        </span>
        <span className="text-sm md:text-xl font-black font-mono tracking-tight text-teal-300">
          {total}{" "}
          <span className="text-[10px] md:text-xs font-bold opacity-80">MW</span>
        </span>
      </div>
    </section>
  );
}