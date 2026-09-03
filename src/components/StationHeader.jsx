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
      <header
        className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white grid grid-cols-[auto_1fr_auto] items-center shadow-md"
        style={{
          paddingLeft: "var(--calc-section-px)",
          paddingRight: "var(--calc-section-px)",
          paddingTop: "var(--calc-header-py)",
          paddingBottom: "var(--calc-header-py)",
          gap: "var(--calc-gap)",
        }}
      >
        <div className="flex items-center justify-start">
          <img
            src={APP_META.logoUrl}
            alt="WZPDCL Logo"
            className="object-contain bg-white rounded-full p-0.5 shadow-md border border-emerald-600"
            style={{ width: "var(--calc-logo)", height: "var(--calc-logo)" }}
          />
        </div>

        <div className="flex flex-col items-center justify-center text-center min-w-0 overflow-hidden gap-0">
          <h1
            className="font-bold tracking-wide uppercase leading-tight whitespace-nowrap"
            style={{ fontSize: "var(--calc-title)" }}
          >
            {APP_META.shortTitle}
          </h1>
          <p
            className="text-emerald-100 font-medium opacity-95 leading-tight whitespace-nowrap"
            style={{ fontSize: "var(--calc-sub)" }}
          >
            {APP_META.subtitle}
          </p>
          <p
            className="font-semibold tracking-wider text-teal-200/90 uppercase leading-tight whitespace-nowrap"
            style={{ fontSize: "var(--calc-tag)" }}
          >
            {APP_META.tagline}
          </p>
        </div>

        <div className="flex items-center justify-end">
          {loading ? (
            <span className="font-medium text-emerald-200/70 px-1" style={{ fontSize: "var(--calc-sub)" }}>
              …
            </span>
          ) : isAuthenticated ? (
            <button
              type="button"
              onClick={handleLogout}
              title="Logout"
              aria-label="Logout"
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/20 cursor-pointer"
            >
              <LogOutIcon className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowLogin(true)}
              className="px-2.5 py-1 bg-white/15 hover:bg-white/25 text-white rounded-lg font-medium transition-colors border border-white/25 cursor-pointer"
              style={{ fontSize: "var(--calc-sub)" }}
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
