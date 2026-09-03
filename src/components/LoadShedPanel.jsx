"use client";

function Metric({ label, value, unit, tone = "neutral" }) {
  const tones = {
    neutral: "bg-white border-slate-200 text-slate-800",
    slate: "bg-slate-800 border-slate-700 text-white",
    danger: "bg-red-600 border-red-500 text-white",
    ok: "bg-emerald-600 border-emerald-500 text-white",
    warn: "bg-orange-500 border-orange-400 text-white",
    accent: "bg-slate-700 border-slate-600 text-emerald-300",
  };
  return (
    <div
      className={`rounded-md border flex flex-col items-center justify-center px-1 shadow-sm ${tones[tone]}`}
      style={{ height: "var(--calc-badge-h)", minHeight: "1.75rem" }}
    >
      <span
        className="font-semibold uppercase tracking-wide opacity-90 leading-none"
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

/** Compact metrics strip only — allotment lives on the voltage row */
export default function LoadShedPanel({ plan, calculated }) {
  const hasPlan = calculated && plan?.valid;
  if (!hasPlan) return null;

  const over = plan.needsShed;
  const protectedMW = plan.protectedMW ?? 0;
  const available = Math.max(0, (plan.allotment ?? 0) - protectedMW);

  return (
    <section
      className="border-b border-slate-200 bg-white"
      style={{
        paddingLeft: "var(--calc-section-px)",
        paddingRight: "var(--calc-section-px)",
        paddingTop: "calc(var(--calc-gap) * 0.7)",
        paddingBottom: "calc(var(--calc-gap) * 0.7)",
      }}
    >
      <div className="grid grid-cols-4" style={{ gap: "var(--calc-gap)" }}>
        <Metric label="Running" value={plan.totalMW.toFixed(1)} unit="MW" tone="neutral" />
        <Metric
          label="Cur LS"
          value={(plan.totalCurrentLsMW ?? 0).toFixed(1)}
          unit="MW"
          tone="slate"
        />
        <Metric
          label="For others"
          value={available.toFixed(1)}
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
    </section>
  );
}
