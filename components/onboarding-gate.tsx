"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getOnboardingState } from "@/lib/storage";

const EXEMPT_PATHS = ["/onboarding", "/profile"];

/**
 * Required onboarding gate. If onboarding hasn't been completed or explicitly
 * skipped, redirect any navigation (except exempt paths) to /onboarding.
 */
export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    const state = getOnboardingState();
    const exempt = EXEMPT_PATHS.some((p) => pathname.startsWith(p));
    if (!state && !exempt) {
      router.replace("/onboarding");
    } else {
      setResolved(true);
    }
  }, [pathname, router]);

  if (!resolved && !EXEMPT_PATHS.some((p) => pathname.startsWith(p))) {
    // Brief placeholder while we check; avoids flash of unprotected content.
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="font-display text-2xl text-stone-400 animate-pulse">Lexi</div>
      </div>
    );
  }

  return <>{children}</>;
}
