"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import LoginModal from "./LoginModal";

const calcOnlyClass =
  "h-10 md:h-12 rounded-xl font-extrabold text-[10px] md:text-xs tracking-wide uppercase leading-tight px-1.5 shadow-md active:scale-[0.97] transition-all duration-200 ease-out disabled:opacity-55 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0 bg-emerald-600 text-white border border-emerald-500/80 hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-600/30 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-1";

const calcSaveClass =
  "h-10 md:h-12 rounded-xl font-extrabold text-[10px] md:text-xs tracking-wide uppercase leading-tight px-1.5 shadow-md active:scale-[0.97] transition-all duration-200 ease-out disabled:opacity-55 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0 bg-teal-700 text-white border border-teal-600/80 hover:bg-teal-600 hover:shadow-lg hover:shadow-teal-700/30 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-1";

const copyClass =
  "h-10 md:h-12 rounded-xl font-extrabold text-[10px] md:text-xs tracking-wide uppercase leading-tight px-1.5 shadow-md active:scale-[0.97] transition-all duration-200 ease-out bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 hover:shadow-lg hover:shadow-slate-900/40 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1";

const historyClass =
  "w-full h-9 md:h-10 rounded-xl font-bold text-xs md:text-sm tracking-wide uppercase border-2 border-slate-200 text-slate-600 bg-white hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 hover:shadow-md hover:shadow-emerald-500/10 active:scale-[0.98] transition-all duration-200 ease-out focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-1";

export default function ActionBar({
  onCalculateOnly,
  onCalculateAndSave,
  onCopy,
  onHistory,
  isSaving,
}) {
  const { isAuthenticated, login } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  const handleSaveClick = () => {
    if (!isAuthenticated) {
      setShowLogin(true);
      return;
    }
    onCalculateAndSave?.();
  };

  return (
    <section className="px-2 md:px-4 pb-2 space-y-2">
      <div className="grid grid-cols-3 gap-1.5 md:gap-2.5">
        <button
          type="button"
          onClick={onCalculateOnly}
          disabled={isSaving}
          className={calcOnlyClass}
        >
          Calculate Only
        </button>
        <button
          type="button"
          onClick={handleSaveClick}
          disabled={isSaving}
          className={calcSaveClass}
          title={!isAuthenticated ? "Login required to save" : ""}
        >
          {isSaving
            ? "Saving…"
            : isAuthenticated
              ? "Calculate & Save"
              : "Save (Login)"}
        </button>
        <button type="button" onClick={onCopy} className={copyClass}>
          Copy Total
        </button>
      </div>

      {!isAuthenticated && (
        <button
          type="button"
          onClick={() => setShowLogin(true)}
          className="w-full text-center text-[10px] font-medium text-amber-800 bg-amber-50 py-2 rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors"
        >
          Login required to save, delete, or restore — tap to sign in
        </button>
      )}

      <button type="button" onClick={onHistory} className={historyClass}>
        View Saved History
      </button>

      <LoginModal
        open={showLogin}
        onClose={() => setShowLogin(false)}
        onLogin={login}
      />
    </section>
  );
}
