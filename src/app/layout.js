import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

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
    "33/11 kV power substation load calculator for WZPDCL Bottail-Kushtia. Calculate feeder MW with optional database save.",
  applicationName: "WZPDCL Load Calculator",
  authors: [{ name: "SBA-Bottail, WZPDCL" }],
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
