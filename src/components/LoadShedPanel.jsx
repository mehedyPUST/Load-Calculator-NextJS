"use client";

export default function LoadShedPanel({
  allotment,
  onAllotmentChange,
  plan,
  calculated,
  handleWheel,
  handleKeyDown,
}) {
  const hasPlan = calculated && plan?.valid;
  const over = hasPlan && plan.needsShed;
  const under = hasPlan && !plan.needsShed;
  const protectedMW = hasPlan ? plan.protectedMW ?? 0 : 0;
  const available = hasPlan && plan.allotment != null
    ? Math.max(0, plan.allotment - protectedMW)
    : null;

  return (
    <section
      className="bg-amber-50 border-b border-amber-200/80"
      style={{
        paddingLeft: "var(--calc-section-px)",
        paddingRight: "var(--calc-section-px)",
        paddingTop: "var(--calc-bus-py)",
        paddingBottom: "var(--calc-bus-py)",
      }}
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <label
            className="font-bold text-amber-900 tracking-wide shrink-0"
            style={{ fontSize: "var(--calc-bus-label)" }}
          >
            Allotment (MW)
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={allotment}
            onChange={(e) => onAllotmentChange(e.target.value)}
            onWheel={handleWheel}
            onKeyDown={handleKeyDown}
            placeholder="e.g. 40"
            className="bg-white border border-amber-300 rounded-md text-center font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 font-mono"
            style={{
              width: "calc(var(--calc-bus-h) * 2.8)",
              height: "var(--calc-bus-h)",
              fontSize: "var(--calc-bus-input)",
            }}
            aria-label="Load shedding allotment in MW"
          />
          <span
            className="ml-auto font-semibold text-amber-800/90 bg-amber-100/80 px-1.5 py-0.5 rounded border border-amber-200"
            style={{ fontSize: "var(--calc-badge-label)" }}
            title="BRB and MRS stay free; remaining allotment is shared by other feeders including H-3 and T-3"
          >
            BRB + MRS free
          </span>
        </div>

        {hasPlan && (
          <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: "var(--calc-gap)" }}>
            <div
              className="rounded-lg bg-white border border-slate-200 flex flex-col items-center justify-center px-1 shadow-sm"
              style={{ height: "var(--calc-badge-h)" }}
            >
              <span className="font-bold text-slate-500 uppercase tracking-wide" style={{ fontSize: "var(--calc-badge-label)" }}>
                Current
              </span>
              <span className="font-black font-mono text-slate-800" style={{ fontSize: "var(--calc-badge-text)" }}>
                {plan.totalMW.toFixed(2)}
                <span className="opacity-60 ml-0.5" style={{ fontSize: "var(--calc-badge-label)" }}>MW</span>
              </span>
            </div>
            <div
              className="rounded-lg bg-slate-700 border border-slate-600 text-white flex flex-col items-center justify-center px-1 shadow-sm"
              style={{ height: "var(--calc-badge-h)" }}
            >
              <span className="font-bold uppercase tracking-wide opacity-90" style={{ fontSize: "var(--calc-badge-label)" }}>
                For others
              </span>
              <span className="font-black font-mono text-emerald-300" style={{ fontSize: "var(--calc-badge-text)" }}>
                {available != null ? available.toFixed(2) : "—"}
                <span className="opacity-80 ml-0.5" style={{ fontSize: "var(--calc-badge-label)" }}>MW</span>
              </span>
            </div>
            <div
              className={`rounded-lg flex flex-col items-center justify-center px-1 shadow-sm border ${
                over
                  ? "bg-red-600 border-red-500 text-white"
                  : under
                    ? "bg-emerald-600 border-emerald-500 text-white"
                    : "bg-white border-slate-200 text-slate-800"
              }`}
              style={{ height: "var(--calc-badge-h)" }}
            >
              <span className="font-bold uppercase tracking-wide opacity-90" style={{ fontSize: "var(--calc-badge-label)" }}>
                {over ? "To Shed" : "Headroom"}
              </span>
              <span className="font-black font-mono" style={{ fontSize: "var(--calc-badge-text)" }}>
                {over
                  ? plan.shedTotalMW.toFixed(2)
                  : Math.max(0, (available ?? 0) - (plan.shedableMW ?? 0)).toFixed(2)}
                <span className="opacity-80 ml-0.5" style={{ fontSize: "var(--calc-badge-label)" }}>MW</span>
              </span>
            </div>
            <div
              className={`rounded-lg flex flex-col items-center justify-center px-1 shadow-sm border ${
                over
                  ? "bg-orange-600 border-orange-500 text-white"
                  : "bg-white border-slate-200 text-slate-800"
              }`}
              style={{ height: "var(--calc-badge-h)" }}
            >
              <span className="font-bold uppercase tracking-wide opacity-90" style={{ fontSize: "var(--calc-badge-label)" }}>
                Shed %
              </span>
              <span className="font-black font-mono" style={{ fontSize: "var(--calc-badge-text)" }}>
                {plan.shedPercent.toFixed(1)}%
              </span>
            </div>
          </div>
        )}

        {hasPlan && over && (
          <p className="text-center font-semibold text-red-700" style={{ fontSize: "var(--calc-badge-label)" }}>
            BRB+MRS free ({protectedMW.toFixed(2)} MW) · {available?.toFixed(2)} MW shared among other feeders (incl. H-3, T-3)
          </p>
        )}
        {hasPlan && under && (
          <p className="text-center font-semibold text-emerald-700" style={{ fontSize: "var(--calc-badge-label)" }}>
            Within allotment — no load shed required
          </p>
        )}
      </div>
    </section>
  );
}
