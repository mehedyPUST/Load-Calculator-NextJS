"use client";

import { useEffect, useRef } from "react";
import { FEEDERS } from "@/lib/constants";
import { navigateInputsByArrow } from "@/lib/inputNav";

const thBase =
  "text-center font-semibold tracking-wide uppercase align-middle whitespace-nowrap";
const tdBase = "text-center align-middle whitespace-nowrap";

/** Clamp helper for dynamic row height (px) */
function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function isRingOn(ringActive, id) {
  if (!ringActive) return false;
  return !!(ringActive[id] || ringActive[String(id)]);
}

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
  ringActive = {},
  onRingToggle = null,
}) {
  const isLS = mode === "loadShed";

  const onInputKeyDown = (e) => {
    if (navigateInputsByArrow(e)) return;
    // Keep legacy guard for up/down when already at edge
    handleKeyDown?.(e);
  };

  const planMap = {};
  if (isLS && loadShedPlan?.feeders) {
    loadShedPlan.feeders.forEach((f) => {
      planMap[f.id] = f;
    });
  }

  const scrollRef = useRef(null);
  const theadRef = useRef(null);
  const rowCount = FEEDERS.length; // 9
  const fittingRef = useRef(false);

  // Scale row height so all feeder rows fit in the available height when possible.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const fit = () => {
      if (fittingRef.current) return;
      const available = el.clientHeight;
      if (available <= 0) return;

      fittingRef.current = true;
      try {
        // Measure header with current styles
        const theadH = theadRef.current?.getBoundingClientRect().height || 28;
        const bodySpace = Math.max(0, available - theadH - 1);
        // Prefer fitting all rows; stay usable on tiny screens
        const ideal = bodySpace / rowCount;
        const rowPx = clamp(Math.floor(ideal), 24, 44);
        const thPy = clamp(Math.round(rowPx * 0.16), 3, 8);
        const rowText = clamp(Math.round(rowPx * 0.4), 11, 15);
        const thSize = clamp(Math.round(rowPx * 0.34), 10, 13);

        el.style.setProperty("--calc-row-h", `${rowPx}px`);
        el.style.setProperty("--calc-row-text", `${rowText}px`);
        el.style.setProperty("--calc-th-py", `${thPy}px`);
        el.style.setProperty("--calc-th-size", `${thSize}px`);

        // Scroll only if even min rows still overflow
        const needsScroll = rowPx * rowCount + theadH > available + 2;
        el.style.overflowY = needsScroll ? "auto" : "hidden";
      } finally {
        // Allow next frame to observe again after layout settles
        requestAnimationFrame(() => {
          fittingRef.current = false;
        });
      }
    };

    fit();
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(fit);
    });
    ro.observe(el);
    window.addEventListener("resize", fit);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, [rowCount, isLS]);

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
      className="calc-feeder-wrap bg-[#0b1220]"
      style={{
        paddingLeft: "var(--calc-section-px)",
        paddingRight: "var(--calc-section-px)",
        paddingTop: "calc(var(--calc-gap) * 0.4)",
        paddingBottom: "calc(var(--calc-gap) * 0.4)",
      }}
    >
      <div
        className={`rounded-lg shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col border bg-slate-900/70 ${
          isLS ? "border-amber-500/25" : "border-white/10"
        }`}
      >
        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto calc-feeder-scroll"
        >
          <table className="calc-feeder-table w-full">
            <colgroup>
              {isLS ? (
                <>
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "11%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "13%" }} />
                  <col style={{ width: "13%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "13%" }} />
                </>
              ) : (
                <>
                  <col style={{ width: "26%" }} />
                  <col style={{ width: "34%" }} />
                  <col style={{ width: "22%" }} />
                  <col style={{ width: "18%" }} />
                </>
              )}
            </colgroup>

            <thead
              ref={theadRef}
              className="bg-slate-950 text-slate-300 sticky top-0 z-10"
            >
              <tr className="border-b border-slate-800">
                <th
                  className={`${thBase} border-r border-slate-800`}
                  style={thStyle}
                >
                  Amps
                </th>
                <th
                  className={`${thBase} border-r border-slate-800`}
                  style={thStyle}
                >
                  Feeder
                </th>
                <th
                  className={`${thBase} bg-emerald-950/40 text-emerald-300`}
                  style={thStyle}
                >
                  MW
                </th>
                <th
                  className={`${thBase} border-l border-slate-800`}
                  style={thStyle}
                >
                  Ring
                </th>
                {isLS && (
                  <>
                    <th
                      className={`${thBase} border-l border-slate-800 bg-slate-900 text-slate-300`}
                      style={thStyle}
                      title="Already applied LS (MW)"
                    >
                      Cur LS
                    </th>
                    <th
                      className={`${thBase} border-l border-slate-800 bg-rose-950/60 text-rose-300`}
                      style={thStyle}
                      title="Additional LS required (MW)"
                    >
                      More LS
                    </th>
                    <th
                      className={`${thBase} border-l border-slate-800 bg-emerald-950/50 text-emerald-300`}
                      style={thStyle}
                    >
                      Target A
                    </th>
                    <th
                      className={`${thBase} border-l border-slate-800 bg-teal-950/50 text-teal-300`}
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
                  ? "bg-slate-800/60"
                  : index % 2 === 0
                    ? "bg-slate-900/45"
                    : "bg-slate-950/45";

                return (
                  <tr
                    key={item.id}
                    className={`${rowBg} border-b border-slate-800/80 last:border-b-0 transition-colors hover:bg-slate-800/50`}
                  >
                    {/* Amps */}
                    <td
                      className={`cell-input border-r border-slate-800/80 ${tdBase}`}
                      style={tdStyle}
                    >
                      <input
                        type="text"
                        inputMode="decimal"
                        data-nav="1"
                        data-nav-row={index}
                        data-nav-col={0}
                        value={amps[item.id]}
                        onChange={(e) => onAmpChange(item.id, e.target.value)}
                        onBlur={() => onAmpBlur(item.id)}
                        onWheel={handleWheel}
                        onKeyDown={onInputKeyDown}
                        className="w-full bg-transparent text-center font-bold text-white focus:outline-none focus:bg-emerald-950/40 focus:ring-1 focus:ring-inset focus:ring-emerald-400/60 font-mono tabular-nums"
                        style={inputStyle}
                        aria-label={`${item.name} amps`}
                      />
                    </td>

                    {/* Feeder */}
                    <td
                      className={`border-r border-slate-800/80 ${tdBase}`}
                      style={tdStyle}
                    >
                      <div className="flex items-center justify-center gap-1 min-w-0 px-0.5">
                        <span className="font-bold text-slate-100 truncate">
                          {item.name}
                        </span>
                        <span
                          className={`font-mono font-semibold shrink-0 ${
                            item.bus === 1 ? "text-sky-400/90" : "text-purple-400/90"
                          }`}
                          style={{ fontSize: "calc(var(--calc-row-text) * 0.72)" }}
                        >
                          B{item.bus}
                        </span>
                        {isProtected && (
                          <span
                            className="font-bold text-emerald-300 shrink-0 rounded px-1 bg-emerald-950/80 border border-emerald-500/25"
                            style={{ fontSize: "calc(var(--calc-row-text) * 0.58)" }}
                          >
                            FREE
                          </span>
                        )}
                      </div>
                    </td>

                    {/* MW */}
                    <td
                      className={`${tdBase} font-black font-mono tabular-nums text-emerald-400 bg-emerald-950/15`}
                      style={tdStyle}
                    >
                      {mw !== null ? (Math.round((mw + Number.EPSILON) * 10) / 10).toFixed(1) : "—"}
                    </td>

                    {/* Ring — toggle available for every feeder (no tooltip) */}
                    <td
                      className={`${tdBase} border-l border-slate-800/80`}
                      style={tdStyle}
                    >
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => onRingToggle?.(item.id)}
                        aria-pressed={isRingOn(ringActive, item.id)}
                        aria-label={`${item.name} ring line`}
                        className={`mx-auto inline-flex items-center justify-center rounded px-1.5 font-bold tracking-wide uppercase transition-colors cursor-pointer border ${
                          isRingOn(ringActive, item.id)
                            ? "bg-amber-500 text-slate-950 border-amber-400 shadow-sm"
                            : "bg-slate-800/80 text-slate-400 border-white/10 hover:border-slate-500 hover:text-slate-200"
                        }`}
                        style={{
                          fontSize: "calc(var(--calc-row-text) * 0.7)",
                          height: "calc(var(--calc-row-h) * 0.78)",
                          minWidth: "2.4rem",
                        }}
                      >
                        {isRingOn(ringActive, item.id) ? "ON" : "OFF"}
                      </button>
                    </td>

                    {isLS && (
                      <>
                        {/* Cur LS input */}
                        <td
                          className={`cell-input border-l border-slate-800/80 bg-slate-950/40 ${tdBase}`}
                          style={tdStyle}
                        >
                          {isProtected ? (
                            <span className="font-mono text-slate-600">—</span>
                          ) : (
                            <input
                              type="text"
                              inputMode="decimal"
                              data-nav="1"
                              data-nav-row={index}
                              data-nav-col={1}
                              value={currentLs?.[item.id] ?? "0"}
                              onChange={(e) =>
                                onCurrentLsChange?.(item.id, e.target.value)
                              }
                              onWheel={handleWheel}
                              onKeyDown={onInputKeyDown}
                              className="w-full bg-transparent text-center font-bold text-amber-200 focus:outline-none focus:bg-amber-950/40 focus:ring-1 focus:ring-inset focus:ring-amber-400/50 font-mono tabular-nums"
                              style={inputStyle}
                              aria-label={`${item.name} current LS MW`}
                              title="Already applied LS (MW)"
                            />
                          )}
                        </td>

                        {/* More LS */}
                        <td
                          className={`border-l border-slate-800/80 bg-rose-950/15 ${tdBase} font-black font-mono tabular-nums`}
                          style={{
                            ...tdStyle,
                            color:
                              showPlan && (plan?.moreLsMW || 0) > 0.001
                                ? "#fb7185"
                                : "#64748b",
                          }}
                        >
                          {showPlan
                            ? isProtected
                              ? "—"
                              : (Math.round((plan.moreLsMW + Number.EPSILON) * 10) / 10).toFixed(1)
                            : "—"}
                        </td>

                        {/* Target A */}
                        <td
                          className={`border-l border-slate-800/80 bg-emerald-950/15 ${tdBase} font-black font-mono tabular-nums text-emerald-300`}
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
                          className={`border-l border-slate-800/80 bg-teal-950/15 ${tdBase} font-black font-mono tabular-nums`}
                          style={{
                            ...tdStyle,
                            color:
                              showPlan && (plan?.totalLsMW || 0) > 0.001
                                ? "#2dd4bf"
                                : "#64748b",
                          }}
                        >
                          {showPlan
                            ? isProtected
                              ? "—"
                              : (Math.round((plan.totalLsMW + Number.EPSILON) * 10) / 10).toFixed(1)
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
