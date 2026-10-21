"use client";

export default function ModeToggle({ mode, onChange, onHistory }) {
  return (
    <div
      className="flex items-center justify-between border-b border-slate-200 bg-slate-50"
      style={{
        paddingTop: "calc(var(--calc-gap) * 0.45)",
        paddingBottom: "calc(var(--calc-gap) * 0.45)",
        paddingLeft: "var(--calc-section-px)",
        paddingRight: "var(--calc-section-px)",
        gap: "var(--calc-gap)",
      }}
    >
      {/* Left: Load Calc / Load Shed toggle */}
      <div className="inline-flex rounded-md border border-slate-300 bg-white p-0.5 shadow-sm shrink-0">
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

      {/* Right: View Saved History */}
      {onHistory && (
        <button
          type="button"
          onClick={onHistory}
          className="shrink-0 rounded-md font-bold tracking-wide uppercase border border-slate-300 text-slate-600 bg-white hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 shadow-sm active:scale-[0.98] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400"
          style={{
            height: "calc(var(--calc-btn-h) * 0.8)",
            fontSize: "var(--calc-btn-text)",
            paddingLeft: "0.6rem",
            paddingRight: "0.6rem",
          }}
        >
          History
        </button>
      )}
    </div>
  );
}
