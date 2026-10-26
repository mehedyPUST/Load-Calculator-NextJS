"use client";

import { Suspense, useState } from "react";
import LoadShedEntryView from "@/components/LoadShedEntryView";
import { useAuth } from "@/hooks/useAuth";
import LoginModal from "@/components/LoginModal";

function LoadShedInner() {
  const { isAuthenticated, loading, login } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  if (loading) {
    return (
      <div className="page-frame">
        <SkeletonTable rows={8} columns={6} dark />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex-1 min-h-0 max-w-lg mx-auto w-full px-4 py-16 text-center">
        <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-8 shadow-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-400 mb-3">
            Restricted
          </p>
          <h1 className="text-xl font-semibold text-white tracking-tight">
            Sign in required
          </h1>
          <p className="mt-3 text-sm text-slate-400 leading-relaxed">
            Load-shed entry and allotment changes are only available to
            authenticated operators.
          </p>
          <button
            type="button"
            onClick={() => setShowLogin(true)}
            className="mt-6 inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 shadow-md transition-colors"
          >
            Sign in
          </button>
        </div>
        <LoginModal
          open={showLogin}
          onClose={() => setShowLogin(false)}
          onLogin={async (username, password) => {
            await login(username, password);
            setShowLogin(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="page-frame">
      <div className="mb-2 shrink-0">
        <h1 className="text-base sm:text-lg font-semibold text-white tracking-tight">
          Load Shed Entry
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Enter grid allotment and LS MW per feeder for each time slot. Demand = Total + LS.
          Total (Consumption) comes from Calculator / Manual Input. Remaining shortage after LS
          is allowed when full shed cannot be imposed.
        </p>
      </div>
      <div className="page-panel">
        <LoadShedEntryView />
      </div>
    </div>
  );
}

import SkeletonTable from "@/components/SkeletonTable";

export default function LoadShedPage() {
  return (
    <Suspense
      fallback={
        <div className="page-frame">
          <SkeletonTable rows={8} columns={6} dark />
        </div>
      }
    >
      <LoadShedInner />
    </Suspense>
  );
}
