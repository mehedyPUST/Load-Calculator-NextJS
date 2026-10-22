"use client";

const btnBase =
  "rounded-xl font-extrabold tracking-wide uppercase leading-tight shadow-md active:scale-[0.97] transition-all duration-200 ease-out cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-slate-400";

export default function ResultsPanel({ calculate, bottail11kV, totalMW, onCopy }) {
  const bottail = calculate ? (Math.round((bottail11kV + Number.EPSILON) * 10) / 10).toFixed(1) : "0.0";
  const total = calculate ? (Math.round((totalMW + Number.EPSILON) * 10) / 10).toFixed(1) : "0.0";

  return (
    <section
      className="grid grid-cols-3"
      style={{
        paddingLeft: "var(--calc-section-px)",
        paddingRight: "var(--calc-section-px)",
        paddingBottom: "var(--calc-gap)",
        gap: "var(--calc-gap)",
      }}
    >
      <div
        className="bg-gradient-to-br from-slate-700/95 to-slate-900 text-white rounded-xl flex items-center justify-between shadow-lg shadow-slate-950/30 border border-white/10 min-w-0"
        style={{ height: "var(--calc-badge-h)", paddingLeft: "0.4rem", paddingRight: "0.4rem" }}
      >
        <span
          className="font-bold tracking-wide uppercase opacity-90 truncate"
          style={{ fontSize: "var(--calc-badge-label)" }}
        >
          H3+T3
        </span>
        <span
          className="font-black font-mono tracking-tight text-emerald-400 shrink-0 ml-1"
          style={{ fontSize: "var(--calc-badge-text)" }}
        >
          {bottail}{" "}
          <span className="font-bold opacity-80" style={{ fontSize: "var(--calc-badge-label)" }}>
            MW
          </span>
        </span>
      </div>

      <div
        className="bg-gradient-to-br from-emerald-600 to-teal-800 text-white rounded-xl flex items-center justify-between shadow-lg shadow-emerald-950/35 border border-emerald-400/20 min-w-0"
        style={{ height: "var(--calc-badge-h)", paddingLeft: "0.4rem", paddingRight: "0.4rem" }}
      >
        <span
          className="font-bold tracking-wide uppercase opacity-90 truncate"
          style={{ fontSize: "var(--calc-badge-label)" }}
        >
          Total
        </span>
        <span
          className="font-black font-mono tracking-tight text-teal-300 shrink-0 ml-1"
          style={{ fontSize: "var(--calc-badge-text)" }}
        >
          {total}{" "}
          <span className="font-bold opacity-80" style={{ fontSize: "var(--calc-badge-label)" }}>
            MW
          </span>
        </span>
      </div>

      <button
        type="button"
        onClick={onCopy}
        className={`${btnBase} bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 hover:shadow-lg hover:shadow-slate-900/40 hover:-translate-y-0.5`}
        style={{
          height: "var(--calc-badge-h)",
          fontSize: "var(--calc-btn-text)",
          paddingLeft: "0.25rem",
          paddingRight: "0.25rem",
        }}
      >
        Copy Total
      </button>
    </section>
  );
}
