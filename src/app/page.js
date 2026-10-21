"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import HomePage from "@/components/HomePage";
import SiteFooter from "@/components/SiteFooter";

export default function Home() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // On mobile, auto-open Calculator only on the very first visit this session.
    // After that (e.g. tapping Home in the hamburger), show the home page.
    const mobile =
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 767px)").matches;

    if (mobile) {
      const seen = sessionStorage.getItem("ss_calc_session");
      if (!seen) {
        sessionStorage.setItem("ss_calc_session", "1");
        router.replace("/calculator");
        return;
      }
    }

    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <>
      <HomePage />
      <SiteFooter />
    </>
  );
}
