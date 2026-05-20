"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getOnboardingState } from "@/lib/storage";
import { useAuth } from "@/components/auth-provider";

const AUTH_EXEMPT_PATHS = ["/auth"];
const ONBOARDING_EXEMPT_PATHS = ["/auth", "/onboarding", "/profile"];

const LOADING_TIMEOUT_MS = 5000;

/**
 * Two-stage gate:
 *   1. If not authenticated AND not in guest mode → redirect to /auth.
 *   2. If onboarding hasn't been completed or explicitly skipped → /onboarding.
 *
 * `/auth`, `/onboarding`, and `/profile` are always reachable so users can
 * traverse the flow and edit later.
 *
 * If auth-loading hangs for more than 5 seconds, we proceed anyway — better
 * to show a broken page than the infinite loading splash.
 */
export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { mode, loading } = useAuth();
  const [resolved, setResolved] = useState(false);
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);

  // Failsafe: if loading takes too long, stop blocking the UI.
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => {
      console.warn("[gate] auth loading timed out — proceeding without waiting");
      setLoadingTimedOut(true);
    }, LOADING_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [loading]);

  useEffect(() => {
    if (loading && !loadingTimedOut) return;

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
  }, [pathname, router, mode, loading, loadingTimedOut]);

  const stillBlocking = (loading && !loadingTimedOut) || !resolved;
  const isExempt = ONBOARDING_EXEMPT_PATHS.some((p) => pathname.startsWith(p));
  if (stillBlocking && !isExempt) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="font-display text-2xl text-stone-400 animate-pulse">Lexi</div>
      </div>
    );
  }

  return <>{children}</>;
}
