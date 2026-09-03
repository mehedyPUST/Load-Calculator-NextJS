"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import LoginModal from "./LoginModal";

const btnBase =
  "rounded-lg font-extrabold tracking-wide uppercase leading-tight shadow-md active:scale-[0.97] transition-all duration-200 ease-out cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0 focus-visible:ring-2 focus-visible:ring-offset-1";

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

  const btnStyle = {
    height: "var(--calc-btn-h)",
    fontSize: "var(--calc-btn-text)",
    paddingLeft: "0.25rem",
    paddingRight: "0.25rem",
  };

  return (
    <section
      className="flex flex-col"
      style={{
        paddingLeft: "var(--calc-section-px)",
        paddingRight: "var(--calc-section-px)",
        paddingBottom: "var(--calc-gap)",
        gap: "var(--calc-gap)",
      }}
    >
      <div className="grid grid-cols-3" style={{ gap: "var(--calc-gap)" }}>
        <button
          type="button"
          onClick={onCalculateOnly}
          disabled={isSaving}
          className={`${btnBase} bg-emerald-600 text-white border border-emerald-500/80 hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-600/30 hover:-translate-y-0.5 focus-visible:ring-emerald-400`}
          style={btnStyle}
        >
          Calculate Only
        </button>
        <button
          type="button"
          onClick={handleSaveClick}
          disabled={isSaving}
          className={`${btnBase} bg-teal-700 text-white border border-teal-600/80 hover:bg-teal-600 hover:shadow-lg hover:shadow-teal-700/30 hover:-translate-y-0.5 focus-visible:ring-teal-400`}
          style={btnStyle}
        >
          {isSaving ? "Saving…" : "Calculate & Save"}
        </button>
        <button
          type="button"
          onClick={onCopy}
          className={`${btnBase} bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 hover:shadow-lg hover:shadow-slate-900/40 hover:-translate-y-0.5 focus-visible:ring-slate-400`}
          style={btnStyle}
        >
          Copy Total
        </button>
      </div>

      {!isAuthenticated && (
        <button
          type="button"
          onClick={() => setShowLogin(true)}
          className="w-full text-center font-medium text-amber-800 bg-amber-50 rounded-md border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
          style={{ fontSize: "var(--calc-btn-text)", paddingTop: "0.25rem", paddingBottom: "0.25rem" }}
        >
          Login required to save history — tap to sign in
        </button>
      )}

      <button
        type="button"
        onClick={onHistory}
        className="w-full rounded-lg font-bold tracking-wide uppercase border-2 border-slate-200 text-slate-600 bg-white hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 hover:shadow-md hover:shadow-emerald-500/10 active:scale-[0.98] transition-all duration-200 ease-out cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-1"
        style={{ height: "var(--calc-hist-h)", fontSize: "var(--calc-btn-text)" }}
      >
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
