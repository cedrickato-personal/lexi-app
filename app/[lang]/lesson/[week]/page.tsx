"use client";

import { useEffect, useState, useCallback, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChevronLeft, ChevronRight, Sparkles, FileText, BookOpen, Wand2, Lock, Clock } from "lucide-react";
import { TableOfContents, useMarkdownToc, type TocItem } from "@/components/table-of-contents";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Nav } from "@/components/nav";
import { LessonGenerator } from "@/components/lesson-generator";
import { LessonViewer } from "@/components/lesson-viewer";
import { LANGUAGES } from "@/lib/languages";
import { FAMILY_THEMES } from "@/lib/family-theme";
import { getCurriculum } from "@/lib/curricula";
import {
  getNote,
  saveNote,
  touchLanguage,
} from "@/lib/storage";
import { pushNote } from "@/lib/storage-sync";
import { fetchSharedLesson, type SharedLesson } from "@/lib/lessons";
import { useAuth } from "@/components/auth-provider";
import {
  getLanguageReference,
  getLanguageAddendum,
  pedagogyFoundations,
} from "@/lib/references";
import type { Week, CEFRLevel } from "@/lib/types";
import { toast } from "sonner";

const levelStyles: Record<CEFRLevel, { bg: string; text: string; dot: string }> = {
  A1: { bg: "bg-emerald-50", text: "text-emerald-800", dot: "bg-emerald-500" },
  A2: { bg: "bg-teal-50",    text: "text-teal-800",    dot: "bg-teal-500" },
  B1: { bg: "bg-sky-50",     text: "text-sky-800",     dot: "bg-sky-500" },
  B2: { bg: "bg-violet-50",  text: "text-violet-800",  dot: "bg-violet-500" },
  C1: { bg: "bg-rose-50",    text: "text-rose-800",    dot: "bg-rose-500" },
  C2: { bg: "bg-amber-50",   text: "text-amber-800",   dot: "bg-amber-500" },
};

export default function LessonPage({ params }: { params: Promise<{ lang: string; week: string }> }) {
  const { lang: langCode, week: weekStr } = use(params);
  const weekNumber = parseInt(weekStr);
  const router = useRouter();

  const lang = LANGUAGES[langCode];
  const curriculum = lang ? getCurriculum(langCode) : null;
  const theme = lang ? FAMILY_THEMES[lang.family] : null;

  const { user, isAdmin } = useAuth();
  const [week, setWeek] = useState<Week | null>(null);
  const [lesson, setLesson] = useState<SharedLesson | null>(null);
  const [lessonLoading, setLessonLoading] = useState(true);
  const [note, setNote] = useState("");
  const [noteSaved, setNoteSaved] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<string>("lesson");

  useEffect(() => {
    if (!lang || !curriculum) {
      router.replace("/");
      return;
    }
    const w = curriculum.weeks.find((w) => w.number === weekNumber);
    if (!w) {
      router.replace(`/${langCode}/curriculum`);
      return;
    }
    setWeek(w);
    setNote(getNote(langCode, weekNumber));
    touchLanguage(langCode);

    let cancelled = false;
    setLessonLoading(true);
    fetchSharedLesson(langCode, weekNumber)
      .then((saved) => {
        if (cancelled) return;
        setLesson(saved);
        // Admins default to the generate tab on empty weeks; everyone else to lesson.
        setActiveTab(saved ? "lesson" : isAdmin ? "generate" : "lesson");
      })
      .finally(() => {
        if (!cancelled) setLessonLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [langCode, weekNumber, lang, curriculum, refreshKey, router, isAdmin]);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const handleNoteChange = (val: string) => {
    setNote(val);
    setNoteSaved(false);
  };

  const handleNoteSave = useCallback(() => {
    if (!week) return;
    saveNote(langCode, week.number, note);
    if (user) pushNote(user.id, langCode, week.number, note).catch(() => {});
    setNoteSaved(true);
    toast.success("Notes saved");
  }, [langCode, week, note, user]);

  // TOC: lesson content sections (when a lesson is saved). Lesson sections use
  // h3 (### N. Section) so we must include h3 headings.
  const lessonToc = useMarkdownToc(lesson?.content ?? "", true);

  const tocItems: TocItem[] = useMemo(() => {
    const baseItems: TocItem[] = [
      { id: "week-spec", label: "Week spec", level: 1 },
    ];
    if (activeTab === "generate") {
      return [
        ...baseItems,
        { id: "step-01", label: "1. Copy the prompt", level: 1 },
        { id: "step-02", label: "2. Paste into Claude.ai", level: 1 },
        { id: "step-03", label: "3. Paste the response back", level: 1 },
      ];
    }
    if (activeTab === "lesson" && lessonToc.length) {
      return [...baseItems, ...lessonToc];
    }
    if (activeTab === "notes") {
      return [...baseItems, { id: "notes-section", label: "Your notes", level: 1 }];
    }
    if (activeTab === "reference") {
      return [
        ...baseItems,
        { id: "ref-addendum", label: "Pedagogical addendum", level: 1 },
        { id: "ref-language", label: "Language reference", level: 1 },
        { id: "ref-foundations", label: "Pedagogy foundations", level: 1 },
      ];
    }
    return baseItems;
  }, [activeTab, lessonToc]);

  if (!lang || !curriculum || !theme || !week) return null;

  const prev = weekNumber > 1 ? weekNumber - 1 : null;
  const next = weekNumber < lang.totalWeeks ? weekNumber + 1 : null;
  const lvl = levelStyles[week.level];

  const langRef = getLanguageReference(langCode);
  const addendum = getLanguageAddendum(langCode);

  return (
    <>
      <Nav activeLang={langCode} />
      <main className="min-h-[calc(100vh-3.5rem)]">
        <div className="max-w-6xl mx-auto px-6 py-10 lg:grid lg:grid-cols-[1fr_220px] lg:gap-x-12">
          <div className="min-w-0">
          {/* Breadcrumb + week pager */}
          <div className="flex items-center justify-between gap-4 mb-8">
            <nav className="flex items-center gap-1.5 text-xs text-stone-500 font-mono min-w-0">
              <Link href="/" className="hover:text-orange-800 transition-colors">all</Link>
              <span className="text-stone-300">/</span>
              <Link href={`/${langCode}`} className="hover:text-orange-800 transition-colors">{langCode}</Link>
              <span className="text-stone-300">/</span>
              <Link href={`/${langCode}/curriculum`} className="hover:text-orange-800 transition-colors">
                curriculum
              </Link>
              <span className="text-stone-300">/</span>
              <span className="text-stone-900">week {week.number.toString().padStart(3, "0")}</span>
            </nav>

            <div className="flex items-center gap-1 shrink-0">
              {prev ? (
                <Link
                  href={`/${langCode}/lesson/${prev}`}
                  className="inline-flex items-center gap-1 h-8 pl-2 pr-3 rounded-md text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                  title={`Week ${prev}`}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Prev
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1 h-8 pl-2 pr-3 rounded-md text-xs font-medium text-stone-300 cursor-not-allowed">
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Prev
                </span>
              )}
              <span className="text-stone-200">|</span>
              {next ? (
                <Link
                  href={`/${langCode}/lesson/${next}`}
                  className="inline-flex items-center gap-1 h-8 pl-3 pr-2 rounded-md text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                  title={`Week ${next}`}
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1 h-8 pl-3 pr-2 rounded-md text-xs font-medium text-stone-300 cursor-not-allowed">
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
          </div>

          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md ${lvl.bg} ${lvl.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${lvl.dot}`} />
                {week.level}
              </span>
              <span className="text-xs text-stone-500">·</span>
              <span className="text-xs font-medium text-stone-700">{lang.name}</span>
              {lesson && (
                <Badge variant="outline" className="text-xs border-emerald-200 bg-emerald-50 text-emerald-700 gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Saved
                </Badge>
              )}
            </div>
            <p className="font-mono text-xs uppercase tracking-widest text-stone-400 mb-2">
              Week {week.number.toString().padStart(3, "0")} of {lang.totalWeeks}
            </p>
            <h1 className="font-display text-4xl md:text-5xl font-semibold text-stone-900 tracking-tight leading-[1.05]">
              {week.title}
            </h1>
            {week.anchorSentence && (
              <p
                className="mt-5 text-lg text-stone-700 italic max-w-2xl leading-relaxed"
                dir={lang.rtl ? "rtl" : "ltr"}
                style={lang.script !== "Latin" ? { fontFamily: theme.targetFontStack } : undefined}
              >
                ✦ {week.anchorSentence}
              </p>
            )}
          </div>

          {/* Week spec card */}
          <div id="week-spec" className="bg-white rounded-2xl border border-stone-200/70 shadow-sm mb-10 overflow-hidden scroll-mt-20">
            <div className="p-7 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-7">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-stone-400 mb-3">
                    Core focus
                  </p>
                  <p className="text-sm text-stone-700 leading-relaxed">{week.focus}</p>
                </div>
                {week.signatureGrammarPatterns && week.signatureGrammarPatterns.length > 0 && (
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-stone-400 mb-3">
                      Signature patterns
                    </p>
                    <ul className="space-y-1.5">
                      {week.signatureGrammarPatterns.map((p, i) => (
                        <li key={i}>
                          <code className="text-xs bg-stone-100 px-2 py-0.5 rounded font-mono text-stone-800">
                            {p}
                          </code>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {week.culturalTouchstones && week.culturalTouchstones.length > 0 && (
                <div className="mt-7 pt-6 border-t border-stone-100">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-stone-400 mb-3">
                    Cultural touchstones
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {week.culturalTouchstones.map((t, i) => (
                      <span
                        key={i}
                        className="text-xs px-2.5 py-1 rounded-md border border-stone-200 bg-stone-50 text-stone-700"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {week.isGroupedRange && (
                <div className="mt-5 p-4 rounded-lg bg-orange-50/60 border border-orange-100">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-orange-700 mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    Part of a multi-week unit
                  </p>
                  <p className="text-sm text-stone-700 leading-relaxed">
                    This is one of weeks {week.groupRangeStart}–{week.groupRangeEnd} sharing the same theme.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="bg-stone-100/80 mb-6">
              <TabsTrigger value="lesson" className="gap-1.5">
                <BookOpen className="w-3.5 h-3.5" /> Lesson
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="generate" className="gap-1.5">
                  <Wand2 className="w-3.5 h-3.5" /> {lesson ? "Regenerate" : "Generate"}
                </TabsTrigger>
              )}
              <TabsTrigger value="notes" className="gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Notes
                {note.trim() && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 ml-0.5" />}
              </TabsTrigger>
              <TabsTrigger value="reference" className="gap-1.5">
                <BookOpen className="w-3.5 h-3.5" /> Reference
              </TabsTrigger>
            </TabsList>

            {/* LESSON tab — everyone */}
            <TabsContent value="lesson">
              {lessonLoading ? (
                <div className="bg-white rounded-2xl border border-stone-200/70 shadow-sm p-12 text-center">
                  <div className="font-display text-lg text-stone-300 animate-pulse">Loading lesson…</div>
                </div>
              ) : lesson ? (
                <LessonViewer
                  lesson={lesson}
                  week={week}
                  lang={lang}
                  isAdmin={isAdmin}
                  onDeleted={refresh}
                  onRegenerate={() => { refresh(); setActiveTab("generate"); }}
                  onUpdated={refresh}
                />
              ) : (
                <div className="bg-white rounded-2xl border border-stone-200/70 shadow-sm p-12 text-center">
                  <Clock className="w-8 h-8 text-stone-300 mx-auto mb-4" />
                  <h3 className="font-display text-xl font-semibold text-stone-900 mb-2">
                    This lesson isn&apos;t ready yet
                  </h3>
                  <p className="text-sm text-stone-500 max-w-md mx-auto leading-relaxed">
                    {isAdmin
                      ? "No lesson has been published for this week. Use the Generate tab to create and publish one."
                      : "The team is still building out this week. Check back soon — or explore weeks that are already available."}
                  </p>
                  {isAdmin ? (
                    <button
                      onClick={() => setActiveTab("generate")}
                      className="mt-5 inline-flex items-center gap-1.5 h-9 px-4 rounded-md text-sm font-medium bg-stone-900 hover:bg-stone-800 text-white"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      Generate this lesson
                    </button>
                  ) : (
                    <Link
                      href={`/${langCode}/curriculum`}
                      className="mt-5 inline-flex items-center gap-1.5 h-9 px-4 rounded-md text-sm font-medium border border-stone-300 hover:bg-stone-50 text-stone-700"
                    >
                      Browse available weeks
                    </Link>
                  )}
                </div>
              )}
            </TabsContent>

            {/* GENERATE/REGENERATE tab — admins only */}
            {isAdmin && (
              <TabsContent value="generate">
                {lesson && (
                  <div className="mb-6 p-4 rounded-lg bg-orange-50/60 border border-orange-100 text-sm text-stone-700">
                    <strong className="text-orange-900">Heads up:</strong> publishing here overwrites the live lesson for this week — everyone sees the new version.
                  </div>
                )}
                <LessonGenerator
                  langCode={langCode}
                  weekNumber={weekNumber}
                  initialContent={lesson?.content}
                  onSaved={() => { refresh(); setActiveTab("lesson"); }}
                />
              </TabsContent>
            )}

            <TabsContent value="notes">
              <div id="notes-section" className="bg-white rounded-xl border border-stone-200/70 shadow-sm p-6 scroll-mt-20">
                <div className="flex items-baseline justify-between gap-4 mb-3 flex-wrap">
                  <h3 className="font-display text-lg font-semibold text-stone-900 tracking-tight">
                    Your notes for Week {week.number}
                  </h3>
                  <p className="text-xs text-stone-400">
                    {noteSaved ? "Saved" : "Unsaved changes"}
                  </p>
                </div>
                <Textarea
                  value={note}
                  onChange={(e) => handleNoteChange(e.target.value)}
                  placeholder="Anything you want to remember about this week — questions, observations, things to revisit, recommended supplementary resources..."
                  className="min-h-72 resize-y border-stone-200 bg-white focus-visible:border-orange-300 focus-visible:ring-orange-200/40"
                />
                <div className="flex justify-end mt-4">
                  <button
                    onClick={handleNoteSave}
                    disabled={noteSaved}
                    className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md text-sm font-medium bg-stone-900 hover:bg-stone-800 text-white disabled:bg-stone-200 disabled:text-stone-400"
                  >
                    Save notes
                  </button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reference">
              <div className="space-y-6">
                {addendum && (
                  <details id="ref-addendum" className="bg-white rounded-xl border border-stone-200/70 shadow-sm group scroll-mt-20">
                    <summary className="cursor-pointer px-5 py-4 list-none hover:bg-stone-50/60 transition-colors">
                      <div className="flex items-baseline justify-between gap-4">
                        <h3 className="font-display text-lg font-semibold text-stone-900 tracking-tight">
                          {lang.name} pedagogical addendum
                        </h3>
                        <span className="text-xs text-stone-400">click to expand</span>
                      </div>
                    </summary>
                    <div className="px-5 pb-6 pt-2 border-t border-stone-100">
                      <article className="prose prose-stone prose-sm max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{addendum}</ReactMarkdown>
                      </article>
                    </div>
                  </details>
                )}
                <details id="ref-language" className="bg-white rounded-xl border border-stone-200/70 shadow-sm group scroll-mt-20">
                  <summary className="cursor-pointer px-5 py-4 list-none hover:bg-stone-50/60 transition-colors">
                    <div className="flex items-baseline justify-between gap-4">
                      <h3 className="font-display text-lg font-semibold text-stone-900 tracking-tight">
                        {lang.name} curriculum reference
                      </h3>
                      <span className="text-xs text-stone-400">click to expand · large doc</span>
                    </div>
                  </summary>
                  <div className="px-5 pb-6 pt-2 border-t border-stone-100">
                    <article className="prose prose-stone prose-sm max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{langRef}</ReactMarkdown>
                    </article>
                  </div>
                </details>
                <details id="ref-foundations" className="bg-white rounded-xl border border-stone-200/70 shadow-sm group scroll-mt-20">
                  <summary className="cursor-pointer px-5 py-4 list-none hover:bg-stone-50/60 transition-colors">
                    <div className="flex items-baseline justify-between gap-4">
                      <h3 className="font-display text-lg font-semibold text-stone-900 tracking-tight">
                        Pedagogy foundations
                      </h3>
                      <span className="text-xs text-stone-400">click to expand · the universal framework</span>
                    </div>
                  </summary>
                  <div className="px-5 pb-6 pt-2 border-t border-stone-100">
                    <article className="prose prose-stone prose-sm max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{pedagogyFoundations}</ReactMarkdown>
                    </article>
                  </div>
                </details>
              </div>
            </TabsContent>
          </Tabs>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-14 pt-8 border-t border-stone-200/70">
            {prev ? (
              <Link
                href={`/${langCode}/lesson/${prev}`}
                className="group inline-flex items-center gap-2 text-sm text-stone-600 hover:text-orange-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                <span>
                  <span className="block text-[10px] uppercase tracking-widest text-stone-400">Previous</span>
                  <span className="font-medium">Week {prev}</span>
                </span>
              </Link>
            ) : <div />}

            <Link
              href={`/${langCode}/curriculum`}
              className="text-xs text-stone-400 hover:text-orange-800 transition-colors uppercase tracking-widest"
            >
              All weeks
            </Link>

            {next ? (
              <Link
                href={`/${langCode}/lesson/${next}`}
                className="group inline-flex items-center gap-2 text-sm text-stone-600 hover:text-orange-800 transition-colors text-right"
              >
                <span>
                  <span className="block text-[10px] uppercase tracking-widest text-stone-400">Next</span>
                  <span className="font-medium">Week {next}</span>
                </span>
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ) : <div />}
          </div>
          </div>

          {/* Sidebar TOC */}
          <aside className="hidden lg:block">
            <div className="sticky top-20 pt-2">
              <TableOfContents items={tocItems} />
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
