"use client";

import KushtiaDistrictLoadView from "@/components/KushtiaDistrictLoadView";

export default function KushtiaDistrictLoadPage() {
  return (
    <div className="page-frame">
      <div className="mb-2 shrink-0">
        <h1 className="text-base sm:text-lg font-semibold text-white tracking-tight">
          Kushtia District Load
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Operational day · Bottail + Bheramara · Circle Load rules
        </p>
      </div>
      <div className="page-panel">
        <KushtiaDistrictLoadView />
      </div>
    </div>
  );
}
