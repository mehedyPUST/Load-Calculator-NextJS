// frontend/components/ActionBar.jsx
"use client";

import { useAuth } from "@/hooks/useAuth";

const calcOnlyClass =
  "h-10 md:h-12 rounded-xl font-extrabold text-[10px] md:text-xs tracking-wide uppercase leading-tight px-1.5 shadow-md active:scale-[0.97] transition-all duration-200 ease-out disabled:opacity-55 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0 bg-emerald-600 text-white border border-emerald-500/80 hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-600/30 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-1";

const calcSaveClass =
  "h-10 md:h-12 rounded-xl font-extrabold text-[10px] md:text-xs tracking-wide uppercase leading-tight px-1.5 shadow-md active:scale-[0.97] transition-all duration-200 ease-out disabled:opacity-55 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0 bg-teal-700 text-white border border-teal-600/80 hover:bg-teal-600 hover:shadow-lg hover:shadow-teal-700/30 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-1";

const copyClass =
  "h-10 md:h-12 rounded-xl font-extrabold text-[10px] md:text-xs tracking-wide uppercase leading-tight px-1.5 shadow-md active:scale-[0.97] transition-all duration-200 ease-out bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 hover:shadow-lg hover:shadow-slate-900/40 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1";

const historyClass =
  "w-full h-9 md:h-10 rounded-xl font-bold text-xs md:text-sm tracking-wide uppercase border-2 border-slate-200 text-slate-600 bg-white hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 hover:shadow-md hover:shadow-emerald-500/10 active:scale-[0.98] transition-all duration-200 ease-out focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-1";

export default function ActionBar({
  onCalculateOnly,
  onCalculateAndSave,
  onCopy,
  onHistory,
  isSaving,
}) {
  const { isAuthenticated } = useAuth();

  return (
    <section className="px-2 md:px-4 pb-2 space-y-2">
      <div className="grid grid-cols-3 gap-1.5 md:gap-2.5">
        <button
          type="button"
          onClick={onCalculateOnly}
          disabled={isSaving}
          className={calcOnlyClass}
        >
          Calculate Only
          <span className="block text-[7px] md:text-[8px] opacity-60 font-normal normal-case tracking-normal">
            ⇧⌘Enter
          </span>
        </button>
        <button
          type="button"
          onClick={onCalculateAndSave}
          disabled={isSaving || !isAuthenticated}
          className={calcSaveClass}
          title={!isAuthenticated ? "Please login to save calculations" : ""}
        >
          {isSaving ? "Saving…" : "Calculate & Save"}
          <span className="block text-[7px] md:text-[8px] opacity-60 font-normal normal-case tracking-normal">
            {!isAuthenticated ? "🔒 Login required" : "⌘Enter"}
          </span>
        </button>
        <button type="button" onClick={onCopy} className={copyClass}>
          Copy Total
          <span className="block text-[7px] md:text-[8px] opacity-60 font-normal normal-case tracking-normal">
            ⌘C
          </span>
        </button>
      </div>

      {!isAuthenticated && (
        <p className="text-center text-[10px] font-medium text-amber-600 bg-amber-50 py-1 rounded-lg border border-amber-200">
          🔒 Login required to save, delete, or restore calculations
        </p>
      )}

      <button type="button" onClick={onHistory} className={historyClass}>
        View Saved History
        <span className="ml-1.5 text-[9px] opacity-40 font-normal normal-case tracking-normal">
          ⌘H
        </span>
      </button>
    </section>
  );
}