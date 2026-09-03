"use client";

export default function LiveClock({ time }) {
  return (
    <div className="bg-zinc-900 text-emerald-400 text-center py-1 md:py-1.5 text-[10px] md:text-xs font-extrabold tracking-widest font-mono border-y border-zinc-800 uppercase">
      <span
        className="inline-block bg-zinc-950/60 px-2.5 md:px-3 py-0.5 rounded-md border border-zinc-800/80 shadow-sm"
        suppressHydrationWarning
      >
        <span className="opacity-70 mr-1" aria-hidden>
          ⏱
        </span>
        <span suppressHydrationWarning>{time ?? "—"}</span>
      </span>
    </div>
  );
}
