"use client";

function Field({
  label,
  value,
  onChange,
  handleWheel,
  handleKeyDown,
  placeholder = "0.00",
  unit,
  accent = false,
}) {
  return (
    <div
      className={`relative flex items-center justify-between rounded-lg shadow-sm border transition-colors group ${
        accent
          ? "bg-amber-50 border-amber-300 hover:border-amber-500"
          : "bg-white border-slate-200 hover:border-emerald-500"
      }`}
      style={{
        paddingLeft: "0.4rem",
        paddingRight: "0.4rem",
        paddingTop: "calc(var(--calc-bus-py) * 0.45)",
        paddingBottom: "calc(var(--calc-bus-py) * 0.45)",
      }}
    >
      <label
        className={`font-bold tracking-wide mr-1 shrink-0 ${
          accent
            ? "text-amber-800 group-hover:text-amber-900"
            : "text-slate-600 group-hover:text-emerald-700"
        }`}
        style={{ fontSize: "var(--calc-bus-label)" }}
      >
        {label}
      </label>
      <div className="relative flex items-center">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onWheel={handleWheel}
          onKeyDown={handleKeyDown}
          className={`border rounded-md text-center font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all font-mono ${
            accent
              ? "bg-white border-amber-300 text-slate-900 focus:ring-amber-500/30 focus:border-amber-500"
              : "bg-slate-50 border-slate-200 text-slate-800 focus:ring-emerald-500/25 focus:border-emerald-500"
          }`}
          style={{
            width: "calc(var(--calc-bus-h) * 2.1)",
            height: "var(--calc-bus-h)",
            fontSize: "var(--calc-bus-input)",
            paddingRight: unit ? "1.35rem" : "0.25rem",
          }}
          aria-label={label}
        />
        {unit && (
          <span
            className="absolute right-1.5 font-bold text-slate-400 pointer-events-none"
            style={{ fontSize: "calc(var(--calc-bus-label) * 0.9)" }}
          >
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

export default function BusVoltagePanel({
  busVoltages,
  onChange,
  handleWheel,
  handleKeyDown,
  mode = "normal",
  allotment = "",
  onAllotmentChange,
}) {
  const isLS = mode === "loadShed";

  return (
    <section
      className={`border-b border-slate-200 ${isLS ? "bg-slate-100/90" : "bg-slate-50"}`}
      style={{
        paddingLeft: "var(--calc-section-px)",
        paddingRight: "var(--calc-section-px)",
        paddingTop: "var(--calc-bus-py)",
        paddingBottom: "var(--calc-bus-py)",
      }}
    >
      <div
        className={`grid ${isLS ? "grid-cols-3" : "grid-cols-2"}`}
        style={{ gap: "var(--calc-gap)" }}
      >
        <Field
          label="BUS-2"
          value={busVoltages.bus2}
          onChange={(v) => onChange("bus2", v)}
          handleWheel={handleWheel}
          handleKeyDown={handleKeyDown}
          unit="kV"
        />
        <Field
          label="BUS-1"
          value={busVoltages.bus1}
          onChange={(v) => onChange("bus1", v)}
          handleWheel={handleWheel}
          handleKeyDown={handleKeyDown}
          unit="kV"
        />
        {isLS && (
          <Field
            label="Allot"
            value={allotment}
            onChange={(v) => onAllotmentChange?.(v)}
            handleWheel={handleWheel}
            handleKeyDown={handleKeyDown}
            placeholder="40"
            unit="MW"
            accent
          />
        )}
      </div>
    </section>
  );
}
