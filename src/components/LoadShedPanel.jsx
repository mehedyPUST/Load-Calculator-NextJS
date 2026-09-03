"use client";

function Metric({ label, value, unit, tone = "neutral" }) {
  const tones = {
    neutral: "bg-white border-slate-200 text-slate-800",
    slate: "bg-slate-800 border-slate-700 text-white",
    danger: "bg-red-600 border-red-500 text-white",
    ok: "bg-emerald-600 border-emerald-500 text-white",
    warn: "bg-orange-600 border-orange-500 text-white",
    accent: "bg-slate-700 border-slate-600 text-emerald-300",
  };
  return (
    <div
      className={`rounded-md border flex flex-col items-center justify-center px-1 shadow-sm ${tones[tone]}`}
      style={{ height: "var(--calc-badge-h)", minHeight: "2rem" }}
    >
      <span
        className="font-semibold uppercase tracking-wide opacity-90"
        style={{ fontSize: "var(--calc-badge-label)" }}
      >
        {label}
      </span>
      <span
        className="font-black font-mono leading-tight"
        style={{ fontSize: "var(--calc-badge-text)" }}
      >
        {value}
        {unit ? (
          <span
            className="opacity-75 ml-0.5 font-bold"
            style={{ fontSize: "var(--calc-badge-label)" }}
          >
            {unit}
          </span>
        ) : null}
      </span>
    </div>
  );
}

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
  const protectedMW = hasPlan ? plan.protectedMW ?? 0 : 0;
  const available =
    hasPlan && plan.allotment != null
      ? Math.max(0, plan.allotment - protectedMW)
      : null;

  return (
    <section
      className="border-b border-slate-300 bg-gradient-to-b from-slate-100 to-slate-50"
      style={{
        paddingLeft: "var(--calc-section-px)",
        paddingRight: "var(--calc-section-px)",
        paddingTop: "var(--calc-bus-py)",
        paddingBottom: "var(--calc-bus-py)",
      }}
    >
      <div className="flex flex-col" style={{ gap: "calc(var(--calc-gap) * 0.85)" }}>
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="inline-flex items-center justify-center rounded bg-amber-600 text-white font-black tracking-wide uppercase shrink-0"
            style={{ fontSize: "var(--calc-badge-label)", padding: "0.15rem 0.4rem" }}
          >
            LS
          </span>
          <div className="min-w-0">
            <p
              className="font-bold text-slate-800 leading-tight truncate"
              style={{ fontSize: "var(--calc-bus-label)" }}
            >
              Load shedding plan
            </p>
            <p
              className="text-slate-500 leading-tight truncate"
              style={{ fontSize: "var(--calc-badge-label)" }}
            >
              Input: amps · current LS (MW) · allotment → Target A · More LS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <label
            className="font-bold text-slate-700 tracking-wide shrink-0"
            style={{ fontSize: "var(--calc-bus-label)" }}
          >
            Allotment
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              inputMode="decimal"
              value={allotment}
              onChange={(e) => onAllotmentChange(e.target.value)}
              onWheel={handleWheel}
              onKeyDown={handleKeyDown}
              placeholder="40.0"
              className="bg-white border border-slate-300 rounded-md text-center font-black text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/35 focus:border-amber-500 font-mono shadow-sm"
              style={{
                width: "calc(var(--calc-bus-h) * 3)",
                height: "var(--calc-bus-h)",
                fontSize: "var(--calc-bus-input)",
                paddingRight: "1.6rem",
              }}
              aria-label="Load shedding allotment in MW"
            />
            <span
              className="absolute right-2 font-bold text-slate-400 pointer-events-none"
              style={{ fontSize: "var(--calc-badge-label)" }}
            >
              MW
            </span>
          </div>
          {hasPlan && (
            <span
              className={`ml-auto font-semibold rounded px-1.5 py-0.5 border ${
                over
                  ? "bg-red-50 text-red-700 border-red-200"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}
              style={{ fontSize: "var(--calc-badge-label)" }}
            >
              {over ? "MORE LS NEEDED" : "WITHIN LIMIT"}
            </span>
          )}
        </div>

        {hasPlan && (
          <div className="grid grid-cols-4" style={{ gap: "var(--calc-gap)" }}>
            <Metric
              label="Running"
              value={plan.totalMW.toFixed(1)}
              unit="MW"
              tone="neutral"
            />
            <Metric
              label="Cur LS"
              value={(plan.totalCurrentLsMW ?? 0).toFixed(1)}
              unit="MW"
              tone="slate"
            />
            <Metric
              label="For others"
              value={available != null ? available.toFixed(1) : "—"}
              unit="MW"
              tone="accent"
            />
            <Metric
              label="More LS"
              value={over ? plan.shedTotalMW.toFixed(1) : "0.0"}
              unit="MW"
              tone={over ? "danger" : "ok"}
            />
          </div>
        )}

        {hasPlan && over && (
          <p
            className="text-center font-medium text-slate-600 leading-snug"
            style={{ fontSize: "var(--calc-badge-label)" }}
          >
            BRB+MRS free ({protectedMW.toFixed(2)} MW) · others share{" "}
            {available?.toFixed(2)} MW · more LS distributed proportionally
          </p>
        )}
      </div>
    </section>
  );
}
