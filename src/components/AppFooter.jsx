"use client";

import { APP_META } from "@/lib/constants";

export default function AppFooter() {
  return (
    <footer className="bg-slate-100 text-slate-500 text-center py-1 md:py-1.5 text-[8px] md:text-[10px] font-bold tracking-wider border-t border-slate-200 uppercase mt-auto">
      {APP_META.footer}
    </footer>
  );
}
