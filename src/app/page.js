"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import HomePage from "@/components/HomePage";
import SiteFooter from "@/components/SiteFooter";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loading) return;
    // Mobile + signed in: open Calculator first (duty workflow)
    const mobile =
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 1023px)").matches;
    if (mobile && isAuthenticated) {
      router.replace("/calculator");
      return;
    }
    setReady(true);
  }, [router, loading, isAuthenticated]);

  if (loading || !ready) {
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
