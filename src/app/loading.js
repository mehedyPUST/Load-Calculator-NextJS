export default function Loading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-[60vh] w-full animate-in fade-in duration-200">
      <div className="relative flex items-center justify-center">
        {/* Outer glowing pulsing ring */}
        <div className="w-14 h-14 rounded-full border border-emerald-500/20 bg-emerald-500/5 animate-pulse" />
        {/* Spinning gradient ring */}
        <div className="absolute w-10 h-10 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin" />
        {/* Core telemetry dot */}
        <div className="absolute w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />
      </div>

      <div className="mt-5 text-center space-y-1.5">
        <div className="text-sm font-semibold tracking-tight text-slate-200">
          Loading Station Data
        </div>
        <p className="text-xs text-slate-400 font-mono">
          Synchronizing Bottail 33/11 kV telemetry…
        </p>
      </div>

      {/* Shimmer skeleton bar for subtle visual progress */}
      <div className="mt-6 w-48 h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 rounded-full animate-pulse w-full" />
      </div>
    </div>
  );
}
