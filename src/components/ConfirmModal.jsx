"use client";

export default function ConfirmModal({
  open,
  title = "Confirm",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onCancel?.();
      }}
    >
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 pt-5 pb-2">
          <h3
            id="confirm-title"
            className="text-base font-black text-slate-800 tracking-tight"
          >
            {title}
          </h3>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed font-medium">
            {message}
          </p>
        </div>
        <div className="px-5 py-4 flex gap-3 justify-end bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 bg-white border border-slate-200
              hover:bg-slate-100 hover:border-slate-300 hover:shadow-sm
              active:scale-[0.97] transition-all duration-150 ease-out cursor-pointer
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-sm font-bold text-white shadow-sm
              active:scale-[0.97] transition-all duration-150 ease-out cursor-pointer
              disabled:opacity-60 disabled:cursor-not-allowed
              ${danger
                ? "bg-red-600 hover:bg-red-700 hover:shadow-md hover:shadow-red-600/30"
                : "bg-emerald-600 hover:bg-emerald-700 hover:shadow-md hover:shadow-emerald-600/30"
              }`}
          >
            {loading ? "Please wait…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}