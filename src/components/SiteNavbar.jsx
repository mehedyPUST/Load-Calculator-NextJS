"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_META } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import LoginModal from "./LoginModal";
import toast from "react-hot-toast";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/calculator", label: "Calculator" },
  { href: "/manual", label: "Manual" },
  { href: "/history", label: "History" },
  { href: "/max-load", label: "Max Load" },
  { href: "/statistics", label: "Statistics" },
];

function MenuIcon({ open }) {
  return open ? (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ) : (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export default function SiteNavbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const { isAuthenticated, login, logout, loading } = useAuth();

  // Close mobile drawer on route change — avoids layout jump
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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

  // On calculator / max-load, mobile chrome lives in StationHeader (hamburger next to logout)
  const isCalcChrome =
    pathname === "/calculator" ||
    pathname.startsWith("/calculator/") ||
    pathname === "/max-load" ||
    pathname.startsWith("/max-load/");

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full bg-[#0b1220]/80 backdrop-blur-xl border-b border-white/[0.06] shadow-[0_1px_0_0_rgba(255,255,255,0.03)] ${
          isCalcChrome ? "hidden md:block" : ""
        }`}
        style={{ height: "var(--site-nav-h)", minHeight: "var(--site-nav-h)" }}
      >
        <div className="h-full max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-full gap-3 min-w-0">
            {/* Brand — fixed footprint */}
            <Link
              href="/"
              className="flex items-center gap-2.5 min-w-0 shrink-0 h-full"
              onClick={() => setMobileOpen(false)}
            >
              <img
                src={APP_META.logoUrl}
                alt="WZPDCL"
                className="w-9 h-9 object-contain bg-white rounded-full p-[3px] shadow-md shadow-black/30 ring-1 ring-white/10 shrink-0"
              />
              <div className="min-w-0 hidden sm:block">
                <div className="text-[13px] font-semibold text-white tracking-tight leading-none whitespace-nowrap">
                  WZPDCL · Bottail
                </div>
                <div className="text-[10px] text-slate-500 font-medium mt-1 leading-none whitespace-nowrap uppercase tracking-[0.12em]">
                  Load Management
                </div>
              </div>
            </Link>

            {/* Desktop links — equal-ish width, no wrap */}
            <nav
              className="hidden md:flex items-center justify-center flex-1 min-w-0 gap-1 rounded-full bg-white/[0.03] p-1 border border-white/[0.04]"
              aria-label="Primary"
            >
              {NAV_LINKS.filter(
                (link) => link.href !== "/manual" || isAuthenticated
              ).map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-medium tracking-wide transition-all duration-200 whitespace-nowrap ${
                      active
                        ? "text-white bg-emerald-600 shadow-md shadow-emerald-950/40"
                        : "text-slate-400 hover:text-slate-100 hover:bg-white/[0.06]"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Auth — fixed min width so Sign in / Sign out doesn’t shift bar */}
            <div className="flex items-center gap-2 shrink-0 min-w-[5.5rem] justify-end">
              {loading ? (
                <span className="inline-flex items-center justify-center min-w-[4.5rem] h-8 text-xs text-slate-500">
                  …
                </span>
              ) : isAuthenticated ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="hidden sm:inline-flex items-center justify-center min-w-[4.5rem] h-8 px-3.5 rounded-full text-[12px] font-medium text-slate-300 border border-white/10 hover:bg-white/[0.06] hover:text-white transition-all"
                >
                  Sign out
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowLogin(true)}
                  className="hidden sm:inline-flex items-center justify-center min-w-[4.5rem] h-8 px-3.5 rounded-full text-[12px] font-semibold bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-950/40 transition-all"
                >
                  Sign in
                </button>
              )}

              <button
                type="button"
                className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-md text-slate-300 hover:bg-slate-800 hover:text-white border border-transparent hover:border-slate-700"
                onClick={() => setMobileOpen((v) => !v)}
                aria-expanded={mobileOpen}
                aria-label="Menu"
              >
                <MenuIcon open={mobileOpen} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu — overlay; skipped on calc chrome (hamburger is in StationHeader) */}
      {mobileOpen && !isCalcChrome && (
        <div className="md:hidden fixed inset-x-0 top-[var(--site-nav-h)] z-40 border-b border-white/[0.06] bg-[#0b1220]/95 backdrop-blur-xl shadow-2xl">
          <nav className="max-w-6xl mx-auto px-4 py-2" aria-label="Mobile">
            <ul className="flex flex-col gap-0.5">
              {NAV_LINKS.filter(
                (link) => link.href !== "/manual" || isAuthenticated
              ).map((link) => {
                const active = isActive(link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={`block px-3 py-2.5 rounded-md text-sm font-medium ${
                        active
                          ? "bg-emerald-600 text-white"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
              <li className="pt-2 mt-1 border-t border-slate-800">
                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-800"
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
                    className="w-full text-left px-3 py-2.5 rounded-md text-sm font-semibold text-emerald-400 hover:bg-slate-800"
                  >
                    Sign in
                  </button>
                )}
              </li>
            </ul>
          </nav>
        </div>
      )}

      <LoginModal
        open={showLogin}
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onLogin={login}
      />
    </>
  );
}
