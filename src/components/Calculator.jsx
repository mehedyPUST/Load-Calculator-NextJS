"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";

import StationHeader from "./StationHeader";
import LiveClock from "./LiveClock";
import BusVoltagePanel from "./BusVoltagePanel";
import FeederTable from "./FeederTable";
import ResultsPanel from "./ResultsPanel";
import ActionBar from "./ActionBar";
import AppFooter from "./AppFooter";
import HistoryList from "./HistoryList";
import HistoryDetail from "./HistoryDetail";
import ErrorBoundary from "./ErrorBoundary";

import {
  createInitialAmps,
  getFeederMW,
  buildCalculationResult,
} from "@/lib/calculations";
import { saveCalculation } from "@/lib/api";
import { enqueuePendingSave, isOfflineError } from "@/lib/offlineQueue";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import OfflineBadge from "./OfflineBadge";
import { useLiveClock } from "@/hooks/useLiveClock";
import { useNumberInputGuards } from "@/hooks/useNumberInputGuards";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

export default function Calculator() {
  const [busVoltages, setBusVoltages] = useState({ bus1: "", bus2: "" });
  const [amps, setAmps] = useState(createInitialAmps);
  const [calculated, setCalculated] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  const currentTime = useLiveClock();
  const { handleWheel, handleKeyDown } = useNumberInputGuards();

  const { pendingCount, syncing, online, syncPending, refreshCount } =
    useOfflineSync({
      enabled: true,
      onSynced: (n) => {
        toast.success(
          n === 1
            ? "1 offline save synced to server."
            : `${n} offline saves synced to server.`,
          { icon: "☁", style: { fontWeight: "bold" } }
        );
        setHistoryRefreshKey((k) => k + 1);
      },
    });

  // Define totals BEFORE using it in useEffect
  const totals = calculated
    ? buildCalculationResult(amps, busVoltages)
    : { totalMW: 0, bottail11kV: 0 };

  // Update tab title with MW when calculated
  useEffect(() => {
    if (calculated && totals.totalMW > 0) {
      document.title = `${Math.round(totals.totalMW)} MW | WZPDCL Load Calculator`;
    } else {
      document.title = "WZPDCL Load Calculator | Bottail-Kushtia";
    }

    return () => {
      document.title = "WZPDCL Load Calculator | Bottail-Kushtia";
    };
  }, [calculated, totals.totalMW]);

  const handleBusVoltageChange = (bus, value) => {
    setBusVoltages((prev) => ({ ...prev, [bus]: value }));
    setCalculated(false);
  };

  const handleAmpChange = (id, value) => {
    setAmps((prev) => ({ ...prev, [id]: value }));
    setCalculated(false);
  };

  const handleAmpBlur = (id) => {
    if (!amps[id] || amps[id].trim() === "") {
      setAmps((prev) => ({ ...prev, [id]: "0" }));
    }
  };

  const getDisplayMW = (id) => {
    if (!calculated) return null;
    const mw = getFeederMW(id, amps, busVoltages);
    return mw > 0 ? mw : null;
  };

  const validateVoltages = () => {
    if (!busVoltages.bus1.trim() || !busVoltages.bus2.trim()) {
      toast.error("Enter voltages for both BUS-1 and BUS-2.", {
        style: { fontWeight: "bold" },
      });
      return false;
    }
    return true;
  };

  const handleCalculateOnly = () => {
    if (!validateVoltages()) return;
    setCalculated(true);
    toast.success("Load calculated successfully.", {
      style: { fontWeight: "bold" },
    });
  };

  const queueOffline = async (payload) => {
    await enqueuePendingSave(payload);
    await refreshCount();
    setHistoryRefreshKey((k) => k + 1);
    setHistoryOpen(true);
    toast.success("Saved offline — see History (pending sync).", {
      icon: "📡",
      style: { fontWeight: "bold" },
      duration: 4500,
    });
  };

  const handleCalculateAndSave = async () => {
    if (!validateVoltages()) return;
    setCalculated(true);
    setIsSaving(true);
    const payload = buildCalculationResult(amps, busVoltages);

    // Browser already offline → skip network
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      try {
        await queueOffline(payload);
      } catch (qErr) {
        toast.error(qErr.message || "Could not save offline", {
          style: { fontWeight: "bold" },
        });
      } finally {
        setIsSaving(false);
      }
      return;
    }

    try {
      await saveCalculation(payload);
      toast.success("Calculation saved to database.", {
        icon: "💾",
        style: { fontWeight: "bold" },
      });
      setHistoryRefreshKey((k) => k + 1);
      await refreshCount();
    } catch (err) {
      const msg = String(err?.message || "");
      // Network failure → offline queue. Auth errors stay as errors.
      const authFail =
        msg.toLowerCase().includes("log in") ||
        msg.includes("401") ||
        msg.toLowerCase().includes("authentication");
      if (!authFail && (isOfflineError(err) || msg.includes("Cannot reach"))) {
        try {
          await queueOffline(payload);
        } catch (qErr) {
          toast.error(qErr.message || "Could not queue offline save", {
            style: { fontWeight: "bold" },
          });
        }
      } else {
        toast.error(err.message || "Save failed", {
          style: { fontWeight: "bold" },
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyTotal = async () => {
    const mwValue = calculated ? Math.round(totals.totalMW) : 0;
    const text = `Bottail : ${mwValue} MW`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Copied: ${text}`, {
        icon: "📋",
        style: { fontWeight: "bold" },
      });
    } catch {
      toast.error("Failed to copy text.");
    }
  };

  useKeyboardShortcuts({
    onCalculateOnly: handleCalculateOnly,
    onCalculateAndSave: handleCalculateAndSave,
    onCopy: handleCopyTotal,
    onHistory: () => setHistoryOpen(true),
    isSaving,
  });

  const closeHistory = () => {
    setHistoryOpen(false);
    setSelectedRecord(null);
  };

  return (
    <ErrorBoundary>
      <div className="h-[100dvh] md:min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-zinc-950 flex items-stretch justify-center p-0 md:p-3 antialiased overflow-hidden">

        <div className="w-full h-full max-w-[1440px] flex flex-row items-stretch gap-0 md:gap-3 overflow-hidden relative">
          {/* LEFT — history table */}
          <div
            className={`${historyOpen ? "flex" : "hidden"
              } absolute inset-0 z-40 md:static md:z-auto md:flex h-full`}
          >
            <HistoryList
              open={historyOpen}
              onClose={closeHistory}
              onView={setSelectedRecord}
              selectedId={selectedRecord?._id}
              refreshKey={historyRefreshKey}
              onDeleted={(id) => {
                if (id === "__all_trash__" || selectedRecord?._id === id) {
                  setSelectedRecord(null);
                }
              }}
            />
            {historyOpen && !selectedRecord && (
              <div
                className="flex-1 bg-black/40 md:hidden"
                onClick={closeHistory}
                aria-hidden
              />
            )}
          </div>

          {/* CENTER — main calculator */}
          <div className="flex-1 min-w-0 h-full flex justify-center">
            <div className="calc-shell w-full max-w-xl h-full bg-white rounded-none md:rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col border-0 md:border border-slate-200">
              <StationHeader onHistoryClick={() => setHistoryOpen(true)} />
              <div className="px-2 md:px-4 py-0.5 bg-slate-900/80 border-b border-slate-700/50 flex justify-end">
                <OfflineBadge
                  online={online}
                  pendingCount={pendingCount}
                  syncing={syncing}
                  onSyncNow={syncPending}
                />
              </div>
              <LiveClock time={currentTime} />

              <BusVoltagePanel
                busVoltages={busVoltages}
                onChange={handleBusVoltageChange}
                handleWheel={handleWheel}
                handleKeyDown={handleKeyDown}
              />

              <div className="flex-1 min-h-0 overflow-hidden">
                <FeederTable
                  amps={amps}
                  getDisplayMW={getDisplayMW}
                  onAmpChange={handleAmpChange}
                  onAmpBlur={handleAmpBlur}
                  handleWheel={handleWheel}
                  handleKeyDown={handleKeyDown}
                />
              </div>

              <div className="flex-shrink-0 bg-white pt-0.5">
                <ResultsPanel
                  calculate={calculated}
                  bottail11kV={totals.bottail11kV}
                  totalMW={totals.totalMW}
                />
                <ActionBar
                  onCalculateOnly={handleCalculateOnly}
                  onCalculateAndSave={handleCalculateAndSave}
                  onCopy={handleCopyTotal}
                  onHistory={() => setHistoryOpen(true)}
                  isSaving={isSaving}
                />
                <AppFooter />
              </div>
            </div>
          </div>

          {/* RIGHT — full detail after View */}
          <div
            className={`${selectedRecord ? "flex" : "hidden"
              } absolute inset-0 z-50 md:static md:z-auto md:flex h-full justify-end`}
          >
            {selectedRecord && !historyOpen && (
              <div
                className="flex-1 bg-black/40 md:hidden"
                onClick={() => setSelectedRecord(null)}
                aria-hidden
              />
            )}
            <HistoryDetail
              record={selectedRecord}
              onClose={() => setSelectedRecord(null)}
            />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}