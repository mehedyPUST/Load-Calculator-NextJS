"use client";

import { useEffect, useState } from "react";
import HistoryList from "./HistoryList";
import HistoryDetail from "./HistoryDetail";
import LogsheetView from "./LogsheetView";
import HistoryCalculatorEdit from "./HistoryCalculatorEdit";

/**
 * Calculator view (desktop):
 *   LEFT  = list
 *   MIDDLE = edit UI (Edit button)
 *   RIGHT  = view/detail UI (View button) — always rightmost
 */
export default function HistoryPage() {
  const [viewMode, setViewMode] = useState("logsheet");
  const [unitMode, setUnitMode] = useState("mw");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
      setViewMode("calculator");
    }
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full">
      <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-5 lg:px-6 pt-3 pb-2 flex flex-wrap items-center justify-between gap-2 shrink-0">
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
            onClick={() => {
              setViewMode("logsheet");
              setEditingRecord(null);
            }}
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

      <div className="flex-1 min-h-0 w-full max-w-[1600px] mx-auto px-3 sm:px-5 lg:px-6 pb-2">
        {viewMode === "logsheet" ? (
          <div className="h-[calc(100dvh-var(--shell-chrome-h,0px)-6.5rem)] md:h-[calc(100dvh-var(--shell-chrome-h,0px)-7rem)]">
            <LogsheetView refreshKey={refreshKey} unitMode={unitMode} />
          </div>
        ) : (
          <div className="h-[calc(100dvh-var(--shell-chrome-h,0px)-6.5rem)] md:h-[calc(100dvh-var(--shell-chrome-h,0px)-7rem)] flex flex-col md:flex-row gap-3 overflow-hidden relative">
            {/* LEFT — list (1/3) */}
            <div className="flex h-full min-w-0 flex-1 basis-0">
              <HistoryList
                open
                pageMode
                onClose={() => {}}
                onView={(r) => {
                  setSelectedRecord(r);
                }}
                onEdit={(r) => {
                  setEditingRecord(r);
                  setSelectedRecord(r);
                }}
                selectedId={selectedRecord?._id}
                refreshKey={refreshKey}
                onDeleted={(id) => {
                  if (id === "__all_trash__" || selectedRecord?._id === id) {
                    setSelectedRecord(null);
                  }
                  if (editingRecord?._id === id) setEditingRecord(null);
                  setRefreshKey((k) => k + 1);
                }}
              />
            </div>

            {/* MIDDLE — edit (desktop) */}
            <div
              className={`hidden md:flex h-full min-w-0 flex-1 basis-0 flex-col ${
                editingRecord ? "" : "pointer-events-none"
              }`}
            >
              {editingRecord ? (
                <div className="h-full min-h-0 flex flex-col rounded-lg border border-slate-600/50 bg-white overflow-hidden shadow-md">
                  <HistoryCalculatorEdit
                    key={editingRecord._id}
                    record={editingRecord}
                    onClose={() => setEditingRecord(null)}
                    onSaved={(saved) => {
                      setRefreshKey((k) => k + 1);
                      if (saved) {
                        setSelectedRecord(saved);
                        setEditingRecord((prev) =>
                          prev ? { ...prev, ...saved } : saved
                        );
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="h-full rounded-lg border border-dashed border-slate-700/80 bg-slate-900/20" />
              )}
            </div>

            {/* Mobile edit overlay — middle panel is hidden on small screens */}
            {editingRecord && (
              <div className="md:hidden absolute inset-0 z-30 flex flex-col bg-white rounded-lg overflow-hidden shadow-2xl border border-slate-300">
                <HistoryCalculatorEdit
                  key={`m-${editingRecord._id}`}
                  record={editingRecord}
                  onClose={() => setEditingRecord(null)}
                  onSaved={(saved) => {
                    setRefreshKey((k) => k + 1);
                    if (saved) {
                      setSelectedRecord(saved);
                      setEditingRecord((prev) =>
                        prev ? { ...prev, ...saved } : saved
                      );
                    }
                    setEditingRecord(null);
                  }}
                />
              </div>
            )}

            {/* RIGHT — view detail */}
            <div
              className={`${
                selectedRecord && !editingRecord ? "flex" : "hidden md:flex"
              } absolute inset-0 z-20 md:static md:z-auto h-full min-w-0 flex-1 basis-0`}
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
                    onEdit={() => setEditingRecord(selectedRecord)}
                  />
                </>
              ) : (
                <div className="hidden md:flex h-full w-full items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-800/30 text-slate-500 text-sm px-4 text-center">
                  Click View to open details
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
