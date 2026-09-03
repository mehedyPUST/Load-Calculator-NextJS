"use client";

export default function ModeToggle({ mode, onChange }) {
  return (
    <div
      className="flex items-center justify-center border-b border-slate-200 bg-slate-50"
      style={{
        paddingTop: "calc(var(--calc-gap) * 0.45)",
        paddingBottom: "calc(var(--calc-gap) * 0.45)",
        paddingLeft: "var(--calc-section-px)",
        paddingRight: "var(--calc-section-px)",
      }}
    >
      <div className="inline-flex rounded-md border border-slate-300 bg-white p-0.5 shadow-sm">
        <button
          type="button"
          onClick={() => onChange("normal")}
          className={`rounded px-3 font-bold tracking-wide uppercase transition-all cursor-pointer ${
            mode === "normal"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-50"
          }`}
          style={{
            fontSize: "var(--calc-btn-text)",
            height: "calc(var(--calc-btn-h) * 0.8)",
          }}
        >
          Load Calc
        </button>
        <button
          type="button"
          onClick={() => onChange("loadShed")}
          className={`rounded px-3 font-bold tracking-wide uppercase transition-all cursor-pointer ${
            mode === "loadShed"
              ? "bg-slate-800 text-amber-300 shadow-sm"
              : "text-slate-600 hover:bg-slate-50"
          }`}
          style={{
            fontSize: "var(--calc-btn-text)",
            height: "calc(var(--calc-btn-h) * 0.8)",
          }}
        >
          Load Shed
        </button>
      </div>
    </div>
  );
}
