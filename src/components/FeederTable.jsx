"use client";

import { FEEDERS } from "@/lib/constants";

export default function FeederTable({
  amps,
  getDisplayMW,
  onAmpChange,
  onAmpBlur,
  handleWheel,
  handleKeyDown,
}) {
  return (
    <section className="px-2 md:px-4 py-2.5 bg-white">
      <div className="border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full table-fixed border-collapse">
          <thead className="bg-slate-100">
            <tr className="border-b border-slate-200">
              <th className="w-[33%] py-2 md:py-2.5 text-center font-bold text-slate-700 text-xs md:text-sm tracking-wider uppercase">
                Load (A)
              </th>
              <th className="w-[34%] py-2 md:py-2.5 text-center font-bold text-slate-700 text-xs md:text-sm tracking-wider uppercase border-x border-slate-200">
                Feeder
              </th>
              <th className="w-[33%] py-2 md:py-2.5 text-center font-bold text-slate-700 text-xs md:text-sm tracking-wider uppercase">
                Load (MW)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {FEEDERS.map((item, index) => {
              const mw = getDisplayMW(item.id);
              return (
                <tr
                  key={item.id}
                  className={`${index % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                    } hover:bg-emerald-50/30 transition-colors`}
                >
                  <td className="p-0 border-r border-slate-200">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={amps[item.id]}
                      onChange={(e) => onAmpChange(item.id, e.target.value)}
                      onBlur={() => onAmpBlur(item.id)}
                      onWheel={handleWheel}
                      onKeyDown={handleKeyDown}
                      className="w-full h-8 md:h-9 bg-transparent text-center text-sm md:text-base font-bold text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/30 font-mono transition-all"
                      aria-label={`${item.name} amps`}
                    />
                  </td>
                  <td className="text-center font-bold text-slate-700 py-1 truncate px-1 md:px-3 border-r border-slate-200 text-sm md:text-base">
                    {item.name}
                    <span className="ml-1 text-[9px] md:text-[10px] font-semibold text-slate-400">
                      B{item.bus}
                    </span>
                  </td>
                  <td className="text-center font-black text-emerald-700 py-1 font-mono text-sm md:text-base">
                    {mw !== null ? mw.toFixed(2) : "0.00"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}