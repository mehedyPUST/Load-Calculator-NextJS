"use client";

import { APP_META } from "@/lib/constants";
import { useEffect, useState } from "react";
import { fetchCalculations } from "@/lib/api";

export default function StationHeader({ onHistoryClick }) {
  const [trashCount, setTrashCount] = useState(0);

  useEffect(() => {
    const fetchTrashCount = async () => {
      try {
        const result = await fetchCalculations({ trash: true, limit: 1 });
        setTrashCount(result.trashCount);
      } catch {
        // Silent fail
      }
    };
    fetchTrashCount();
    const interval = setInterval(fetchTrashCount, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white px-3 md:px-6 py-3 md:py-4 flex items-center justify-between gap-3 md:gap-4 shadow-md">
      <div className="flex items-center gap-3 md:gap-4">
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

      {/* Trash indicator - clickable */}
      {trashCount > 0 && (
        <button
          onClick={onHistoryClick}
          className="relative flex items-center gap-1.5 bg-red-600/90 hover:bg-red-600 text-white px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:scale-105 shadow-lg"
          aria-label="View trash"
        >
          <span className="text-base">🗑️</span>
          <span className="bg-white text-red-600 px-1.5 py-0.5 rounded-full text-[10px] min-w-[1.2rem] text-center">
            {trashCount > 99 ? '99+' : trashCount}
          </span>
        </button>
      )}
    </header>
  );
}