"use client";

export default function ModeToggle({ mode, onChange, onHistory, historyLabel }) {
  const isLS = mode === "loadShed";

  return (
    <div
      className={`flex flex-col border-b ${
        isLS
          ? "border-amber-200/80 bg-gradient-to-b from-amber-50/90 to-white"
          : "border-slate-200/90 bg-gradient-to-b from-slate-50 to-white"
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
        <div className="inline-flex rounded-full border border-slate-200 bg-white p-0.5 shadow-sm shrink-0">
          <button
            type="button"
            onClick={() => onChange("normal")}
            className={`rounded-full px-3.5 font-semibold tracking-wide uppercase transition-all cursor-pointer ${
              mode === "normal"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
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
            className={`rounded-full px-3.5 font-semibold tracking-wide uppercase transition-all cursor-pointer ${
              isLS
                ? "bg-slate-800 text-amber-300 shadow-md"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
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
            className="shrink-0 rounded-full font-semibold tracking-wide uppercase border border-slate-200 text-slate-600 bg-white hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 shadow-sm active:scale-[0.98] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400"
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
          isLS ? "text-amber-800/90" : "text-slate-500"
        }`}
      >
        {isLS
          ? "Set allotment · enter amps & current LS · plan shows target A & more LS"
          : "Enter bus kV and feeder amps · Calculate or Calculate & Save"}
      </p>
    </div>
  );
}
