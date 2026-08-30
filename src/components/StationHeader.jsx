"use client";

import { useState } from "react";
import { APP_META } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import LoginModal from "./LoginModal";
import toast from "react-hot-toast";

function LogOutIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export default function StationHeader() {
  const [showLogin, setShowLogin] = useState(false);
  const { isAuthenticated, login, logout, loading } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out");
    } catch {
      toast.error("Logout failed");
    }
  };

  return (
    <>
      <header className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white px-3 md:px-6 py-3 md:py-4 flex items-center justify-between gap-3 md:gap-4 shadow-md">
        <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
          <img
            src={APP_META.logoUrl}
            alt="WZPDCL Logo"
            className="w-11 h-11 md:w-14 md:h-14 object-contain bg-white rounded-full p-0.5 shadow-md border border-emerald-600 flex-shrink-0"
          />
          <div className="text-left min-w-0">
            <h1 className="text-sm sm:text-base md:text-lg font-bold tracking-wide uppercase leading-snug">
              {APP_META.shortTitle}
            </h1>
            <p className="text-[11px] md:text-sm text-emerald-100 font-medium opacity-95 leading-snug">
              {APP_META.subtitle}
            </p>
            <p className="text-[9px] md:text-xs mt-0.5 font-semibold tracking-wider text-teal-200/90 uppercase">
              {APP_META.tagline}
            </p>
          </div>
        </div>

        <div className="flex items-center shrink-0">
          {loading ? (
            <span className="text-[10px] font-medium text-emerald-200/70 px-2">
              …
            </span>
          ) : isAuthenticated ? (
            <button
              type="button"
              onClick={handleLogout}
              title="Logout"
              aria-label="Logout"
              className="p-2 rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/20"
            >
              <LogOutIcon className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowLogin(true)}
              className="px-3.5 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-md text-[11px] md:text-xs font-medium transition-colors border border-white/25"
            >
              Login
            </button>
          )}
        </div>
      </header>

      <LoginModal
        open={showLogin}
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onLogin={login}
      />
    </>
  );
}