"use client";

function Metric({ label, value, unit, tone = "neutral" }) {
  const tones = {
    neutral: "bg-slate-800/80 border-white/10 text-white",
    slate: "bg-purple-950/50 border-purple-500/30 text-purple-200",
    danger: "bg-rose-950/70 border-rose-500/40 text-rose-200",
    ok: "bg-emerald-950/70 border-emerald-500/40 text-emerald-200",
    warn: "bg-amber-950/70 border-amber-500/40 text-amber-200",
    accent: "bg-sky-950/60 border-sky-500/30 text-sky-200",
  };
  return (
    <div
      className={`rounded-lg border flex flex-col items-center justify-center px-1 shadow-sm ${tones[tone]}`}
      style={{ height: "var(--calc-badge-h)", minHeight: "1.75rem" }}
    >
      <span
        className="font-semibold uppercase tracking-wide opacity-85 leading-none"
        style={{ fontSize: "var(--calc-badge-label)" }}
      >
        {label}
      </span>
      <span
        className="font-black font-mono tabular-nums leading-tight"
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
      className="border-b border-white/[0.08] bg-slate-900/70"
      style={{
        paddingLeft: "var(--calc-section-px)",
        paddingRight: "var(--calc-section-px)",
        paddingTop: "calc(var(--calc-gap) * 0.7)",
        paddingBottom: "calc(var(--calc-gap) * 0.7)",
      }}
    >
      <div className="grid grid-cols-4" style={{ gap: "var(--calc-gap)" }}>
        <Metric label="Running" value={(Math.round((plan.totalMW + Number.EPSILON) * 10) / 10).toFixed(1)} unit="MW" tone="neutral" />
        <Metric
          label="Cur LS"
          value={(Math.round(((plan.totalCurrentLsMW ?? 0) + Number.EPSILON) * 10) / 10).toFixed(1)}
          unit="MW"
          tone="slate"
        />
        <Metric
          label="For others"
          value={(Math.round((available + Number.EPSILON) * 10) / 10).toFixed(1)}
          unit="MW"
          tone="accent"
        />
        <Metric
          label="More LS"
          value={over ? (Math.round((plan.shedTotalMW + Number.EPSILON) * 10) / 10).toFixed(1) : "0.0"}
          unit="MW"
          tone={over ? "danger" : "ok"}
        />
      </div>
    </section>
  );
}
