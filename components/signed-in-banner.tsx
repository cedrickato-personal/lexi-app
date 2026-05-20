"use client";

import { useRouter } from "next/navigation";
import { LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { toast } from "sonner";

/**
 * Small contextual banner shown on auth-adjacent screens (onboarding, profile)
 * so users always know which account they're signed into and can sign out
 * without having to find the nav menu.
 */
export function SignedInBanner() {
  const router = useRouter();
  const { user, mode, signOut } = useAuth();

  // Nothing to show in anonymous mode (the gate wouldn't let them here anyway)
  if (mode === "anonymous") return null;

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    router.push("/auth");
  };

  if (mode === "guest") {
    return (
      <div className="flex items-center justify-between gap-3 mb-8 px-3 py-2 rounded-lg bg-stone-100/60 border border-stone-200/70">
        <span className="inline-flex items-center gap-2 text-xs text-stone-600">
          <UserIcon className="w-3.5 h-3.5 text-stone-400" />
          You&apos;re continuing as <strong className="text-stone-900 font-medium">guest</strong> — data stays on this device.
        </span>
        <button
          onClick={() => router.push("/auth")}
          className="text-xs font-medium text-orange-800 hover:text-orange-900 transition-colors whitespace-nowrap"
        >
          Sign in to sync →
        </button>
      </div>
    );
  }

  // Authenticated
  const name =
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "your account";
  const email = user?.email ?? "";

  return (
    <div className="flex items-center justify-between gap-3 mb-8 px-3 py-2 rounded-lg bg-stone-100/60 border border-stone-200/70">
      <span className="inline-flex items-center gap-2 text-xs text-stone-600 min-w-0">
        <UserIcon className="w-3.5 h-3.5 text-stone-400 shrink-0" />
        <span className="truncate">
          Signed in as <strong className="text-stone-900 font-medium">{name}</strong>
          {email && <span className="text-stone-400"> · {email}</span>}
        </span>
      </span>
      <button
        onClick={handleSignOut}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-red-700 transition-colors whitespace-nowrap"
      >
        <LogOut className="w-3 h-3" />
        Sign out
      </button>
    </div>
  );
}
