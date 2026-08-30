"use client";

import { useState } from "react";
import { APP_META } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import LoginModal from "./LoginModal";
import toast from "react-hot-toast";

export default function StationHeader() {
  const [showLogin, setShowLogin] = useState(false);
  const { isAuthenticated, admin, login, logout, loading } = useAuth();

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
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <img
            src={APP_META.logoUrl}
            alt="WZPDCL Logo"
            className="w-11 h-11 md:w-14 md:h-14 object-contain bg-white rounded-full p-0.5 shadow-md border border-emerald-600 flex-shrink-0"
          />
          <div className="text-left min-w-0">
            <h1 className="text-sm md:text-lg font-black tracking-wide uppercase leading-tight truncate">
              {APP_META.shortTitle}
            </h1>
            <p className="text-[11px] md:text-sm text-emerald-100 font-semibold opacity-95">
              {APP_META.subtitle}
            </p>
            <p className="text-[9px] md:text-xs mt-0.5 font-bold tracking-widest text-teal-300 uppercase">
              {APP_META.tagline}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {loading ? (
            <span className="text-[10px] font-medium text-emerald-200/70 px-2">
              …
            </span>
          ) : isAuthenticated ? (
            <div className="flex items-center gap-2.5">
              <div className="hidden sm:flex items-center gap-2 bg-white/10 rounded-full pl-1 pr-3 py-1 border border-white/15">
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-[11px] font-semibold text-white uppercase tracking-wide">
                  {(admin?.username || "A").charAt(0)}
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-[12px] font-medium text-white">
                    {admin?.username || "Admin"}
                  </span>
                  {admin?.role ? (
                    <span className="text-[9px] text-emerald-200/90 font-normal capitalize">
                      {admin.role}
                    </span>
                  ) : null}
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-md text-[11px] font-medium transition-colors border border-white/20"
              >
                Logout
              </button>
            </div>
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