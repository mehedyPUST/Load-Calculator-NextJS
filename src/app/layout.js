import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import AppShell from "@/components/AppShell";

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
  openGraph: {
    title: "WZPDCL Load Calculator",
    description:
      "33/11 kV power substation load calculator for WZPDCL Bottail-Kushtia. Calculate feeder MW, history, max load, and statistics.",
  },
};

const themeInitScript = `
(function() {
  try {
    var saved = localStorage.getItem('wzpdcl-theme');
    var theme = saved === 'light' ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch (e) {}
})();
`;

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="h-full min-h-0 flex flex-col bg-[#0b1220] text-slate-100 antialiased overflow-hidden selection:bg-emerald-500/30 selection:text-white">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
