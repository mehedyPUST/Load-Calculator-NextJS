"use client";

export default function ModeToggle({ mode, onChange }) {
  return (
    <div
      className="flex items-center justify-center bg-slate-100 border-b border-slate-200"
      style={{
        paddingTop: "calc(var(--calc-gap) * 0.5)",
        paddingBottom: "calc(var(--calc-gap) * 0.5)",
        paddingLeft: "var(--calc-section-px)",
        paddingRight: "var(--calc-section-px)",
        gap: "var(--calc-gap)",
      }}
    >
      <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 shadow-sm">
        <button
          type="button"
          onClick={() => onChange("normal")}
          className={`rounded-md font-bold tracking-wide uppercase transition-all cursor-pointer ${
            mode === "normal"
              ? "bg-emerald-600 text-white shadow"
              : "text-slate-600 hover:bg-slate-50"
          }`}
          style={{
            fontSize: "var(--calc-btn-text)",
            height: "calc(var(--calc-btn-h) * 0.85)",
            paddingLeft: "0.75rem",
            paddingRight: "0.75rem",
          }}
        >
          Load Calc
        </button>
        <button
          type="button"
          onClick={() => onChange("loadShed")}
          className={`rounded-md font-bold tracking-wide uppercase transition-all cursor-pointer ${
            mode === "loadShed"
              ? "bg-amber-600 text-white shadow"
              : "text-slate-600 hover:bg-slate-50"
          }`}
          style={{
            fontSize: "var(--calc-btn-text)",
            height: "calc(var(--calc-btn-h) * 0.85)",
            paddingLeft: "0.75rem",
            paddingRight: "0.75rem",
          }}
        >
          Load Shed
        </button>
      </div>
    </div>
  );
}
