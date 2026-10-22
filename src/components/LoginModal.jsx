"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";

/**
 * Props: open | isOpen (both supported)
 */
export default function LoginModal({
  open,
  isOpen,
  onClose,
  onLogin,
  loading: externalLoading,
}) {
  const visible = open ?? isOpen ?? false;
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (visible) {
      setError("");
      setUsername("");
      setPassword("");
    }
  }, [visible]);

  if (!visible) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password) {
      setError("Enter username and password.");
      return;
    }
    setBusy(true);
    try {
      await onLogin(username.trim(), password);
      toast.success("Login successful");
      setUsername("");
      setPassword("");
      onClose?.();
    } catch (err) {
      const msg = err?.message || "Login failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const disabled = busy || externalLoading;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !disabled) onClose?.();
      }}
    >
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl shadow-black/20 border border-slate-200/80 overflow-hidden">
        <div className="px-6 pt-6 pb-4 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.25),transparent_55%)]" />
          <div className="relative">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-400/90 mb-1.5">Secure access</p>
          <h3 id="login-title" className="text-lg font-semibold tracking-tight">
            Operator sign in
          </h3>
          <p className="text-xs text-slate-300 mt-1.5 font-medium leading-relaxed">
            Sign in to save history, edit records, and use manual entry.
          </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          {error ? (
            <p className="text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          ) : null}

          <div>
            <label
              htmlFor="login-username"
              className="block text-[11px] font-bold text-slate-500 uppercase mb-1"
            >
              Username or email
            </label>
            <input
              id="login-username"
              type="text"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={disabled}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 disabled:opacity-60"
              placeholder="admin"
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="block text-[11px] font-bold text-slate-500 uppercase mb-1"
            >
              Password
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={disabled}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 disabled:opacity-60"
              placeholder="••••••••"
            />
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              disabled={disabled}
              onClick={onClose}
              className="flex-1 h-10 rounded-xl text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={disabled}
              className="flex-1 h-10 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}