"use client";

import { APP_META } from "@/lib/constants";

export default function AppFooter() {
  return (
    <footer className="bg-slate-100 text-slate-500 text-center py-2 md:py-3 text-[9px] md:text-[11px] font-bold tracking-wider border-t border-slate-200 uppercase mt-auto">
      {APP_META.footer}
    </footer>
  );
}
