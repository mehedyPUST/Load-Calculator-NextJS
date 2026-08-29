// frontend/components/LoginModal.jsx
"use client";

import { useState } from "react";
import toast from "react-hot-toast";

export default function LoginModal({ isOpen, onClose, onLogin, loading }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username.trim() || !password.trim()) {
            toast.error("Please enter both username and password.");
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await onLogin(username.trim(), password.trim());
            if (result.success) {
                toast.success("Login successful!");
                setUsername("");
                setPassword("");
                onClose();
            } else {
                toast.error(result.error || "Login failed");
            }
        } catch (error) {
            toast.error(error.message || "Login failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={(e) => {
                if (e.target === e.currentTarget && !isSubmitting) onClose();
            }}
        >
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-700 to-teal-800 px-6 py-4">
                    <h2 className="text-xl font-black text-white tracking-wide">
                        Admin Login
                    </h2>
                    <p className="text-sm text-emerald-100 mt-1">
                        Sign in to manage calculations
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">
                            Username or Email
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter your username"
                            disabled={isSubmitting || loading}
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all disabled:opacity-50"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            disabled={isSubmitting || loading}
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all disabled:opacity-50"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting || loading}
                            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || loading}
                            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting || loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Logging in...
                                </span>
                            ) : (
                                "Login"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}