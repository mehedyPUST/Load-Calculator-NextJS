"use client";

/**
 * Modal when saving an hourly slot that already has data for that day.
 * Actions: Proceed (replace) | Calculate only | Keep previous data
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
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 pt-5 pb-3">
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
            className="w-full px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {loading ? "Saving…" : "Proceed — replace existing data"}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onCalculateOnly}
            className="w-full px-4 py-2.5 rounded-xl text-sm font-bold text-slate-800 bg-white border border-slate-200 hover:bg-slate-100 active:scale-[0.98] transition-all disabled:opacity-60"
          >
            Calculate only
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onKeepPrevious}
            className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 active:scale-[0.98] transition-all disabled:opacity-60"
          >
            Keep previous data
          </button>
        </div>
      </div>
    </div>
  );
}
