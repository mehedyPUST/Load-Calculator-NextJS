"use client";

import { navigateInputsByArrow } from "@/lib/inputNav";

function Field({
  label,
  value,
  onChange,
  handleWheel,
  handleKeyDown,
  placeholder = "-",
  unit,
  tone = "emerald",
  required = false,
  navRow = 0,
  navCol = 0,
}) {
  const cardCls =
    tone === "amber"
      ? "bg-amber-950/35 border-amber-500/30 hover:border-amber-400/60"
      : tone === "purple"
        ? "bg-purple-950/25 border-purple-500/25 hover:border-purple-400/50"
        : tone === "sky"
          ? "bg-sky-950/25 border-sky-500/25 hover:border-sky-400/50"
          : "bg-slate-800/70 border-app hover:border-emerald-400/50";

  const labelCls =
    tone === "amber"
      ? "text-amber-300"
      : tone === "purple"
        ? "text-purple-300"
        : tone === "sky"
          ? "text-sky-300"
          : "text-slate-300";

  const inputCls =
    tone === "amber"
      ? "bg-slate-950/90 border-amber-500/35 text-amber-100 focus:ring-amber-500/35 focus:border-amber-400"
      : tone === "purple"
        ? "bg-slate-950/90 border-purple-500/30 text-white focus:ring-purple-500/35 focus:border-purple-400"
        : tone === "sky"
          ? "bg-slate-950/90 border-sky-500/30 text-white focus:ring-sky-500/35 focus:border-sky-400"
          : "bg-slate-950/90 border-app text-white focus:ring-emerald-500/35 focus:border-emerald-400";

  return (
    <div
      className={`relative flex items-center justify-between rounded-xl shadow-sm border transition-all duration-200 group ${cardCls}`}
      style={{
        paddingLeft: "0.45rem",
        paddingRight: "0.45rem",
        paddingTop: "calc(var(--calc-bus-py) * 0.45)",
        paddingBottom: "calc(var(--calc-bus-py) * 0.45)",
      }}
    >
      <label
        className={`font-bold tracking-wide mr-1 shrink-0 ${labelCls}`}
        style={{ fontSize: "var(--calc-bus-label)" }}
      >
        {label}
        {required && (
          <span className="text-rose-400 ml-0.5" title="Mandatory field" aria-hidden="true">
            *
          </span>
        )}
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
          required={required}
          aria-required={required || undefined}
          onWheel={handleWheel}
          onKeyDown={(e) => {
            if (navigateInputsByArrow(e)) return;
            handleKeyDown?.(e);
          }}
          className={`border rounded-md text-center font-bold placeholder:text-slate-500 placeholder:font-normal focus:placeholder:text-transparent focus:outline-none focus:ring-2 focus:bg-slate-950 transition-all font-mono tabular-nums ${inputCls}`}
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
      className="border-b border-app bg-slate-900/60"
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
          placeholder="-"
          unit="kV"
          tone="purple"
          required
          navRow={-1}
          navCol={0}
        />
        <Field
          label="BUS-1"
          value={busVoltages.bus1}
          onChange={(v) => onChange("bus1", v)}
          handleWheel={handleWheel}
          handleKeyDown={handleKeyDown}
          placeholder="-"
          unit="kV"
          tone="sky"
          required
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
            placeholder="-"
            unit="MW"
            tone="amber"
            required
            navRow={-1}
            navCol={2}
          />
        )}
      </div>
    </section>
  );
}
