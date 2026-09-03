"use client";

import { FEEDERS } from "@/lib/constants";

export default function FeederTable({
  amps,
  getDisplayMW,
  onAmpChange,
  onAmpBlur,
  handleWheel,
  handleKeyDown,
  mode = "normal",
  loadShedPlan = null,
}) {
  const isLS = mode === "loadShed";
  const planMap = {};
  if (isLS && loadShedPlan?.feeders) {
    loadShedPlan.feeders.forEach((f) => {
      planMap[f.id] = f;
    });
  }

  return (
    <section
      className="calc-feeder-wrap bg-white"
      style={{
        paddingLeft: "var(--calc-section-px)",
        paddingRight: "var(--calc-section-px)",
        paddingTop: "calc(var(--calc-gap) * 0.75)",
        paddingBottom: "calc(var(--calc-gap) * 0.75)",
      }}
    >
      <div className="border border-slate-200 rounded-lg shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
        <div className="overflow-x-auto flex-1 min-h-0 flex flex-col">
          <table className="w-full table-fixed border-collapse calc-feeder-table min-w-[320px]">
            <thead className="bg-slate-100">
              <tr className="border-b border-slate-200">
                <th
                  className="text-center font-bold text-slate-700 tracking-wider uppercase border-r border-slate-200"
                  style={{
                    width: isLS ? "18%" : "33%",
                    paddingTop: "var(--calc-th-py)",
                    paddingBottom: "var(--calc-th-py)",
                    fontSize: "var(--calc-th-size)",
                  }}
                >
                  Load (A)
                </th>
                <th
                  className="text-center font-bold text-slate-700 tracking-wider uppercase border-r border-slate-200"
                  style={{
                    width: isLS ? "20%" : "34%",
                    paddingTop: "var(--calc-th-py)",
                    paddingBottom: "var(--calc-th-py)",
                    fontSize: "var(--calc-th-size)",
                  }}
                >
                  Feeder
                </th>
                <th
                  className="text-center font-bold text-slate-700 tracking-wider uppercase"
                  style={{
                    width: isLS ? "16%" : "33%",
                    paddingTop: "var(--calc-th-py)",
                    paddingBottom: "var(--calc-th-py)",
                    fontSize: "var(--calc-th-size)",
                  }}
                >
                  MW
                </th>
                {isLS && (
                  <>
                    <th
                      className="text-center font-bold text-orange-700 tracking-wider uppercase border-l border-slate-200 bg-orange-50/80"
                      style={{
                        width: "14%",
                        paddingTop: "var(--calc-th-py)",
                        paddingBottom: "var(--calc-th-py)",
                        fontSize: "var(--calc-th-size)",
                      }}
                    >
                      Shed %
                    </th>
                    <th
                      className="text-center font-bold text-emerald-800 tracking-wider uppercase border-l border-slate-200 bg-emerald-50/60"
                      style={{
                        width: "16%",
                        paddingTop: "var(--calc-th-py)",
                        paddingBottom: "var(--calc-th-py)",
                        fontSize: "var(--calc-th-size)",
                      }}
                    >
                      Target MW
                    </th>
                    <th
                      className="text-center font-bold text-teal-800 tracking-wider uppercase border-l border-slate-200 bg-teal-50/60"
                      style={{
                        width: "16%",
                        paddingTop: "var(--calc-th-py)",
                        paddingBottom: "var(--calc-th-py)",
                        fontSize: "var(--calc-th-size)",
                      }}
                    >
                      Target A
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {FEEDERS.map((item, index) => {
                const mw = getDisplayMW(item.id);
                const plan = planMap[item.id];
                const showPlan = isLS && plan && loadShedPlan?.valid;
                const isProtected = plan?.protected;

                return (
                  <tr
                    key={item.id}
                    className={`${
                      index % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                    } hover:bg-emerald-50/30 transition-colors ${
                      isProtected ? "opacity-75" : ""
                    }`}
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
                        style={{
                          fontSize: "var(--calc-row-text)",
                          height: "var(--calc-row-h)",
                          minHeight: "var(--calc-row-h)",
                        }}
                        aria-label={`${item.name} amps`}
                      />
                    </td>
                    <td
                      className="text-center font-bold text-slate-700 truncate px-0.5 border-r border-slate-200"
                      style={{ fontSize: "var(--calc-row-text)" }}
                    >
                      {item.name}
                      <span
                        className="ml-0.5 font-semibold text-slate-400"
                        style={{ fontSize: "calc(var(--calc-row-text) * 0.7)" }}
                      >
                        B{item.bus}
                      </span>
                      {isProtected && (
                        <span
                          className="ml-0.5 font-bold text-amber-600"
                          style={{ fontSize: "calc(var(--calc-row-text) * 0.65)" }}
                          title="Protected from load shed"
                        >
                          🛡
                        </span>
                      )}
                    </td>
                    <td
                      className="text-center font-black text-emerald-700 font-mono"
                      style={{ fontSize: "var(--calc-row-text)" }}
                    >
                      {mw !== null ? mw.toFixed(2) : "0.00"}
                    </td>
                    {isLS && (
                      <>
                        <td
                          className="text-center font-black font-mono border-l border-slate-200 bg-orange-50/40"
                          style={{
                            fontSize: "var(--calc-row-text)",
                            color: showPlan && plan.shedPercent > 0 ? "#c2410c" : "#94a3b8",
                          }}
                        >
                          {showPlan
                            ? isProtected
                              ? "—"
                              : `${plan.shedPercent.toFixed(1)}%`
                            : "—"}
                        </td>
                        <td
                          className="text-center font-black font-mono border-l border-slate-200 bg-emerald-50/40 text-emerald-800"
                          style={{ fontSize: "var(--calc-row-text)" }}
                        >
                          {showPlan ? plan.targetMW.toFixed(2) : "—"}
                        </td>
                        <td
                          className="text-center font-black font-mono border-l border-slate-200 bg-teal-50/40 text-teal-800"
                          style={{ fontSize: "var(--calc-row-text)" }}
                        >
                          {showPlan
                            ? isProtected
                              ? plan.amps.toFixed(0)
                              : Math.round(plan.targetAmps)
                            : "—"}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
