"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_META } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import LoginModal from "./LoginModal";
import AppNarrowFooter from "./AppNarrowFooter";
import toast from "react-hot-toast";
import { useLiveClock } from "@/hooks/useLiveClock";

const NAV_LINKS = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/calculator", label: "Calculator", icon: "calc" },
  { href: "/loadshed", label: "Load Shed", icon: "shed" },
  { href: "/manual", label: "Manual Input", icon: "manual" },
  { href: "/history", label: "History", icon: "hist" },
  { href: "/max-load", label: "Max Load", icon: "max" },
  { href: "/statistics", label: "Statistics", icon: "stats" },
];

function NavIcon({ name, className = "w-4 h-4" }) {
  const c = className;
  switch (name) {
    case "home":
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5 12 3l9 7.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-9.5z" />
        </svg>
      );
    case "calc":
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path strokeLinecap="round" d="M8 7h8M8 11h2m2 0h2m2 0h2M8 15h2m2 0h2m2 0h2" />
        </svg>
      );
    case "shed":
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    case "manual":
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      );
    case "hist":
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "max":
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 17l6-6 4 4 8-8M13 7h8v8" />
        </svg>
      );
    case "stats":
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    default:
      return null;
  }
}

/**
 * 4-grid application shell
 *
 *  ┌──────── Grid 1 ────────┬──────────── Grid 2 ────────────┐
 *  │ WZPDCL · Bottail SS    │ Company name + division        │
 *  │ Load Management        │                                │
 *  ├──────── Grid 3 ────────┼──────────── Grid 4 ────────────┤
 *  │ Nav links              │ Page content (children)        │
 *  └────────────────────────┴────────────────────────────────┘
 *
 * G1 & G2 same height · G3 & G4 same height
 * G1 & G3 same width · G2 & G4 same width
 */
export default function AppShell({ children }) {
  const pathname = usePathname();
  const [showLogin, setShowLogin] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, login, logout, loading } = useAuth();
  const currentTime = useLiveClock();
  const isCalculator =
    pathname === "/calculator" || pathname.startsWith("/calculator/");

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const isActive = (href) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Signed out successfully");
    } catch {
      toast.error("Sign out failed");
    }
  };

  const visibleLinks = NAV_LINKS.filter(
    (link) => link.href !== "/manual" || isAuthenticated
  );

  const linkList = (onNavigate) =>
    visibleLinks.map((link) => {
      const active = isActive(link.href);
      return (
        <Link
          key={link.href}
          href={link.href}
          onClick={onNavigate}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
            active
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/30"
              : "text-slate-400 hover:text-slate-100 hover:bg-white/[0.06]"
          }`}
        >
          <NavIcon name={link.icon} className="w-4 h-4 shrink-0 opacity-90" />
          <span>{link.label}</span>
        </Link>
      );
    });

  return (
    <div className="app-grid-shell">
      {/* ── Grid 1: App identity ── */}
      <div className="app-grid-1">
        <div className="flex items-center gap-2.5 min-w-0 h-full">
          <Link href="/" className="min-w-0 flex-1">
            <div className="text-[13px] sm:text-[14px] font-semibold text-white tracking-tight leading-tight">
              WZPDCL · Bottail SS
            </div>
            <div className="text-[10px] sm:text-[11px] text-emerald-400/90 font-semibold mt-0.5 uppercase tracking-[0.12em]">
              Load Management
            </div>
          </Link>
        </div>
      </div>

      {/* ── Grid 2: Company ── */}
      <div className="app-grid-2">
        <Link
          href="/"
          className="flex items-center gap-2.5 sm:gap-3 min-w-0 h-full"
        >
          <img
            src={APP_META.logoUrl}
            alt="WZPDCL"
            className="w-9 h-9 sm:w-10 sm:h-10 object-contain bg-white rounded-full p-[3px] shadow-md shadow-black/30 ring-1 ring-white/10 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="text-[12px] sm:text-[13px] md:text-[14px] font-semibold text-white tracking-tight leading-tight truncate">
              West Zone Power Distribution Company Limited
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-0.5 leading-tight truncate">
              Sales &amp; Distribution Division-1, Kushtia
            </div>
          </div>
        </Link>
        {/* Live clock — sits beside company name (esp. calculator) */}
        <div
          className="hidden md:flex items-center shrink-0 ml-auto mr-2"
          title="Station time"
        >
          <span className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-black/30 px-3 py-1.5 font-mono text-sm sm:text-base font-bold tracking-wider text-emerald-400 tabular-nums">
            <span className="opacity-70" aria-hidden>
              ⏱
            </span>
            <span suppressHydrationWarning>{currentTime ?? "—"}</span>
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          {loading ? null : isAuthenticated ? (
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-slate-300 hover:text-white hover:bg-white/[0.06] border border-white/[0.06] transition-colors"
            >
              Sign out
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowLogin(true)}
              className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-950/30 transition-colors"
            >
              Sign in
            </button>
          )}
        </div>
      </div>

      {/* ── Grid 3: Nav links (desktop) ── */}
      <aside className="app-grid-3" aria-label="Sidebar">
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {linkList()}
        </nav>
        <div className="px-3 py-3 border-t border-white/[0.06] shrink-0">
          {loading ? (
            <span className="text-xs text-slate-500 px-2">…</span>
          ) : isAuthenticated ? (
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-3 py-2 rounded-lg text-[12px] font-semibold text-slate-300 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06]"
            >
              Sign out
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowLogin(true)}
              className="w-full flex items-center justify-center px-3 py-2 rounded-lg text-[12px] font-semibold text-white bg-emerald-600 hover:bg-emerald-500"
            >
              Sign in
            </button>
          )}
        </div>
      </aside>

      {/* ── Grid 4: Page content ── */}
      {mobileOpen && !isCalculator && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="relative z-10 w-[min(18rem,85vw)] h-full bg-[#0d1526] border-r border-white/[0.08] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <div>
                <div className="text-[13px] font-semibold text-white">Menu</div>
                <div className="text-[10px] text-emerald-400/90 uppercase tracking-wider">Navigate</div>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="w-9 h-9 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.08]"
                aria-label="Close menu"
              >
                <svg className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
              {linkList(() => setMobileOpen(false))}
            </nav>
            <div className="px-3 py-3 border-t border-white/[0.06]">
              {loading ? null : isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center justify-center px-3 py-2 rounded-lg text-[12px] font-semibold text-slate-300 bg-white/[0.04] border border-white/[0.06]"
                >
                  Sign out
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    setShowLogin(true);
                  }}
                  className="w-full flex items-center justify-center px-3 py-2 rounded-lg text-[12px] font-semibold text-white bg-emerald-600"
                >
                  Sign in
                </button>
              )}
            </div>
          </aside>
        </div>
      )}

      <main className="app-grid-4">
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {!isCalculator && (
            <header className="lg:hidden sticky top-0 z-40 flex items-center gap-2 px-3 py-2.5 bg-[#0d1526] border-b border-white/[0.08] shrink-0">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-white bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08]"
                aria-label="Open menu"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <Link href="/" className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-white tracking-tight leading-tight truncate">
                  WZPDCL · Bottail SS
                </div>
                <div className="text-[10px] text-emerald-400/90 font-semibold uppercase tracking-[0.12em]">
                  Load Management
                </div>
              </Link>
              <Link
                href="/"
                className="shrink-0 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-emerald-300 bg-emerald-600/15 border border-emerald-500/30"
              >
                Home
              </Link>
            </header>
          )}
          <div className="flex-1 min-h-0 overflow-auto flex flex-col">{children}</div>
          {!isCalculator && <AppNarrowFooter />}
        </div>
      </main>

      
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
