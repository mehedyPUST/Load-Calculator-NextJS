"use client";

export default function LiveClock({ time }) {
  return (
    <div className="bg-zinc-900 text-emerald-400 text-center py-1.5 md:py-3 text-xs md:text-sm font-extrabold tracking-widest font-mono border-y border-zinc-800 uppercase">
      <span
        className="inline-block bg-zinc-950/60 px-3 md:px-4 py-0.5 md:py-1 rounded-md border border-zinc-800/80 shadow-sm"
        suppressHydrationWarning
      >
        <span className="opacity-70 mr-1.5" aria-hidden>
          ⏱
        </span>
        <span suppressHydrationWarning>{time ?? "—"}</span>
      </span>
    </div>
  );
}
