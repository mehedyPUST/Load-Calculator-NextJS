"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ManualEntryView from "@/components/ManualEntryView";
import { useAuth } from "@/hooks/useAuth";
import LoginModal from "@/components/LoginModal";

function ManualInner() {
  const search = useSearchParams();
  const date = search.get("date") || undefined;
  const editId = search.get("edit") || null;
  const { isAuthenticated, loading, login } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  const initialDay = useMemo(() => date || undefined, [date]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
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
            Manual entry and data changes (save, update, delete) are only
            available to authenticated operators.
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
          Manual Input
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Fill empty hourly slots or update existing data. Each hour has its own
          BUS-1 / BUS-2 voltages. Toggle Amps / MW — the other is calculated
          automatically.
        </p>
      </div>
      <div className="page-panel">
        <ManualEntryView initialDay={initialDay} editRecordId={editId} />
      </div>
    </div>
  );
}

export default function ManualPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <ManualInner />
    </Suspense>
  );
}
