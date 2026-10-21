"use client";

import { useEffect } from "react";

/**
 * Modal when saving an hourly slot that already has data for that day.
 * Actions: Proceed (replace) | Calculate only | Cancel / Keep previous
 * Close via X, Esc, backdrop click, or Cancel.
 */
export default function SlotConflictModal({
  open,
  slotLabel,
  dateLabel,
  existingTotalMW,
  existingTime,
  loading = false,
  onProceed,
  onCalculateOnly,
  onKeepPrevious,
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape" && !loading) {
        e.preventDefault();
        onKeepPrevious?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, loading, onKeepPrevious]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/55 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="slot-conflict-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onKeepPrevious?.();
      }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden relative">
        <button
          type="button"
          disabled={loading}
          onClick={() => onKeepPrevious?.()}
          aria-label="Close"
          title="Close (Esc)"
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-4 h-4" aria-hidden>
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="px-5 pt-5 pb-3 pr-12">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-lg font-bold">
              !
            </div>
            <div className="min-w-0">
              <h3
                id="slot-conflict-title"
                className="text-base font-bold text-slate-900 tracking-tight"
              >
                Existing data for this slot
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                There is already saved data for slot{" "}
                <span className="font-mono font-semibold text-slate-900">
                  {slotLabel}
                </span>{" "}
                on{" "}
                <span className="font-semibold text-slate-900">{dateLabel}</span>.
              </p>
              {(existingTotalMW != null || existingTime) && (
                <p className="mt-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                  Previous:{" "}
                  {existingTotalMW != null && (
                    <span className="font-semibold text-slate-700">
                      {(Math.round((Number(existingTotalMW) + Number.EPSILON) * 10) / 10).toFixed(1)} MW
                    </span>
                  )}
                  {existingTime && (
                    <span className="ml-1">· saved at {existingTime}</span>
                  )}
                </p>
              )}
              <p className="mt-3 text-sm text-slate-600">
                Do you want to replace the existing data with this calculation?
              </p>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 flex flex-col gap-2 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            disabled={loading}
            onClick={onProceed}
            className="w-full px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer"
          >
            {loading ? "Saving…" : "Proceed — replace existing data"}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onCalculateOnly}
            className="w-full px-4 py-2.5 rounded-xl text-sm font-bold text-slate-800 bg-white border border-slate-200 hover:bg-slate-100 active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer"
          >
            Calculate only
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onKeepPrevious}
            className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:text-slate-800 hover:bg-slate-100 active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer"
          >
            Cancel — keep previous data
          </button>
        </div>
      </div>
    </div>
  );
}
