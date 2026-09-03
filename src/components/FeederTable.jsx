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
  currentLs = null,
  onCurrentLsChange = null,
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
      className={`calc-feeder-wrap ${isLS ? "bg-slate-50/80" : "bg-white"}`}
      style={{
        paddingLeft: "var(--calc-section-px)",
        paddingRight: "var(--calc-section-px)",
        paddingTop: "calc(var(--calc-gap) * 0.6)",
        paddingBottom: "calc(var(--calc-gap) * 0.6)",
      }}
    >
      <div
        className={`rounded-lg shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col border ${
          isLS ? "border-slate-300" : "border-slate-200"
        }`}
      >
        <div className="overflow-x-auto flex-1 min-h-0 flex flex-col">
          <table
            className="w-full border-collapse calc-feeder-table"
            style={{ minWidth: isLS ? "440px" : "280px" }}
          >
            <thead
              className={
                isLS ? "bg-slate-800 text-slate-100" : "bg-slate-100 text-slate-700"
              }
            >
              <tr
                className={
                  isLS ? "border-b border-slate-700" : "border-b border-slate-200"
                }
              >
                <th
                  className="text-center font-semibold tracking-wider uppercase border-r border-slate-600/40"
                  style={{
                    width: isLS ? "14%" : "33%",
                    paddingTop: "var(--calc-th-py)",
                    paddingBottom: "var(--calc-th-py)",
                    fontSize: "var(--calc-th-size)",
                  }}
                >
                  Amps
                </th>
                <th
                  className="text-center font-semibold tracking-wider uppercase border-r border-slate-600/40"
                  style={{
                    width: isLS ? "15%" : "34%",
                    paddingTop: "var(--calc-th-py)",
                    paddingBottom: "var(--calc-th-py)",
                    fontSize: "var(--calc-th-size)",
                  }}
                >
                  Feeder
                </th>
                <th
                  className="text-center font-semibold tracking-wider uppercase"
                  style={{
                    width: isLS ? "12%" : "33%",
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
                      className="text-center font-semibold tracking-wider uppercase border-l border-slate-600/40 bg-slate-700/80"
                      style={{
                        width: "15%",
                        paddingTop: "var(--calc-th-py)",
                        paddingBottom: "var(--calc-th-py)",
                        fontSize: "var(--calc-th-size)",
                      }}
                      title="Load shed already applied (MW)"
                    >
                      Cur LS
                    </th>
                    <th
                      className="text-center font-semibold tracking-wider uppercase border-l border-slate-600/40 bg-orange-900/40"
                      style={{
                        width: "15%",
                        paddingTop: "var(--calc-th-py)",
                        paddingBottom: "var(--calc-th-py)",
                        fontSize: "var(--calc-th-size)",
                      }}
                      title="Additional load shed required (MW)"
                    >
                      More LS
                    </th>
                    <th
                      className="text-center font-semibold tracking-wider uppercase border-l border-slate-600/40 bg-emerald-900/30"
                      style={{
                        width: "14%",
                        paddingTop: "var(--calc-th-py)",
                        paddingBottom: "var(--calc-th-py)",
                        fontSize: "var(--calc-th-size)",
                      }}
                    >
                      Target A
                    </th>
                    <th
                      className="text-center font-semibold tracking-wider uppercase border-l border-slate-600/40 bg-teal-900/30"
                      style={{
                        width: "15%",
                        paddingTop: "var(--calc-th-py)",
                        paddingBottom: "var(--calc-th-py)",
                        fontSize: "var(--calc-th-size)",
                      }}
                      title="Total LS = current + more (MW)"
                    >
                      Total LS
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
                      isProtected
                        ? "bg-slate-100/90"
                        : index % 2 === 0
                          ? "bg-white"
                          : isLS
                            ? "bg-slate-50/90"
                            : "bg-slate-50/60"
                    } transition-colors ${!isProtected ? "hover:bg-emerald-50/40" : ""}`}
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
                        style={{ fontSize: "calc(var(--calc-row-text) * 0.68)" }}
                      >
                        B{item.bus}
                      </span>
                      {isProtected && (
                        <span
                          className="ml-0.5 inline-block font-bold text-slate-500"
                          style={{ fontSize: "calc(var(--calc-row-text) * 0.62)" }}
                        >
                          FREE
                        </span>
                      )}
                    </td>
                    <td
                      className="text-center font-black text-emerald-700 font-mono"
                      style={{ fontSize: "var(--calc-row-text)" }}
                    >
                      {mw !== null ? mw.toFixed(2) : "—"}
                    </td>
                    {isLS && (
                      <>
                        <td className="p-0 border-l border-slate-200 bg-slate-50/80">
                          {isProtected ? (
                            <span
                              className="block text-center font-mono text-slate-400"
                              style={{
                                fontSize: "var(--calc-row-text)",
                                lineHeight: "var(--calc-row-h)",
                              }}
                            >
                              —
                            </span>
                          ) : (
                            <input
                              type="text"
                              inputMode="decimal"
                              value={currentLs?.[item.id] ?? "0"}
                              onChange={(e) =>
                                onCurrentLsChange?.(item.id, e.target.value)
                              }
                              onWheel={handleWheel}
                              onKeyDown={handleKeyDown}
                              className="w-full bg-transparent text-center font-bold text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/30 font-mono"
                              style={{
                                fontSize: "var(--calc-row-text)",
                                height: "var(--calc-row-h)",
                                minHeight: "var(--calc-row-h)",
                              }}
                              aria-label={`${item.name} current LS MW`}
                              title="Already applied LS (MW)"
                            />
                          )}
                        </td>
                        <td
                          className="text-center font-black font-mono border-l border-slate-200 bg-orange-50/50"
                          style={{
                            fontSize: "var(--calc-row-text)",
                            color:
                              showPlan && (plan.moreLsMW || 0) > 0.001
                                ? "#c2410c"
                                : "#94a3b8",
                          }}
                        >
                          {showPlan
                            ? isProtected
                              ? "—"
                              : plan.moreLsMW.toFixed(2)
                            : "—"}
                        </td>
                        <td
                          className="text-center font-black font-mono border-l border-slate-200 bg-emerald-50/50 text-teal-800"
                          style={{ fontSize: "var(--calc-row-text)" }}
                        >
                          {showPlan
                            ? isProtected
                              ? Math.round(plan.amps)
                              : Math.round(plan.targetAmps)
                            : "—"}
                        </td>
                        <td
                          className="text-center font-black font-mono border-l border-slate-200 bg-teal-50/40"
                          style={{
                            fontSize: "var(--calc-row-text)",
                            color:
                              showPlan && (plan.totalLsMW || 0) > 0.001
                                ? "#0f766e"
                                : "#94a3b8",
                          }}
                        >
                          {showPlan
                            ? isProtected
                              ? "—"
                              : plan.totalLsMW.toFixed(2)
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
