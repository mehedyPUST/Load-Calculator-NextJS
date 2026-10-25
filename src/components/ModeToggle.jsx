"use client";

export default function ModeToggle({ mode, onChange, onHistory, historyLabel }) {
  const isLS = mode === "loadShed";

  return (
    <div
      className={`flex flex-col border-b ${
        isLS
          ? "border-amber-500/25 bg-gradient-to-b from-amber-950/30 to-slate-900/90"
          : "border-white/[0.08] bg-slate-900/80"
      }`}
      style={{
        paddingTop: "calc(var(--calc-gap) * 0.45)",
        paddingBottom: "calc(var(--calc-gap) * 0.45)",
        paddingLeft: "var(--calc-section-px)",
        paddingRight: "var(--calc-section-px)",
        gap: "calc(var(--calc-gap) * 0.35)",
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex rounded-lg border border-white/10 bg-slate-950/80 p-0.5 shadow-sm shrink-0">
          <button
            type="button"
            onClick={() => onChange("normal")}
            className={`rounded-md px-3.5 font-semibold tracking-wide uppercase transition-all cursor-pointer ${
              mode === "normal"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
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
            className={`rounded-md px-3.5 font-semibold tracking-wide uppercase transition-all cursor-pointer ${
              isLS
                ? "bg-amber-600 text-white shadow-sm"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
            style={{
              fontSize: "var(--calc-btn-text)",
              height: "calc(var(--calc-btn-h) * 0.8)",
            }}
          >
            Loadshed
          </button>
        </div>

        {onHistory && (
          <button
            type="button"
            onClick={onHistory}
            className="shrink-0 rounded-lg font-semibold tracking-wide uppercase border border-white/10 text-slate-200 bg-slate-800/90 hover:border-emerald-500/50 hover:text-emerald-300 hover:bg-slate-800 shadow-sm active:scale-[0.98] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400"
            style={{
              height: "calc(var(--calc-btn-h) * 0.8)",
              fontSize: "var(--calc-btn-text)",
              paddingLeft: "0.6rem",
              paddingRight: "0.6rem",
            }}
          >
            {historyLabel || "History"}
          </button>
        )}
      </div>
      <p
        className={`text-[10px] font-medium leading-tight ${
          isLS ? "text-amber-300/90" : "text-slate-400"
        }`}
      >
        {isLS
          ? "Set allotment · enter amps & current LS · plan shows target A & more LS"
          : "Enter bus kV and feeder amps · Calculate or Calculate & Save"}
      </p>
    </div>
  );
}
