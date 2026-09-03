"use client";

const inputClass =
  "w-14 md:w-20 h-7 md:h-8 bg-slate-50 border border-slate-200 rounded-md md:rounded-lg text-center text-[11px] md:text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 focus:bg-white transition-all font-mono";

function VoltageField({ label, value, onChange, handleWheel, handleKeyDown }) {
  return (
    <div className="relative flex items-center justify-between bg-white px-2 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl shadow-sm border border-slate-200 hover:border-emerald-500 transition-colors group">
      <label className="text-[10px] md:text-xs font-bold text-slate-600 tracking-wide mr-1 group-hover:text-emerald-700 shrink-0">
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
        className={inputClass}
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
    <section className="px-2 md:px-4 py-1.5 md:py-2 grid grid-cols-2 gap-1.5 md:gap-2 bg-slate-50 border-b border-slate-200">
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
