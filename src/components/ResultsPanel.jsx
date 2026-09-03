"use client";

export default function ResultsPanel({ calculate, bottail11kV, totalMW }) {
  const bottail = calculate ? bottail11kV.toFixed(2) : "0.00";
  const total = calculate ? totalMW.toFixed(2) : "0.00";

  return (
    <section
      className="grid grid-cols-2"
      style={{
        paddingLeft: "var(--calc-section-px)",
        paddingRight: "var(--calc-section-px)",
        paddingBottom: "var(--calc-gap)",
        gap: "var(--calc-gap)",
      }}
    >
      <div
        className="bg-gradient-to-br from-slate-700 to-slate-800 text-white rounded-lg flex items-center justify-between shadow-md border border-slate-600/50"
        style={{ height: "var(--calc-badge-h)", paddingLeft: "0.5rem", paddingRight: "0.5rem" }}
      >
        <span
          className="font-bold tracking-wide uppercase opacity-90"
          style={{ fontSize: "var(--calc-badge-label)" }}
        >
          Bottail 11kV
        </span>
        <span
          className="font-black font-mono tracking-tight text-emerald-400"
          style={{ fontSize: "var(--calc-badge-text)" }}
        >
          {bottail}{" "}
          <span className="font-bold opacity-80" style={{ fontSize: "var(--calc-badge-label)" }}>
            MW
          </span>
        </span>
      </div>

      <div
        className="bg-gradient-to-br from-emerald-700 to-emerald-800 text-white rounded-lg flex items-center justify-between shadow-md border border-emerald-600/50"
        style={{ height: "var(--calc-badge-h)", paddingLeft: "0.5rem", paddingRight: "0.5rem" }}
      >
        <span
          className="font-bold tracking-wide uppercase opacity-90"
          style={{ fontSize: "var(--calc-badge-label)" }}
        >
          Total
        </span>
        <span
          className="font-black font-mono tracking-tight text-teal-300"
          style={{ fontSize: "var(--calc-badge-text)" }}
        >
          {total}{" "}
          <span className="font-bold opacity-80" style={{ fontSize: "var(--calc-badge-label)" }}>
            MW
          </span>
        </span>
      </div>
    </section>
  );
}
