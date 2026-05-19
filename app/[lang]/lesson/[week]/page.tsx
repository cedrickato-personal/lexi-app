"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChevronLeft, ChevronRight, Sparkles, FileText, BookOpen, Wand2 } from "lucide-react";
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
  getLesson,
  getNote,
  saveNote,
  touchLanguage,
} from "@/lib/storage";
import { pushNote } from "@/lib/storage-sync";
import { useAuth } from "@/components/auth-provider";
import {
  getLanguageReference,
  getLanguageAddendum,
  pedagogyFoundations,
} from "@/lib/references";
import type { SavedLesson } from "@/lib/storage";
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

  const { user } = useAuth();
  const [week, setWeek] = useState<Week | null>(null);
  const [lesson, setLesson] = useState<SavedLesson | null>(null);
  const [note, setNote] = useState("");
  const [noteSaved, setNoteSaved] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<string>("generate");

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
    const saved = getLesson(langCode, weekNumber);
    setLesson(saved);
    setNote(getNote(langCode, weekNumber));
    setActiveTab(saved ? "lesson" : "generate");
    touchLanguage(langCode);
  }, [langCode, weekNumber, lang, curriculum, refreshKey, router]);

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
        <div className="max-w-4xl mx-auto px-6 py-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-stone-500 mb-8 font-mono">
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
          <div className="bg-white rounded-2xl border border-stone-200/70 shadow-sm mb-10 overflow-hidden">
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
              {lesson ? (
                <>
                  <TabsTrigger value="lesson" className="gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" /> Lesson
                  </TabsTrigger>
                  <TabsTrigger value="regenerate" className="gap-1.5">
                    <Wand2 className="w-3.5 h-3.5" /> Regenerate
                  </TabsTrigger>
                </>
              ) : (
                <TabsTrigger value="generate" className="gap-1.5">
                  <Wand2 className="w-3.5 h-3.5" /> Generate
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

            {lesson ? (
              <>
                <TabsContent value="lesson">
                  <LessonViewer
                    lesson={lesson}
                    week={week}
                    lang={lang}
                    onDeleted={refresh}
                    onRegenerate={() => { refresh(); setActiveTab("generate"); }}
                    onUpdated={refresh}
                  />
                </TabsContent>
                <TabsContent value="regenerate">
                  <div className="mb-6 p-4 rounded-lg bg-orange-50/60 border border-orange-100 text-sm text-stone-700">
                    <strong className="text-orange-900">Heads up:</strong> regenerating will overwrite your saved lesson. Your notes will stay.
                  </div>
                  <LessonGenerator
                    langCode={langCode}
                    weekNumber={weekNumber}
                    initialContent={lesson.content}
                    onSaved={refresh}
                  />
                </TabsContent>
              </>
            ) : (
              <TabsContent value="generate">
                <LessonGenerator
                  langCode={langCode}
                  weekNumber={weekNumber}
                  onSaved={() => { refresh(); setActiveTab("lesson"); }}
                />
              </TabsContent>
            )}

            <TabsContent value="notes">
              <div className="bg-white rounded-xl border border-stone-200/70 shadow-sm p-6">
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
                  <details className="bg-white rounded-xl border border-stone-200/70 shadow-sm group">
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
                <details className="bg-white rounded-xl border border-stone-200/70 shadow-sm group">
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
                <details className="bg-white rounded-xl border border-stone-200/70 shadow-sm group">
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
      </main>
    </>
  );
}
