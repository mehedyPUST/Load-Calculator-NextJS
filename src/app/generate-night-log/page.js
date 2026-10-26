"use client";

import { Suspense } from "react";
import RestTimeDataView from "@/components/RestTimeDataView";

function NightLogInner() {
  return (
    <div className="flex-1 flex flex-col min-h-0 w-full">
      {/* Title bar — compact on mobile like history chrome */}
      <div className="shrink-0 px-3 sm:px-5 lg:px-6 pt-2 sm:pt-3 pb-1.5">
        <h1 className="text-base sm:text-lg font-semibold text-white tracking-tight">
          Generate Night Logs
        </h1>
        <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
          Enter 00:00 &amp; 08:00 · generate 01:00–07:00 · edit if needed · save
        </p>
      </div>

      {/* Same height formula as History → Logsheet */}
      <div className="flex-1 min-h-0 w-full max-w-[1600px] mx-auto px-2 sm:px-5 lg:px-6 pb-2">
        <div className="h-[calc(100dvh-var(--shell-chrome-h,0px)-5.5rem)] sm:h-[calc(100dvh-var(--shell-chrome-h,0px)-6.25rem)] md:h-[calc(100dvh-var(--shell-chrome-h,0px)-6.75rem)]">
          <RestTimeDataView />
        </div>
      </div>
    </div>
  );
}

export default function GenerateNightLogPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <NightLogInner />
    </Suspense>
  );
}
