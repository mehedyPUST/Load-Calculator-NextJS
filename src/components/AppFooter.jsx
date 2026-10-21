"use client";

import { APP_META } from "@/lib/constants";

export default function AppFooter() {
  return (
    <footer
      className="bg-slate-50 text-slate-500 text-center font-medium tracking-wide border-t border-slate-200 mt-auto"
      style={{
        paddingTop: "var(--calc-footer-py)",
        paddingBottom: "var(--calc-footer-py)",
        fontSize: "var(--calc-footer-size)",
      }}
    >
      {APP_META.footer}
    </footer>
  );
}
