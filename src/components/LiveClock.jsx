"use client";

export default function LiveClock({ time }) {
  return (
    <div
      className="bg-zinc-900 text-emerald-400 text-center font-extrabold tracking-widest font-mono border-y border-zinc-800 uppercase"
      style={{ paddingTop: "var(--calc-clock-py)", paddingBottom: "var(--calc-clock-py)", fontSize: "var(--calc-clock-size)" }}
    >
      <span
        className="inline-block bg-zinc-950/60 rounded-md border border-zinc-800/80 shadow-sm"
        style={{ paddingLeft: "0.75rem", paddingRight: "0.75rem", paddingTop: "0.125rem", paddingBottom: "0.125rem" }}
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
