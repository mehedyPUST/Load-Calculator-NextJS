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
    <section
      className="calc-feeder-wrap bg-white"
      style={{ paddingLeft: "var(--calc-section-px)", paddingRight: "var(--calc-section-px)", paddingTop: "calc(var(--calc-gap) * 0.75)", paddingBottom: "calc(var(--calc-gap) * 0.75)" }}
    >
      <div className="border border-slate-200 rounded-lg shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
        <table className="w-full table-fixed border-collapse calc-feeder-table">
          <thead className="bg-slate-100">
            <tr className="border-b border-slate-200">
              <th
                className="w-[33%] text-center font-bold text-slate-700 tracking-wider uppercase"
                style={{ paddingTop: "var(--calc-th-py)", paddingBottom: "var(--calc-th-py)", fontSize: "var(--calc-th-size)" }}
              >
                Load (A)
              </th>
              <th
                className="w-[34%] text-center font-bold text-slate-700 tracking-wider uppercase border-x border-slate-200"
                style={{ paddingTop: "var(--calc-th-py)", paddingBottom: "var(--calc-th-py)", fontSize: "var(--calc-th-size)" }}
              >
                Feeder
              </th>
              <th
                className="w-[33%] text-center font-bold text-slate-700 tracking-wider uppercase"
                style={{ paddingTop: "var(--calc-th-py)", paddingBottom: "var(--calc-th-py)", fontSize: "var(--calc-th-size)" }}
              >
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
                  className={`${index % 2 === 0 ? "bg-white" : "bg-slate-50/60"} hover:bg-emerald-50/30 transition-colors`}
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
                      className="w-full bg-transparent text-center font-bold text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/30 font-mono transition-all"
                      style={{ fontSize: "var(--calc-row-text)", height: "var(--calc-row-h)", minHeight: "var(--calc-row-h)" }}
                      aria-label={`${item.name} amps`}
                    />
                  </td>
                  <td
                    className="text-center font-bold text-slate-700 truncate px-1 border-r border-slate-200"
                    style={{ fontSize: "var(--calc-row-text)" }}
                  >
                    {item.name}
                    <span className="ml-0.5 font-semibold text-slate-400" style={{ fontSize: "calc(var(--calc-row-text) * 0.7)" }}>
                      B{item.bus}
                    </span>
                  </td>
                  <td
                    className="text-center font-black text-emerald-700 font-mono"
                    style={{ fontSize: "var(--calc-row-text)" }}
                  >
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
