"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Library, Sparkles } from "lucide-react";
import { Nav } from "@/components/nav";
import { LanguageProgressGrid, LanguagePriorityRow } from "@/components/language-progress-grid";
import { LANGUAGES, LANGUAGES_LIST } from "@/lib/languages";
import {
  getAllProgress,
  getLastUsed,
  getMostRecent,
  getProfile,
} from "@/lib/storage";
import type { LearnerProfile } from "@/lib/types";

export default function HomePage() {
  const [progressByLang, setProgressByLang] = useState<Record<string, { completed: number; total: number }>>({});
  const [lastUsed, setLastUsed] = useState<string | null>(null);
  const [profile, setProfile] = useState<LearnerProfile | null>(null);
  const [mostRecent, setMostRecent] = useState<{ lang: string; week: number } | null>(null);

  useEffect(() => {
    setProgressByLang(getAllProgress());
    setLastUsed(getLastUsed());
    setProfile(getProfile());
    const recent = getMostRecent();
    if (recent) setMostRecent({ lang: recent.lang, week: recent.week });
  }, []);

  const hasProfile = profile !== null;
  const priorityLanguages = (profile?.interestedLanguages ?? []).filter((c) => LANGUAGES[c]);

  const totalCompleted = Object.values(progressByLang).reduce((s, p) => s + p.completed, 0);
  const totalPossible = Object.values(progressByLang).reduce((s, p) => s + p.total, 0);
  const studyingCount = Object.values(progressByLang).filter((p) => p.completed > 0).length;

  return (
    <>
      <Nav />
      <main>
        {/* HERO */}
        <section className="max-w-5xl mx-auto px-6 pt-20 pb-20">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-orange-800/80 mb-6 flex items-center gap-2">
            <span className="inline-block w-8 h-px bg-orange-700/60" />
            31 languages · A1 → C2 · Calibrated to you
          </p>
          <h1 className="font-display text-5xl md:text-7xl lg:text-[5.5rem] tracking-tight text-stone-900 leading-[0.95] mb-8 max-w-4xl">
            Learn any language.
            <br />
            <span className="italic text-orange-800 font-medium">Your</span> way.
          </h1>
          <p className="text-lg md:text-xl text-stone-600 max-w-2xl leading-relaxed mb-10">
            Lexi adapts to how you learn — your strengths, your modality, your pace — and walks
            you from beginner to mastery across any of 31 languages. Personalized lessons,
            daily practice, and (soon) a community of fellow learners.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            {lastUsed && LANGUAGES[lastUsed] ? (
              <Link
                href={mostRecent ? `/${mostRecent.lang}/lesson/${mostRecent.week}` : `/${lastUsed}/curriculum`}
                className="inline-flex items-center justify-center gap-2 rounded-lg h-11 px-6 text-sm font-medium bg-stone-900 hover:bg-stone-800 text-white transition-all shadow-sm hover:shadow"
              >
                <Library className="w-4 h-4" />
                Continue {LANGUAGES[lastUsed].name}
                {mostRecent && <span className="text-stone-300 ml-1">· Week {mostRecent.week}</span>}
                <ArrowRight className="w-4 h-4 ml-1 opacity-60" />
              </Link>
            ) : (
              <a
                href="#languages"
                className="inline-flex items-center justify-center gap-2 rounded-lg h-11 px-6 text-sm font-medium bg-stone-900 hover:bg-stone-800 text-white transition-all shadow-sm hover:shadow"
              >
                <Library className="w-4 h-4" />
                Pick a language
                <ArrowRight className="w-4 h-4 ml-1 opacity-60" />
              </a>
            )}
            {!hasProfile && (
              <Link
                href="/profile"
                className="inline-flex items-center gap-1.5 h-11 px-5 text-sm font-medium text-orange-800 hover:bg-orange-50 transition-colors rounded-lg"
              >
                <Sparkles className="w-4 h-4" />
                Calibrate to me
              </Link>
            )}
          </div>
        </section>

        {/* PROGRESS SNAPSHOT */}
        {(totalCompleted > 0 || studyingCount > 0) && (
          <section className="max-w-5xl mx-auto px-6 pb-20">
            <div className="bg-white rounded-2xl border border-stone-200/70 shadow-sm p-8">
              <p className="text-xs uppercase tracking-[0.18em] text-stone-400 font-medium mb-4">
                Your Progress
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12">
                <Stat big={`${studyingCount}`} label={studyingCount === 1 ? "language" : "languages"} sub="being studied" />
                <Stat big={`${totalCompleted.toLocaleString()}`} label={`/ ${totalPossible.toLocaleString()}`} sub="total lessons saved" />
                {mostRecent && LANGUAGES[mostRecent.lang] && (
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-stone-400 mb-1">
                      Most recent
                    </p>
                    <p className="font-display text-2xl font-semibold text-stone-900 leading-tight">
                      {LANGUAGES[mostRecent.lang].name}
                    </p>
                    <p className="text-sm text-stone-500 mt-0.5">Week {mostRecent.week}</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* PRIORITY LANGUAGES */}
        {priorityLanguages.length > 0 && (
          <section id="your-languages" className="max-w-7xl mx-auto px-6 pb-20 scroll-mt-20">
            <div className="flex items-baseline justify-between gap-6 flex-wrap mb-6 max-w-5xl">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-orange-800/80 font-medium mb-3 flex items-center gap-2">
                  <span className="inline-block w-8 h-px bg-orange-700/60" />
                  Your Languages
                </p>
                <h2 className="font-display text-3xl md:text-4xl font-semibold text-stone-900 tracking-tight">
                  The ones you&apos;re focused on
                </h2>
              </div>
              <Link
                href="/profile"
                className="text-xs text-stone-500 hover:text-orange-800 transition-colors"
              >
                Edit preferences →
              </Link>
            </div>
            <LanguagePriorityRow
              codes={priorityLanguages}
              progressByLang={progressByLang}
              lastUsed={lastUsed}
            />
          </section>
        )}

        {/* LANGUAGE GRID */}
        <section id="languages" className="max-w-7xl mx-auto px-6 pb-24 scroll-mt-20">
          <div className="flex items-baseline justify-between gap-6 flex-wrap mb-8 max-w-5xl">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-orange-800/80 font-medium mb-3 flex items-center gap-2">
                <span className="inline-block w-8 h-px bg-orange-700/60" />
                {priorityLanguages.length > 0 ? "All Languages" : "Start Learning"}
              </p>
              <h2 className="font-display text-3xl md:text-4xl font-semibold text-stone-900 tracking-tight">
                {priorityLanguages.length > 0 ? "Explore all 31" : "Pick a language"}
              </h2>
            </div>
            <p className="text-sm text-stone-500 max-w-xs">
              Organized by FSI difficulty category — from closely cognate with English to
              exceptionally distant.
            </p>
          </div>
          <LanguageProgressGrid progressByLang={progressByLang} lastUsed={lastUsed} />
        </section>

        {/* HOW IT WORKS */}
        <section id="how" className="max-w-5xl mx-auto px-6 pb-24 scroll-mt-20">
          <div className="flex items-baseline justify-between mb-10">
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-stone-900 tracking-tight">
              How learning works in Lexi
            </h2>
            <p className="text-sm text-stone-500 hidden md:block">
              Five minutes a week to set up · the rest is on you (and us)
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                n: "01",
                title: "Pick a language",
                desc: "Choose any of 31 languages. Each one has a clear path from A1 beginner to C2 mastery — but you set the pace, the focus, and where you stop.",
              },
              {
                n: "02",
                title: "Get this week's lesson",
                desc: "Lexi builds a lesson around how you learn best — your strengths, modality, and goals — drawing on Claude.ai. Save it and you're set for the week.",
              },
              {
                n: "03",
                title: "Practice & connect",
                desc: "Daily practice keeps things sticky between lessons. A community of fellow learners is coming — until then, you can share progress with friends.",
              },
            ].map(({ n, title, desc }) => (
              <div
                key={n}
                className="group relative bg-white rounded-xl border border-stone-200/70 p-7 hover:border-stone-300 transition-colors"
              >
                <span className="font-mono text-xs text-stone-400 tracking-widest mb-5 block">{n}</span>
                <h3 className="font-display text-xl font-semibold text-stone-900 mb-2 tracking-tight">{title}</h3>
                <p className="text-sm text-stone-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-stone-200/70 mt-12">
          <div className="max-w-5xl mx-auto px-6 py-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <p className="font-display text-xl font-semibold text-stone-900">Lexi</p>
                <p className="text-xs text-stone-400 mt-1">
                  Learn any of {LANGUAGES_LIST.length} languages · Your way
                </p>
              </div>
              <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-stone-500">
                <Link href="/profile" className="hover:text-orange-800 transition-colors">Profile</Link>
                <Link href="/backup" className="hover:text-orange-800 transition-colors">Backup</Link>
                <a href="#languages" className="hover:text-orange-800 transition-colors">Languages</a>
                <a href="#how" className="hover:text-orange-800 transition-colors">How it works</a>
              </nav>
            </div>
            <p className="text-[11px] text-stone-400 mt-6 max-w-md leading-relaxed">
              All lessons and profile data are saved locally in your browser. Nothing is sent
              to any server. Export anytime via the Backup page.
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}

function Stat({ big, label, sub }: { big: string; label?: string; sub: string }) {
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="font-display text-5xl font-semibold text-stone-900 tabular-nums leading-none">
          {big}
        </span>
        {label && (
          <span className="font-display text-lg text-stone-400 tabular-nums leading-none">
            {label}
          </span>
        )}
      </div>
      <p className="text-sm text-stone-500">{sub}</p>
    </div>
  );
}
