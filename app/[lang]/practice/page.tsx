"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChevronRight, Dumbbell } from "lucide-react";
import { Nav } from "@/components/nav";
import { LANGUAGES } from "@/lib/languages";
import { FAMILY_THEMES } from "@/lib/family-theme";
import { getLanguageReference } from "@/lib/references";
import { touchLanguage } from "@/lib/storage";

function extractPracticeSection(refMarkdown: string): string {
  const headings = refMarkdown.split(/\n(?=#{1,3} )/g);
  const wanted = headings.filter((h) => {
    const first = h.split("\n")[0].toLowerCase();
    return (
      first.includes("practice") ||
      first.includes("habit") ||
      first.includes("daily") ||
      first.includes("study plan") ||
      first.includes("routine")
    );
  });
  if (wanted.length === 0) return "";
  return wanted.join("\n\n");
}

export default function PracticePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: langCode } = use(params);
  const router = useRouter();
  const [content, setContent] = useState("");
  const lang = LANGUAGES[langCode];
  const theme = lang ? FAMILY_THEMES[lang.family] : null;

  useEffect(() => {
    if (!lang) {
      router.replace("/");
      return;
    }
    touchLanguage(langCode);
    const ref = getLanguageReference(langCode);
    setContent(extractPracticeSection(ref));
  }, [langCode, lang, router]);

  if (!lang || !theme) return null;

  return (
    <>
      <Nav activeLang={langCode} />
      <main className="min-h-[calc(100vh-3.5rem)]">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <nav className="flex items-center gap-1.5 text-xs text-stone-500 mb-6 font-mono">
            <Link href="/" className="hover:text-orange-800 transition-colors">all</Link>
            <ChevronRight className="w-3 h-3 text-stone-300" />
            <Link href={`/${langCode}`} className="hover:text-orange-800 transition-colors">{langCode}</Link>
            <ChevronRight className="w-3 h-3 text-stone-300" />
            <span className="text-stone-900">practice</span>
          </nav>

          <div className="mb-10">
            <p className="text-xs uppercase tracking-[0.22em] font-medium mb-4 flex items-center gap-2" style={{ color: theme.accentHex }}>
              <span className="inline-block w-8 h-px" style={{ backgroundColor: theme.accentHex }} />
              {lang.name} · Between Lessons
            </p>
            <h1 className="font-display text-4xl md:text-5xl font-semibold text-stone-900 tracking-tight mb-3">
              Daily <span className="italic" style={{ color: theme.accentHex }}>practice</span>
            </h1>
            <p className="text-base text-stone-600 max-w-2xl leading-relaxed">
              The weekly lesson is the spine. Daily practice is where fluency is built.
            </p>
          </div>

          {content ? (
            <article className="bg-white rounded-2xl border border-stone-200/70 shadow-sm p-8 md:p-12">
              <div className="prose prose-stone prose-sm max-w-none
                prose-headings:font-display prose-headings:tracking-tight prose-headings:text-stone-900
                prose-h1:text-3xl prose-h1:font-semibold prose-h1:mt-0 prose-h1:mb-6
                prose-h2:text-2xl prose-h2:font-semibold prose-h2:mt-10 prose-h2:mb-4
                prose-h3:text-lg prose-h3:font-semibold prose-h3:mt-7 prose-h3:mb-2
                prose-p:text-stone-700 prose-p:leading-[1.75] prose-p:text-[15px]
                prose-li:text-stone-700 prose-li:text-[15px] prose-li:leading-relaxed prose-li:my-1
                prose-a:text-orange-800 prose-a:no-underline hover:prose-a:underline prose-a:font-medium
                prose-strong:text-stone-900 prose-strong:font-semibold
                prose-table:text-sm prose-th:bg-stone-50 prose-th:font-semibold prose-th:px-3 prose-th:py-2
                prose-td:px-3 prose-td:py-2
                prose-hr:border-stone-200">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
              </div>
            </article>
          ) : (
            <div className="bg-white rounded-xl border border-stone-200/70 p-12 text-center">
              <Dumbbell className="w-8 h-8 text-stone-300 mx-auto mb-3" />
              <p className="text-sm text-stone-500">
                No dedicated practice section found in the {lang.name} reference. Check the full reference on any lesson page.
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
