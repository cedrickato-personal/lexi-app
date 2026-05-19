"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getOnboardingState } from "@/lib/storage";
import { useAuth } from "@/components/auth-provider";

const AUTH_EXEMPT_PATHS = ["/auth"];
const ONBOARDING_EXEMPT_PATHS = ["/auth", "/onboarding", "/profile"];

/**
 * Two-stage gate:
 *   1. If not authenticated AND not in guest mode → redirect to /auth.
 *   2. If onboarding hasn't been completed or explicitly skipped → /onboarding.
 *
 * `/auth`, `/onboarding`, and `/profile` are always reachable so users can
 * traverse the flow and edit later.
 */
export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { mode, loading } = useAuth();
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    if (loading) return;

    const authExempt = AUTH_EXEMPT_PATHS.some((p) => pathname.startsWith(p));
    const onboardingExempt = ONBOARDING_EXEMPT_PATHS.some((p) => pathname.startsWith(p));

    // Stage 1: must be authenticated or explicit guest
    if (mode === "anonymous" && !authExempt) {
      const next = encodeURIComponent(pathname);
      router.replace(`/auth?next=${next}`);
      return;
    }

    // Stage 2: must have resolved onboarding (completed or skipped)
    const state = getOnboardingState();
    if (!state && !onboardingExempt) {
      router.replace("/onboarding");
      return;
    }

    setResolved(true);
  }, [pathname, router, mode, loading]);

  const isExempt = ONBOARDING_EXEMPT_PATHS.some((p) => pathname.startsWith(p));
  if (loading || (!resolved && !isExempt)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="font-display text-2xl text-stone-400 animate-pulse">Lexi</div>
      </div>
    );
  }

  return <>{children}</>;
}
