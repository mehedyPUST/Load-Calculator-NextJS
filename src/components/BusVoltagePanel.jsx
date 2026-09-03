"use client";

function VoltageField({ label, value, onChange, handleWheel, handleKeyDown }) {
  return (
    <div className="relative flex items-center justify-between bg-white rounded-lg shadow-sm border border-slate-200 hover:border-emerald-500 transition-colors group"
      style={{ paddingLeft: "0.5rem", paddingRight: "0.5rem", paddingTop: "calc(var(--calc-bus-py) * 0.5)", paddingBottom: "calc(var(--calc-bus-py) * 0.5)" }}
    >
      <label
        className="font-bold text-slate-600 tracking-wide mr-1 group-hover:text-emerald-700 shrink-0"
        style={{ fontSize: "var(--calc-bus-label)" }}
      >
        {label}
      </label>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0.00"
        onWheel={handleWheel}
        onKeyDown={handleKeyDown}
        className="bg-slate-50 border border-slate-200 rounded-md text-center font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 focus:bg-white transition-all font-mono"
        style={{
          width: "calc(var(--calc-bus-h) * 2.2)",
          height: "var(--calc-bus-h)",
          fontSize: "var(--calc-bus-input)",
        }}
        aria-label={label}
      />
    </div>
  );
}

export default function BusVoltagePanel({
  busVoltages,
  onChange,
  handleWheel,
  handleKeyDown,
}) {
  return (
    <section
      className="grid grid-cols-2 bg-slate-50 border-b border-slate-200"
      style={{
        paddingLeft: "var(--calc-section-px)",
        paddingRight: "var(--calc-section-px)",
        paddingTop: "var(--calc-bus-py)",
        paddingBottom: "var(--calc-bus-py)",
        gap: "var(--calc-gap)",
      }}
    >
      <VoltageField
        label="BUS-2 (kV)"
        value={busVoltages.bus2}
        onChange={(v) => onChange("bus2", v)}
        handleWheel={handleWheel}
        handleKeyDown={handleKeyDown}
      />
      <VoltageField
        label="BUS-1 (kV)"
        value={busVoltages.bus1}
        onChange={(v) => onChange("bus1", v)}
        handleWheel={handleWheel}
        handleKeyDown={handleKeyDown}
      />
    </section>
  );
}
