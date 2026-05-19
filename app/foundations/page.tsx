"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Nav } from "@/components/nav";
import { TableOfContents, useMarkdownToc, slugifyHeading } from "@/components/table-of-contents";
import { pedagogyFoundations } from "@/lib/references";

export default function FoundationsPage() {
  const [content, setContent] = useState("");
  const toc = useMarkdownToc(content, false);

  useEffect(() => {
    setContent(pedagogyFoundations);
  }, []);

  return (
    <>
      <Nav />
      <main className="min-h-[calc(100vh-3.5rem)]">
        <div className="max-w-6xl mx-auto px-6 py-12 lg:grid lg:grid-cols-[1fr_220px] lg:gap-x-12">
          <div className="min-w-0">
            <div className="mb-10">
              <p className="text-xs uppercase tracking-[0.22em] text-orange-800/80 font-medium mb-4 flex items-center gap-2">
                <span className="inline-block w-8 h-px bg-orange-700/60" />
                The Research
              </p>
              <h1 className="font-display text-4xl md:text-5xl font-semibold text-stone-900 tracking-tight mb-3">
                Pedagogy <span className="italic text-orange-800">foundations</span>
              </h1>
              <p className="text-base text-stone-600 max-w-2xl leading-relaxed">
                The research-grounded principles behind this curriculum. Referenced by every
                generated lesson.
              </p>
            </div>

            <article className="bg-white rounded-2xl border border-stone-200/70 shadow-sm p-8 md:p-12">
              <div
                className="prose prose-stone prose-sm max-w-none
                  prose-headings:font-display prose-headings:tracking-tight prose-headings:text-stone-900
                  prose-h1:text-3xl prose-h1:font-semibold prose-h1:mt-0 prose-h1:mb-8 prose-h1:pb-4 prose-h1:border-b prose-h1:border-stone-200
                  prose-h2:text-xl prose-h2:font-semibold prose-h2:mt-10 prose-h2:mb-4
                  prose-h3:text-base prose-h3:font-semibold prose-h3:mt-7 prose-h3:mb-2 prose-h3:text-stone-800
                  prose-p:text-stone-700 prose-p:leading-[1.75] prose-p:text-[15px]
                  prose-li:text-stone-700 prose-li:text-[15px] prose-li:leading-relaxed
                  prose-table:text-sm
                  prose-th:bg-stone-50 prose-th:font-semibold prose-th:px-3 prose-th:py-2
                  prose-td:px-3 prose-td:py-2 prose-td:align-top
                  prose-code:bg-stone-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[13px] prose-code:font-mono prose-code:before:hidden prose-code:after:hidden
                  prose-blockquote:border-orange-300 prose-blockquote:text-stone-600
                  prose-a:text-orange-800 prose-a:no-underline hover:prose-a:underline prose-a:font-medium
                  prose-strong:text-stone-900 prose-strong:font-semibold
                  prose-hr:border-stone-200"
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h2: ({ children, ...rest }) => {
                      const text = typeof children === "string" ? children : String(children);
                      return (
                        <h2 id={slugifyHeading(text)} className="scroll-mt-20" {...rest}>
                          {children}
                        </h2>
                      );
                    },
                    h3: ({ children, ...rest }) => {
                      const text = typeof children === "string" ? children : String(children);
                      return (
                        <h3 id={slugifyHeading(text)} className="scroll-mt-20" {...rest}>
                          {children}
                        </h3>
                      );
                    },
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            </article>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-20 pt-2">
              <TableOfContents items={toc} />
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
