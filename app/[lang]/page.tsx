"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Library, BookOpen, Dumbbell, Globe, ChevronRight } from "lucide-react";
import { Nav } from "@/components/nav";
import { LANGUAGES } from "@/lib/languages";
import { FAMILY_THEMES } from "@/lib/family-theme";
import { getCurriculum } from "@/lib/curricula";
import { touchLanguage } from "@/lib/storage";
import { fetchAvailableWeeks } from "@/lib/lessons";

export default function LangHomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: langCode } = use(params);
  const router = useRouter();
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [nextWeek, setNextWeek] = useState(1);

  const lang = LANGUAGES[langCode];
  const curriculum = lang ? getCurriculum(langCode) : null;
  const theme = lang ? FAMILY_THEMES[lang.family] : null;

  useEffect(() => {
    if (!lang || !curriculum) {
      router.replace("/");
      return;
    }
    touchLanguage(langCode);
    fetchAvailableWeeks(langCode).then((available) => {
      setProgress({ completed: available.size, total: lang.totalWeeks });
      // "Next" = first week that has a published lesson but, failing that,
      // just week 1 (so the CTA always goes somewhere useful).
      const firstAvailable = curriculum.weeks.find((w) => available.has(w.number));
      setNextWeek(firstAvailable?.number ?? 1);
    });
  }, [langCode, lang, curriculum, router]);

  if (!lang || !curriculum || !theme) return null;

  const pct = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

  return (
    <>
      <Nav activeLang={langCode} />
      <main className="min-h-[calc(100vh-3.5rem)]">
        <section className="max-w-5xl mx-auto px-6 pt-16 pb-16">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 transition-colors mb-6 font-mono"
          >
            <ChevronRight className="w-3 h-3 rotate-180" />
            all languages
          </Link>

          <div className="flex items-baseline gap-4 flex-wrap mb-3">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: theme.accentHex }}
            />
            <p
              className="text-xs uppercase tracking-[0.22em] font-medium"
              style={{ color: theme.accentHex }}
            >
              {lang.familyLabel}
            </p>
          </div>

          <h1
            className="font-display text-5xl md:text-7xl font-semibold text-stone-900 tracking-tight leading-[1.02] mb-3"
            dir={lang.rtl ? "rtl" : "ltr"}
            style={lang.script !== "Latin" ? { fontFamily: theme.targetFontStack } : undefined}
          >
            {lang.nativeName}
          </h1>
          <p className="font-display text-2xl text-stone-500 italic mb-6">{lang.name}</p>
          {lang.notes && (
            <p className="text-base text-stone-600 max-w-2xl leading-relaxed mb-6">{lang.notes}</p>
          )}

          <div className="flex items-center gap-x-6 gap-y-2 text-xs flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-stone-400 uppercase tracking-widest">Script</span>
              <span className="font-medium text-stone-700">{lang.script}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-stone-400 uppercase tracking-widest">FSI</span>
              <span className="font-medium text-stone-700">Category {lang.fsiCategory === 2.5 ? "II–III" : ["I", "II", "II–III", "III", "IV"][Math.floor(lang.fsiCategory) - 1]}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-stone-400 uppercase tracking-widest">Total</span>
              <span className="font-medium text-stone-700">{lang.totalWeeks} weeks</span>
            </div>
            {lang.rtl && (
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-stone-400 uppercase tracking-widest">Direction</span>
                <span className="font-medium text-stone-700">RTL</span>
              </div>
            )}
          </div>
        </section>

        {/* Progress card */}
        <section className="max-w-5xl mx-auto px-6 pb-16">
          <div className="bg-white rounded-2xl border border-stone-200/70 shadow-sm overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 p-8 pb-7">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-stone-400 font-medium mb-3">
                  Lessons available
                </p>
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-6xl md:text-7xl font-semibold text-stone-900 tabular-nums leading-none">
                    {progress.completed}
                  </span>
                  <span className="font-display text-3xl text-stone-300 tabular-nums leading-none">
                    / {progress.total}
                  </span>
                  <span className="text-sm text-stone-500 ml-2">
                    week{progress.completed === 1 ? "" : "s"} ready
                  </span>
                </div>
                <p className="text-sm text-stone-500 mt-3 max-w-md">
                  {progress.completed === 0
                    ? `No lessons published yet for ${lang.name}. Start with Week 1: ${curriculum.weeks[0]?.title}`
                    : `Jump in at Week ${nextWeek} · ${curriculum.weeks.find((w) => w.number === nextWeek)?.title ?? ""}`}
                </p>
              </div>
              <Link
                href={`/${langCode}/lesson/${nextWeek}`}
                className="inline-flex items-center gap-2 rounded-lg h-10 px-5 text-sm font-medium text-white shadow-sm shrink-0 transition-colors"
                style={{ backgroundColor: theme.accentHex }}
              >
                {progress.completed === 0 ? "Go to Week 1" : `Start · Week ${nextWeek}`}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="h-1.5 bg-stone-100">
              <div
                className="h-full transition-all duration-700"
                style={{ width: `${pct}%`, backgroundColor: theme.accentHex }}
              />
            </div>
          </div>
        </section>

        {/* Quick links */}
        <section className="max-w-5xl mx-auto px-6 pb-24">
          <p className="text-xs uppercase tracking-[0.22em] text-orange-800/80 font-medium mb-4 flex items-center gap-2">
            <span className="inline-block w-8 h-px bg-orange-700/60" />
            Keep going
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <QuickLink
              href={`/${langCode}/curriculum`}
              icon={Library}
              title="The path"
              desc={`All ${curriculum.totalWeeks} weeks from A1 to C2 — browse, jump around, take what you need.`}
              accent={theme.accentHex}
            />
            <QuickLink
              href={`/${langCode}/resources`}
              icon={BookOpen}
              title="Resources"
              desc={`Curated podcasts, books, films, tutors, and apps for learning ${lang.name}.`}
              accent={theme.accentHex}
            />
            <QuickLink
              href={`/${langCode}/practice`}
              icon={Dumbbell}
              title="Daily practice"
              desc="The small habits between lessons that turn study into real fluency."
              accent={theme.accentHex}
            />
          </div>
        </section>

        {/* CEFR Levels overview */}
        <section className="max-w-5xl mx-auto px-6 pb-20">
          <p className="text-xs uppercase tracking-[0.22em] text-orange-800/80 font-medium mb-4 flex items-center gap-2">
            <span className="inline-block w-8 h-px bg-orange-700/60" />
            Levels
          </p>
          <h2 className="font-display text-3xl font-semibold text-stone-900 tracking-tight mb-8">
            The six CEFR levels
          </h2>
          <div className="space-y-2">
            {curriculum.levels.map((level) => (
              <Link
                key={level.code}
                href={`/${langCode}/curriculum#${level.code}`}
                className="group flex items-center gap-5 p-5 bg-white rounded-xl border border-stone-200/70 hover:border-stone-300 transition-all"
              >
                <span className="font-display text-2xl font-semibold text-stone-900 w-12 shrink-0">
                  {level.code}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-lg font-semibold text-stone-900 leading-tight">
                    {level.name}
                  </p>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Weeks {level.startWeek}–{level.endWeek}
                    {level.targetVocab ? ` · ~${level.targetVocab.toLocaleString()} active vocabulary` : ""}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-stone-600 transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        </section>

        <footer className="border-t border-stone-200/70 mt-12">
          <div className="max-w-5xl mx-auto px-6 py-8 text-xs text-stone-400 flex justify-between items-center">
            <span>Lexi · {lang.name} curriculum · {curriculum.totalWeeks} weeks</span>
            <Link href="/" className="hover:text-orange-800 inline-flex items-center gap-1">
              <Globe className="w-3 h-3" />
              All languages
            </Link>
          </div>
        </footer>
      </main>
    </>
  );
}

function QuickLink({
  href,
  icon: Icon,
  title,
  desc,
  accent,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  desc: string;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className="group bg-white rounded-xl border border-stone-200/70 p-6 hover:border-stone-300 hover:-translate-y-0.5 hover:shadow-md transition-all"
    >
      <Icon className="w-5 h-5 mb-4" style={{ color: accent }} strokeWidth={1.5} />
      <h3 className="font-display text-lg font-semibold text-stone-900 tracking-tight mb-1">{title}</h3>
      <p className="text-sm text-stone-600 leading-relaxed">{desc}</p>
    </Link>
  );
}
