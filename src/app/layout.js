import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import SiteNavbar from "@/components/SiteNavbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "WZPDCL Load Calculator | Bottail-Kushtia",
  description:
    "33/11 kV power substation load calculator for WZPDCL Bottail-Kushtia. Calculate feeder MW, history, max load, and statistics.",
  applicationName: "WZPDCL Load Calculator",
  authors: [{ name: "SBA-Bottail, WZPDCL" }],
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0b1220] text-slate-100 antialiased overflow-x-hidden selection:bg-emerald-500/30 selection:text-white">
        <Providers>
          <SiteNavbar />
          <main className="flex-1 flex flex-col min-h-0 w-full min-w-0">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
