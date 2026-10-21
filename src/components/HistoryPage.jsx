"use client";

import { useEffect, useState } from "react";
import HistoryList from "./HistoryList";
import HistoryDetail from "./HistoryDetail";
import LogsheetView from "./LogsheetView";

/**
 * History page: Calculator view (list+detail) or Logsheet (day × 26 slots).
 * Default: calculator on mobile, logsheet on large screens.
 * Logsheet unit: Amps view / MW view.
 */
export default function HistoryPage() {
  const [viewMode, setViewMode] = useState(null);
  const [unitMode, setUnitMode] = useState("mw"); // 'mw' | 'amps'
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setViewMode(mq.matches ? "calculator" : "logsheet");
  }, []);

  if (viewMode == null) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full">
      <div className="max-w-6xl mx-auto w-full px-3 sm:px-4 pt-3 pb-2 flex flex-wrap items-center justify-between gap-2">
        {/* Left: MW → Amps */}
        <div
          className={`inline-flex rounded-lg border border-slate-600/80 bg-slate-800/80 p-0.5 shadow-sm ${
            viewMode !== "logsheet" ? "opacity-40 pointer-events-none" : ""
          }`}
          role="tablist"
          aria-label="Logsheet unit"
        >
          <button
            type="button"
            role="tab"
            aria-selected={unitMode === "mw"}
            onClick={() => setUnitMode("mw")}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-colors ${
              unitMode === "mw"
                ? "bg-sky-600 text-white shadow"
                : "text-slate-300 hover:text-white"
            }`}
          >
            MW view
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={unitMode === "amps"}
            onClick={() => setUnitMode("amps")}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-colors ${
              unitMode === "amps"
                ? "bg-sky-600 text-white shadow"
                : "text-slate-300 hover:text-white"
            }`}
          >
            Amps view
          </button>
        </div>

        {/* Right: Calculator → Logsheet */}
        <div
          className="inline-flex rounded-lg border border-slate-600/80 bg-slate-800/80 p-0.5 shadow-sm"
          role="tablist"
          aria-label="History view mode"
        >
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "calculator"}
            onClick={() => setViewMode("calculator")}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-colors ${
              viewMode === "calculator"
                ? "bg-emerald-600 text-white shadow"
                : "text-slate-300 hover:text-white"
            }`}
          >
            Calculator view
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "logsheet"}
            onClick={() => setViewMode("logsheet")}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-colors ${
              viewMode === "logsheet"
                ? "bg-emerald-600 text-white shadow"
                : "text-slate-300 hover:text-white"
            }`}
          >
            Logsheet view
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 max-w-6xl mx-auto w-full px-3 sm:px-4 pb-4">
        {viewMode === "logsheet" ? (
          <div className="h-[calc(100dvh-7.5rem)] md:h-[calc(100dvh-8rem)]">
            <LogsheetView refreshKey={refreshKey} unitMode={unitMode} />
          </div>
        ) : (
          <div className="h-[calc(100dvh-7.5rem)] md:h-[calc(100dvh-8rem)] flex flex-row gap-3 overflow-hidden relative">
            <div className="flex h-full min-w-0 flex-1 md:flex-none md:w-[min(100%,480px)]">
              <HistoryList
                open
                pageMode
                onClose={() => {}}
                onView={setSelectedRecord}
                selectedId={selectedRecord?._id}
                refreshKey={refreshKey}
                onDeleted={(id) => {
                  if (id === "__all_trash__" || selectedRecord?._id === id) {
                    setSelectedRecord(null);
                  }
                  setRefreshKey((k) => k + 1);
                }}
              />
            </div>

            <div
              className={`${
                selectedRecord ? "flex" : "hidden md:flex"
              } absolute inset-0 z-20 md:static md:z-auto h-full flex-1 min-w-0 justify-end`}
            >
              {selectedRecord ? (
                <>
                  <div
                    className="flex-1 bg-black/50 md:hidden"
                    onClick={() => setSelectedRecord(null)}
                    aria-hidden
                  />
                  <HistoryDetail
                    record={selectedRecord}
                    onClose={() => setSelectedRecord(null)}
                  />
                </>
              ) : (
                <div className="hidden md:flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-800/30 text-slate-500 text-sm">
                  Select a record to view details
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
