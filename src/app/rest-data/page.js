"use client";

import { Suspense } from "react";
import RestTimeDataView from "@/components/RestTimeDataView";

function RestInner() {
  return (
    <div className="page-frame">
      <div className="mb-2 shrink-0">
        <h1 className="text-base sm:text-lg font-semibold text-white tracking-tight">
          Generate Resting Times Data
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Same sheet as Manual Input. Enter 00:00 &amp; 08:00, generate 01:00–07:00,
          modify if needed, then apply to Manual.
        </p>
      </div>
      <div className="page-panel">
        <RestTimeDataView />
      </div>
    </div>
  );
}

export default function RestDataPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <RestInner />
    </Suspense>
  );
}
