"use client";

import { FEEDERS } from "@/lib/constants";

const thBase =
  "text-center font-semibold tracking-wide uppercase align-middle whitespace-nowrap";
const tdBase = "text-center align-middle whitespace-nowrap";

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

  const thStyle = {
    paddingTop: "var(--calc-th-py)",
    paddingBottom: "var(--calc-th-py)",
    paddingLeft: "2px",
    paddingRight: "2px",
    fontSize: "var(--calc-th-size)",
    lineHeight: 1.15,
  };

  const tdStyle = {
    fontSize: "var(--calc-row-text)",
    height: "var(--calc-row-h)",
    paddingLeft: "2px",
    paddingRight: "2px",
  };

  const inputStyle = {
    fontSize: "var(--calc-row-text)",
    height: "var(--calc-row-h)",
    minHeight: "var(--calc-row-h)",
  };

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
        <div className="flex-1 min-h-0 overflow-auto">
          <table className="calc-feeder-table w-full">
            <colgroup>
              {isLS ? (
                <>
                  <col style={{ width: "13%" }} />
                  <col style={{ width: "18%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "15%" }} />
                </>
              ) : (
                <>
                  <col style={{ width: "30%" }} />
                  <col style={{ width: "40%" }} />
                  <col style={{ width: "30%" }} />
                </>
              )}
            </colgroup>

            <thead
              className={
                isLS
                  ? "bg-slate-800 text-slate-100 sticky top-0 z-10"
                  : "bg-slate-100 text-slate-700 sticky top-0 z-10"
              }
            >
              <tr className={isLS ? "border-b border-slate-700" : "border-b border-slate-200"}>
                <th
                  className={`${thBase} border-r ${isLS ? "border-slate-600/50" : "border-slate-200"}`}
                  style={thStyle}
                >
                  Amps
                </th>
                <th
                  className={`${thBase} border-r ${isLS ? "border-slate-600/50" : "border-slate-200"}`}
                  style={thStyle}
                >
                  Feeder
                </th>
                <th className={thBase} style={thStyle}>
                  MW
                </th>
                {isLS && (
                  <>
                    <th
                      className={`${thBase} border-l border-slate-600/50 bg-slate-700/90`}
                      style={thStyle}
                      title="Already applied LS (MW)"
                    >
                      Cur LS
                    </th>
                    <th
                      className={`${thBase} border-l border-slate-600/50 bg-orange-900/50`}
                      style={thStyle}
                      title="Additional LS required (MW)"
                    >
                      More LS
                    </th>
                    <th
                      className={`${thBase} border-l border-slate-600/50 bg-emerald-900/40`}
                      style={thStyle}
                    >
                      Target A
                    </th>
                    <th
                      className={`${thBase} border-l border-slate-600/50 bg-teal-900/40`}
                      style={thStyle}
                      title="Total LS = Cur + More (MW)"
                    >
                      Total LS
                    </th>
                  </>
                )}
              </tr>
            </thead>

            <tbody>
              {FEEDERS.map((item, index) => {
                const mw = getDisplayMW(item.id);
                const plan = planMap[item.id];
                const showPlan = isLS && plan && loadShedPlan?.valid;
                const isProtected = !!plan?.protected;
                const rowBg = isProtected
                  ? "bg-slate-100"
                  : index % 2 === 0
                    ? "bg-white"
                    : "bg-slate-50";

                return (
                  <tr
                    key={item.id}
                    className={`${rowBg} border-b border-slate-200 last:border-b-0`}
                  >
                    {/* Amps */}
                    <td
                      className={`cell-input border-r border-slate-200 ${tdBase}`}
                      style={tdStyle}
                    >
                      <input
                        type="text"
                        inputMode="decimal"
                        value={amps[item.id]}
                        onChange={(e) => onAmpChange(item.id, e.target.value)}
                        onBlur={() => onAmpBlur(item.id)}
                        onWheel={handleWheel}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-transparent text-center font-bold text-slate-800 focus:outline-none focus:bg-emerald-50/60 focus:ring-1 focus:ring-inset focus:ring-emerald-500/40 font-mono"
                        style={inputStyle}
                        aria-label={`${item.name} amps`}
                      />
                    </td>

                    {/* Feeder */}
                    <td
                      className={`border-r border-slate-200 ${tdBase}`}
                      style={tdStyle}
                    >
                      <div className="flex items-center justify-center gap-0.5 min-w-0 px-0.5">
                        <span className="font-bold text-slate-800 truncate">
                          {item.name}
                        </span>
                        <span
                          className="font-semibold text-slate-400 shrink-0"
                          style={{ fontSize: "calc(var(--calc-row-text) * 0.72)" }}
                        >
                          B{item.bus}
                        </span>
                        {isProtected && (
                          <span
                            className="font-bold text-slate-500 shrink-0 rounded px-0.5 bg-slate-200/80"
                            style={{ fontSize: "calc(var(--calc-row-text) * 0.6)" }}
                          >
                            FREE
                          </span>
                        )}
                      </div>
                    </td>

                    {/* MW */}
                    <td
                      className={`${tdBase} font-black font-mono text-emerald-700`}
                      style={tdStyle}
                    >
                      {mw !== null ? mw.toFixed(2) : "—"}
                    </td>

                    {isLS && (
                      <>
                        {/* Cur LS input */}
                        <td
                          className={`cell-input border-l border-slate-200 bg-slate-50/90 ${tdBase}`}
                          style={tdStyle}
                        >
                          {isProtected ? (
                            <span className="font-mono text-slate-400">—</span>
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
                              className="w-full bg-transparent text-center font-bold text-slate-700 focus:outline-none focus:bg-amber-50/70 focus:ring-1 focus:ring-inset focus:ring-amber-500/40 font-mono"
                              style={inputStyle}
                              aria-label={`${item.name} current LS MW`}
                              title="Already applied LS (MW)"
                            />
                          )}
                        </td>

                        {/* More LS */}
                        <td
                          className={`border-l border-slate-200 bg-orange-50/40 ${tdBase} font-black font-mono`}
                          style={{
                            ...tdStyle,
                            color:
                              showPlan && (plan?.moreLsMW || 0) > 0.001
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

                        {/* Target A */}
                        <td
                          className={`border-l border-slate-200 bg-emerald-50/40 ${tdBase} font-black font-mono text-teal-800`}
                          style={tdStyle}
                        >
                          {showPlan
                            ? isProtected
                              ? Math.round(plan.amps)
                              : Math.round(plan.targetAmps)
                            : "—"}
                        </td>

                        {/* Total LS */}
                        <td
                          className={`border-l border-slate-200 bg-teal-50/30 ${tdBase} font-black font-mono`}
                          style={{
                            ...tdStyle,
                            color:
                              showPlan && (plan?.totalLsMW || 0) > 0.001
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
