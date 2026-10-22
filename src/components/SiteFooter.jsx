import { APP_META } from "@/lib/constants";
import Link from "next/link";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/calculator", label: "Calculator" },
  { href: "/history", label: "History" },
  { href: "/max-load", label: "Max Load" },
  { href: "/statistics", label: "Statistics" },
];

export default function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-slate-800 bg-[#0b1220]">
      <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-5 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5 mb-3">
              <img
                src={APP_META.logoUrl}
                alt=""
                className="w-8 h-8 object-contain bg-white rounded-full p-0.5"
              />
              <span className="text-sm font-semibold text-slate-100 tracking-tight">
                WZPDCL · SBA-Bottail
              </span>
            </div>
            <p className="text-[13px] text-slate-400 leading-relaxed">
              {APP_META.subtitle}. Operational load calculation, history, and
              peak reporting for field and control-room use.
            </p>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Navigation
            </p>
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-[13px] text-slate-400 hover:text-emerald-400 transition-colors font-medium"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-[12px] text-slate-500">{APP_META.footer}</p>
          <p className="text-[11px] text-slate-600">
            Internal use · Bottail–Kushtia
          </p>
        </div>
      </div>
    </footer>
  );
}
