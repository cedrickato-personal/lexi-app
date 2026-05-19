"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { LANGUAGES, LANGUAGES_LIST, FSI_CATEGORIES, type LanguageMeta } from "@/lib/languages";
import { FAMILY_THEMES } from "@/lib/family-theme";

interface LanguageProgressGridProps {
  progressByLang: Record<string, { completed: number; total: number }>;
  lastUsed?: string | null;
}

export function LanguageProgressGrid({
  progressByLang,
  lastUsed,
}: LanguageProgressGridProps) {
  return (
    <div className="space-y-8">
      {FSI_CATEGORIES.map((cat) => {
        const langs = LANGUAGES_LIST.filter((l) => l.fsiCategory === cat.cat);
        if (!langs.length) return null;

        // Sort: in-progress first, then by name
        const sorted = [...langs].sort((a, b) => {
          const pa = progressByLang[a.code]?.completed ?? 0;
          const pb = progressByLang[b.code]?.completed ?? 0;
          if ((pa > 0) !== (pb > 0)) return pa > 0 ? -1 : 1;
          return a.name.localeCompare(b.name);
        });

        return (
          <section key={cat.cat}>
            <div className="flex items-baseline justify-between gap-3 mb-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-stone-400 mb-1">
                  {cat.label} · {langs[0].totalWeeks}–{Math.max(...langs.map((l) => l.totalWeeks))} weeks
                </p>
                <h3 className="font-display text-xl font-semibold text-stone-900 tracking-tight">
                  {cat.description}
                </h3>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {sorted.map((lang) => (
                <LanguageCard
                  key={lang.code}
                  lang={lang}
                  progress={progressByLang[lang.code]}
                  isLastUsed={lastUsed === lang.code}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

// Compact row of "priority" language cards — used when the user has picked
// preferred languages via their profile.
export function LanguagePriorityRow({
  codes,
  progressByLang,
  lastUsed,
}: {
  codes: string[];
  progressByLang: Record<string, { completed: number; total: number }>;
  lastUsed?: string | null;
}) {
  const langs = codes.map((c) => LANGUAGES[c]).filter(Boolean) as LanguageMeta[];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {langs.map((lang) => (
        <LanguageCard
          key={lang.code}
          lang={lang}
          progress={progressByLang[lang.code]}
          isLastUsed={lastUsed === lang.code}
        />
      ))}
    </div>
  );
}

function LanguageCard({
  lang,
  progress,
  isLastUsed,
}: {
  lang: LanguageMeta;
  progress?: { completed: number; total: number };
  isLastUsed?: boolean;
}) {
  const theme = FAMILY_THEMES[lang.family];
  const done = progress?.completed ?? 0;
  const total = progress?.total ?? lang.totalWeeks;
  const pct = total > 0 ? (done / total) * 100 : 0;
  const inProgress = done > 0;
  const isRTL = lang.rtl;

  return (
    <Link
      href={`/${lang.code}`}
      className={`group relative bg-white rounded-xl border overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md ${
        inProgress
          ? "border-stone-300/80"
          : "border-stone-200/70 hover:border-stone-300"
      }`}
    >
      {/* Family accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ backgroundColor: theme.accentHex }}
      />

      {isLastUsed && (
        <div className="absolute top-2 right-2 text-[10px] font-mono uppercase tracking-widest text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded">
          Most recent
        </div>
      )}

      <div className="p-5 pl-6">
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <div
            className="font-display text-2xl font-semibold text-stone-900 leading-tight"
            style={lang.script !== "Latin" ? { fontFamily: theme.targetFontStack } : undefined}
            dir={isRTL ? "rtl" : "ltr"}
          >
            {lang.nativeName}
          </div>
          {isRTL && (
            <span className="text-[9px] font-mono text-stone-400 uppercase tracking-widest shrink-0">
              RTL
            </span>
          )}
        </div>
        <div className="flex items-baseline justify-between gap-2 mb-4">
          <span className="text-sm text-stone-600">{lang.name}</span>
          <span className="text-[10px] font-mono text-stone-400">{lang.script}</span>
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between text-xs">
            <span className="font-mono tabular-nums text-stone-700">
              <span className="font-semibold">{done}</span>
              <span className="text-stone-400"> / {total}</span>
            </span>
            <span className="text-stone-400">{Math.round(pct)}%</span>
          </div>
          <div className="h-1 rounded-full bg-stone-100 overflow-hidden">
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                backgroundColor: theme.accentHex,
              }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-stone-100">
          <span className="text-[10px] text-stone-400 truncate">{lang.familyLabel}</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 transition-colors shrink-0" />
        </div>
      </div>
    </Link>
  );
}
