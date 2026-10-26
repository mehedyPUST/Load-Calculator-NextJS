"use client";

import { APP_META } from "@/lib/constants";

/** Very compact footer for all pages except Calculator */
export default function AppNarrowFooter() {
  return (
    <footer className="shrink-0 border-t border-white/[0.06] bg-[#0a101c]">
      <div className="w-full max-w-none mx-auto px-3 sm:px-5 lg:px-6 py-1.5 flex items-center justify-between gap-3 min-h-[1.75rem]">
        <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">
          {APP_META.footer}
        </p>
        <p className="text-[10px] text-slate-600 whitespace-nowrap shrink-0">
          Bottail–Kushtia · Internal
        </p>
      </div>
    </footer>
  );
}