"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut, Settings, User as UserIcon, Cloud, CloudOff, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/components/auth-provider";
import { toast } from "sonner";

export function UserMenu() {
  const { user, mode, loading, signOut, configured } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Only show the spinner if we genuinely have nothing to render yet
  // (no cached user AND no guest mode). Once either is known we paint
  // immediately, even if background validation is still pending.
  if (loading && !user && mode === "anonymous") {
    return (
      <div
        className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center"
        title="Loading session…"
      >
        <Loader2 className="w-3.5 h-3.5 text-stone-400 animate-spin" />
      </div>
    );
  }

  if (mode === "anonymous") {
    return (
      <Link
        href="/auth"
        className="inline-flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
      >
        Sign in
      </Link>
    );
  }

  if (mode === "guest") {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger className="inline-flex items-center gap-1.5 px-2 h-8 rounded-md text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors">
          <CloudOff className="w-3.5 h-3.5 text-stone-400" />
          <span className="hidden sm:inline">Guest</span>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64 p-3">
          <p className="text-xs text-stone-500 mb-3 leading-relaxed">
            You&apos;re in guest mode. Data stays on this device. Sign in to sync across devices.
          </p>
          <div className="flex flex-col gap-1">
            <Link
              href="/auth"
              className="inline-flex items-center gap-2 px-2 h-8 rounded-md text-xs font-medium text-stone-700 hover:bg-stone-100 transition-colors"
              onClick={() => setOpen(false)}
            >
              <Cloud className="w-3.5 h-3.5" />
              Sign in to sync
            </Link>
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 px-2 h-8 rounded-md text-xs font-medium text-stone-700 hover:bg-stone-100 transition-colors"
              onClick={() => setOpen(false)}
            >
              <Settings className="w-3.5 h-3.5" />
              Profile
            </Link>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // Authenticated
  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "Account";
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const initial = displayName.charAt(0).toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    setOpen(false);
    router.push("/auth");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="inline-flex items-center gap-2 h-8 pr-2 rounded-md hover:bg-stone-100 transition-colors">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="w-7 h-7 rounded-full border border-stone-200"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-700 to-orange-800 text-white text-xs font-semibold flex items-center justify-center">
            {initial}
          </span>
        )}
        <span className="hidden sm:inline text-xs font-medium text-stone-700 max-w-24 truncate">
          {displayName}
        </span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-0">
        <div className="px-3 pt-3 pb-2 border-b border-stone-100">
          <p className="font-medium text-sm text-stone-900 truncate">{displayName}</p>
          <p className="text-xs text-stone-500 truncate">{user?.email}</p>
          {configured && (
            <div className="inline-flex items-center gap-1 mt-2 text-[10px] text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Synced to cloud
            </div>
          )}
        </div>
        <div className="p-1.5">
          <Link
            href="/profile"
            className="flex items-center gap-2 px-2 h-8 rounded-md text-xs font-medium text-stone-700 hover:bg-stone-100 transition-colors"
            onClick={() => setOpen(false)}
          >
            <UserIcon className="w-3.5 h-3.5" />
            Profile
          </Link>
          <Link
            href="/backup"
            className="flex items-center gap-2 px-2 h-8 rounded-md text-xs font-medium text-stone-700 hover:bg-stone-100 transition-colors"
            onClick={() => setOpen(false)}
          >
            <Settings className="w-3.5 h-3.5" />
            Backup &amp; data
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-2 h-8 rounded-md text-xs font-medium text-stone-700 hover:bg-stone-100 transition-colors text-left"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
