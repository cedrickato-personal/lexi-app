"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Languages, User } from "lucide-react";
import { getProfile } from "@/lib/storage";
import { LanguageSelector } from "@/components/language-selector";

export function Nav({ activeLang }: { activeLang?: string }) {
  const pathname = usePathname();
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    setHasProfile(getProfile() !== null);
  }, [pathname]);

  const isAtRoot = pathname === "/";

  return (
    <header className="border-b border-stone-200/80 bg-[#FAF8F3]/85 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-baseline gap-2 shrink-0 group">
          <span className="font-display text-2xl font-semibold text-stone-900 tracking-tight leading-none group-hover:text-orange-800 transition-colors">
            Lexi
          </span>
          <span className="text-[10px] uppercase tracking-[0.18em] text-stone-400 hidden sm:inline font-medium">
            Curriculum
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <LanguageSelector activeLang={activeLang} />
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {!isAtRoot && (
            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
            >
              <Languages className="w-3.5 h-3.5" />
              All languages
            </Link>
          )}
          <Link
            href="/profile"
            className="inline-flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
            title={hasProfile ? "Edit your learner profile" : "Set your learner profile"}
          >
            <User className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{hasProfile ? "Profile" : "Profile"}</span>
            {hasProfile && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
          </Link>
          <Link
            href="/backup"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
          >
            Backup
          </Link>
        </div>
      </div>
    </header>
  );
}
