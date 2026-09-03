"use client";

export default function ResultsPanel({ calculate, bottail11kV, totalMW }) {
  const bottail = calculate ? bottail11kV.toFixed(2) : "0.00";
  const total = calculate ? totalMW.toFixed(2) : "0.00";

  return (
    <section className="px-2 md:px-4 pb-1.5 md:pb-2 grid grid-cols-2 gap-1.5 md:gap-2">
      <div className="bg-gradient-to-br from-slate-700 to-slate-800 text-white rounded-lg md:rounded-xl h-8 md:h-10 flex items-center justify-between px-2 md:px-3 shadow-md border border-slate-600/50">
        <span className="text-[9px] md:text-[10px] font-bold tracking-wide uppercase opacity-90">
          Bottail 11kV
        </span>
        <span className="text-xs md:text-base font-black font-mono tracking-tight text-emerald-400">
          {bottail}{" "}
          <span className="text-[9px] md:text-[10px] font-bold opacity-80">MW</span>
        </span>
      </div>

      <div className="bg-gradient-to-br from-emerald-700 to-emerald-800 text-white rounded-lg md:rounded-xl h-8 md:h-10 flex items-center justify-between px-2 md:px-3 shadow-md border border-emerald-600/50">
        <span className="text-[9px] md:text-[10px] font-bold tracking-wide uppercase opacity-90">
          Total
        </span>
        <span className="text-xs md:text-base font-black font-mono tracking-tight text-teal-300">
          {total}{" "}
          <span className="text-[9px] md:text-[10px] font-bold opacity-80">MW</span>
        </span>
      </div>
    </section>
  );
}
