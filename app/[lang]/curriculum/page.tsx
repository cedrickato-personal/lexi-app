"use client";

import { useState, useEffect, useMemo, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, X, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Nav } from "@/components/nav";
import { LevelSection } from "@/components/level-section";
import { LANGUAGES } from "@/lib/languages";
import { FAMILY_THEMES } from "@/lib/family-theme";
import { getCurriculum } from "@/lib/curricula";
import { getAllLessons, touchLanguage } from "@/lib/storage";
import type { CEFRLevel } from "@/lib/types";

const ALL_LEVELS: (CEFRLevel | "All")[] = ["All", "A1", "A2", "B1", "B2", "C1", "C2"];

const levelDot: Record<CEFRLevel | "All", string> = {
  All: "bg-stone-900",
  A1: "bg-emerald-500",
  A2: "bg-teal-500",
  B1: "bg-sky-500",
  B2: "bg-violet-500",
  C1: "bg-rose-500",
  C2: "bg-amber-500",
};

export default function CurriculumPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: langCode } = use(params);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<CEFRLevel | "All">("All");
  const [completedWeeks, setCompletedWeeks] = useState<Set<number>>(new Set());
  const [noteWeeks, setNoteWeeks] = useState<Set<number>>(new Set());

  const lang = LANGUAGES[langCode];
  const curriculum = lang ? getCurriculum(langCode) : null;
  const theme = lang ? FAMILY_THEMES[lang.family] : null;

  useEffect(() => {
    if (!lang || !curriculum) {
      router.replace("/");
      return;
    }
    touchLanguage(langCode);
    const lessons = getAllLessons(langCode);
    setCompletedWeeks(new Set(Object.keys(lessons).map(Number)));
    // notes are language-namespaced too — load from storage in a more direct way
    // (we'd need a getAllNotes helper, but for now leave empty)
  }, [langCode, lang, curriculum, router]);

  const filteredWeeks = useMemo(() => {
    if (!curriculum) return [];
    const q = query.trim().toLowerCase();
    let weeks = curriculum.weeks;
    if (q) {
      weeks = weeks.filter(
        (w) =>
          w.title.toLowerCase().includes(q) ||
          w.focus.toLowerCase().includes(q) ||
          (w.anchorSentence?.toLowerCase().includes(q) ?? false) ||
          (w.culturalTouchstones?.some((t) => t.toLowerCase().includes(q)) ?? false)
      );
    }
    if (activeFilter !== "All") {
      weeks = weeks.filter((w) => w.level === activeFilter);
    }
    return weeks;
  }, [query, activeFilter, curriculum]);

  if (!lang || !curriculum || !theme) return null;

  const showingFiltered = query.trim().length > 0 || activeFilter !== "All";

  return (
    <>
      <Nav activeLang={langCode} />
      <main className="min-h-[calc(100vh-3.5rem)]">
        <div className="max-w-6xl mx-auto px-6 py-12">
          {/* Header */}
          <nav className="flex items-center gap-1.5 text-xs text-stone-500 mb-6 font-mono">
            <Link href="/" className="hover:text-orange-800 transition-colors">all</Link>
            <ChevronRight className="w-3 h-3 text-stone-300" />
            <Link href={`/${langCode}`} className="hover:text-orange-800 transition-colors">
              {langCode}
            </Link>
            <ChevronRight className="w-3 h-3 text-stone-300" />
            <span className="text-stone-900">curriculum</span>
          </nav>

          <div className="flex items-baseline gap-3 mb-3">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: theme.accentHex }}
            />
            <p
              className="text-xs uppercase tracking-[0.22em] font-medium"
              style={{ color: theme.accentHex }}
            >
              {lang.name} · {curriculum.totalWeeks} weeks
            </p>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-stone-900 tracking-tight mb-3">
            The <span className="italic" style={{ color: theme.accentHex }}>curriculum</span>
          </h1>
          <p className="text-base text-stone-600 max-w-2xl leading-relaxed mb-10">
            All {curriculum.totalWeeks} weeks across the six CEFR levels. Each week is
            independently generatable but reads best in order.
          </p>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6 sticky top-14 z-30 bg-[#FAF8F3]/90 backdrop-blur-md py-3 -mx-2 px-2 rounded-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title, focus, or cultural touchstone…"
                className="pl-10 pr-9 h-10 border-stone-200 bg-white focus-visible:border-orange-300 focus-visible:ring-orange-200/40"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex gap-1.5 flex-wrap items-center">
              {ALL_LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setActiveFilter(lvl)}
                  className={`px-3 h-8 rounded-md text-xs font-semibold tracking-wide transition-all inline-flex items-center gap-1.5 ${
                    activeFilter === lvl
                      ? "bg-stone-900 text-white shadow-sm"
                      : "bg-white border border-stone-200 text-stone-600 hover:border-stone-300 hover:text-stone-900"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${levelDot[lvl]}`} />
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Level sections */}
          <div className="space-y-3">
            {curriculum.levels.map((level, idx) => {
              if (activeFilter !== "All" && activeFilter !== level.code) return null;
              const weeksForLevel = filteredWeeks.filter((w) => w.level === level.code);
              if (query && weeksForLevel.length === 0) return null;

              const allWeeksForLevel = curriculum.weeks.filter((w) => w.level === level.code);

              return (
                <div key={level.code} id={level.code}>
                  <LevelSection
                    level={level.code}
                    name={level.name}
                    startWeek={level.startWeek}
                    endWeek={level.endWeek}
                    targetVocab={level.targetVocab}
                    weeks={showingFiltered ? weeksForLevel : allWeeksForLevel}
                    langCode={langCode}
                    completedWeeks={completedWeeks}
                    noteWeeks={noteWeeks}
                    defaultOpen={idx === 0 || (showingFiltered && weeksForLevel.length > 0)}
                  />
                </div>
              );
            })}
          </div>

          {filteredWeeks.length === 0 && (
            <div className="text-center py-20 text-stone-400 bg-white rounded-xl border border-stone-200/70">
              <Search className="w-8 h-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No weeks match &quot;{query}&quot;</p>
              <button
                onClick={() => { setQuery(""); setActiveFilter("All"); }}
                className="text-xs text-orange-800 hover:underline mt-3"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
