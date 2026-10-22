"use client";

import { navigateInputsByArrow } from "@/lib/inputNav";

function Field({
  label,
  value,
  onChange,
  handleWheel,
  handleKeyDown,
  placeholder = "0.00",
  unit,
  accent = false,
  navRow = 0,
  navCol = 0,
}) {
  return (
    <div
      className={`relative flex items-center justify-between rounded-xl shadow-sm border transition-all duration-200 group ${
        accent
          ? "bg-amber-50/90 border-amber-200 hover:border-amber-400 hover:shadow-md hover:shadow-amber-100"
          : "bg-white border-slate-200/90 hover:border-emerald-400 hover:shadow-md hover:shadow-emerald-50"
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
          data-nav="1"
          data-nav-row={navRow}
          data-nav-col={navCol}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onWheel={handleWheel}
          onKeyDown={(e) => {
            if (navigateInputsByArrow(e)) return;
            handleKeyDown?.(e);
          }}
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
          navRow={-1}
          navCol={0}
        />
        <Field
          label="BUS-1"
          value={busVoltages.bus1}
          onChange={(v) => onChange("bus1", v)}
          handleWheel={handleWheel}
          handleKeyDown={handleKeyDown}
          unit="kV"
          navRow={-1}
          navCol={1}
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
            navRow={-1}
            navCol={2}
          />
        )}
      </div>
    </section>
  );
}
