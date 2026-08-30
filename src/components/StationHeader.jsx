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
      <header className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white px-3 md:px-4 py-3 md:py-4 grid grid-cols-[auto_1fr_auto] items-center gap-2 md:gap-4 shadow-md">
        {/* Column 1 — Logo (near left border) */}
        <div className="flex items-center justify-start">
          <img
            src={APP_META.logoUrl}
            alt="WZPDCL Logo"
            className="w-10 h-10 md:w-12 md:h-12 object-contain bg-white rounded-full p-0.5 shadow-md border border-emerald-600"
          />
        </div>

        {/* Column 2 — Header texts (single line each, centered) */}
        <div className="flex flex-col items-center justify-center text-center min-w-0 overflow-hidden">
          <h1 className="text-xs sm:text-sm md:text-base font-bold tracking-wide uppercase leading-tight whitespace-nowrap">
            {APP_META.shortTitle}
          </h1>
          <p className="text-[10px] sm:text-[11px] md:text-xs text-emerald-100 font-medium opacity-95 leading-tight whitespace-nowrap">
            {APP_META.subtitle}
          </p>
          <p className="text-[8px] sm:text-[9px] md:text-[10px] mt-0.5 font-semibold tracking-wider text-teal-200/90 uppercase leading-tight whitespace-nowrap">
            {APP_META.tagline}
          </p>
        </div>

        {/* Column 3 — Login / Logout (near right border) */}
        <div className="flex items-center justify-end">
          {loading ? (
            <span className="text-[10px] font-medium text-emerald-200/70 px-1">
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
              className="px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-md text-[11px] md:text-xs font-medium transition-colors border border-white/25"
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