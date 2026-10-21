"use client";

const btnBase =
  "rounded-lg font-extrabold tracking-wide uppercase leading-tight shadow-md active:scale-[0.97] transition-all duration-200 ease-out cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-slate-400";

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
        className="bg-gradient-to-br from-slate-700 to-slate-800 text-white rounded-lg flex items-center justify-between shadow-md border border-slate-600/50 min-w-0"
        style={{ height: "var(--calc-badge-h)", paddingLeft: "0.4rem", paddingRight: "0.4rem" }}
      >
        <span
          className="font-bold tracking-wide uppercase opacity-90 truncate"
          style={{ fontSize: "var(--calc-badge-label)" }}
        >
          Bottail 11kV
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
        className="bg-gradient-to-br from-emerald-700 to-emerald-800 text-white rounded-lg flex items-center justify-between shadow-md border border-emerald-600/50 min-w-0"
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
