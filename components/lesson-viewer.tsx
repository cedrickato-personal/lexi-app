"use client";

import { useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Download, Edit2, Trash2, RefreshCw, Copy, Check } from "lucide-react";
import { slugifyHeading } from "@/components/table-of-contents";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteLesson, saveLesson } from "@/lib/storage";
import { pushLesson, deleteLessonCloud } from "@/lib/storage-sync";
import { useAuth } from "@/components/auth-provider";
import type { SavedLesson } from "@/lib/storage";
import type { Week } from "@/lib/types";
import type { LanguageMeta } from "@/lib/languages";
import { FAMILY_THEMES } from "@/lib/family-theme";
import { toast } from "sonner";

interface LessonViewerProps {
  lesson: SavedLesson;
  week: Week;
  lang: LanguageMeta;
  onDeleted: () => void;
  onRegenerate: () => void;
  onUpdated: () => void;
}

export function LessonViewer({
  lesson,
  week,
  lang,
  onDeleted,
  onRegenerate,
  onUpdated,
}: LessonViewerProps) {
  const { user } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [regenOpen, setRegenOpen] = useState(false);
  const [editContent, setEditContent] = useState(lesson.content);
  const [copied, setCopied] = useState(false);

  const theme = FAMILY_THEMES[lang.family];
  const slug = week.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const filename = `${lang.code}-week-${week.number}-${slug}`;

  const copyLesson = useCallback(async () => {
    await navigator.clipboard.writeText(lesson.content);
    setCopied(true);
    toast.success("Lesson copied");
    setTimeout(() => setCopied(false), 2000);
  }, [lesson.content]);

  const downloadMd = useCallback(() => {
    const blob = new Blob([lesson.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [lesson.content, filename]);

  const downloadJson = useCallback(() => {
    const payload = { lang: lang.code, langName: lang.name, ...lesson, week };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [lang, lesson, week, filename]);

  const handleEdit = useCallback(() => {
    const content = editContent.trim();
    saveLesson(lang.code, week.number, content);
    if (user) pushLesson(user.id, lang.code, week.number, content).catch(() => {});
    toast.success("Lesson updated");
    setEditOpen(false);
    onUpdated();
  }, [lang.code, week.number, editContent, onUpdated, user]);

  const handleDelete = useCallback(() => {
    deleteLesson(lang.code, week.number);
    if (user) deleteLessonCloud(user.id, lang.code, week.number).catch(() => {});
    toast.success("Lesson deleted");
    setDeleteOpen(false);
    onDeleted();
  }, [lang.code, week.number, onDeleted, user]);

  const handleRegen = useCallback(() => {
    deleteLesson(lang.code, week.number);
    if (user) deleteLessonCloud(user.id, lang.code, week.number).catch(() => {});
    setRegenOpen(false);
    onRegenerate();
  }, [lang.code, week.number, onRegenerate, user]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5 mb-8 p-2 rounded-xl bg-white border border-stone-200/70 shadow-sm">
        <button onClick={copyLesson} className="inline-flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-medium text-stone-700 hover:bg-stone-100 transition-colors">
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
        <button onClick={() => { setEditContent(lesson.content); setEditOpen(true); }} className="inline-flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-medium text-stone-700 hover:bg-stone-100 transition-colors">
          <Edit2 className="w-3.5 h-3.5" /> Edit
        </button>
        <span className="w-px h-5 bg-stone-200 mx-1" />
        <button onClick={downloadMd} className="inline-flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-medium text-stone-700 hover:bg-stone-100 transition-colors">
          <Download className="w-3.5 h-3.5" /> Markdown
        </button>
        <button onClick={downloadJson} className="inline-flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-medium text-stone-700 hover:bg-stone-100 transition-colors">
          <Download className="w-3.5 h-3.5" /> JSON
        </button>
        <span className="w-px h-5 bg-stone-200 mx-1" />
        <button onClick={() => setRegenOpen(true)} className="inline-flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-medium text-orange-800 hover:bg-orange-50 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Regenerate
        </button>
        <button onClick={() => setDeleteOpen(true)} className="inline-flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-medium text-red-600 hover:bg-red-50 transition-colors ml-auto">
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </button>
      </div>

      <article className="bg-white rounded-2xl border border-stone-200/70 shadow-sm p-8 md:p-12">
        <div
          className="prose prose-stone prose-sm max-w-none
            prose-headings:font-display prose-headings:tracking-tight prose-headings:text-stone-900
            prose-h1:hidden
            prose-h2:text-2xl prose-h2:font-semibold prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:border-stone-100 prose-h2:pb-3 first:prose-h2:mt-0
            prose-h3:text-lg prose-h3:font-semibold prose-h3:mt-7 prose-h3:mb-2
            prose-h4:text-base prose-h4:font-semibold prose-h4:mt-5 prose-h4:mb-2
            prose-p:text-stone-700 prose-p:leading-[1.75] prose-p:text-[15px]
            prose-li:text-stone-700 prose-li:text-[15px] prose-li:leading-relaxed
            prose-table:text-sm prose-table:my-6
            prose-th:bg-stone-50 prose-th:font-semibold prose-th:text-stone-700 prose-th:px-3 prose-th:py-2 prose-th:border-stone-200
            prose-td:px-3 prose-td:py-2 prose-td:border-stone-100 prose-td:align-top
            prose-code:bg-stone-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[13px] prose-code:font-mono prose-code:before:hidden prose-code:after:hidden prose-code:text-stone-800
            prose-pre:bg-stone-50 prose-pre:border prose-pre:border-stone-200 prose-pre:rounded-lg prose-pre:text-[13px] prose-pre:text-stone-700 prose-pre:shadow-none
            prose-a:no-underline hover:prose-a:underline prose-a:font-medium
            prose-strong:text-stone-900 prose-strong:font-semibold
            prose-em:text-stone-700
            prose-blockquote:bg-stone-50/60 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r prose-blockquote:not-italic prose-blockquote:text-stone-700
            prose-hr:border-stone-200"
          style={{
            ["--tw-prose-links" as string]: theme.accentHex,
          } as React.CSSProperties}
          dir={lang.rtl ? "auto" : "ltr"}
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
            {lesson.content}
          </ReactMarkdown>
        </div>
      </article>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit lesson</DialogTitle>
            <DialogDescription>Modify the lesson content. Changes save immediately.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="font-mono text-xs min-h-96 resize-y"
          />
          <DialogFooter>
            <button onClick={() => setEditOpen(false)} className="px-4 h-9 rounded-md border border-stone-200 text-sm hover:bg-stone-50">
              Cancel
            </button>
            <button onClick={handleEdit} className="px-4 h-9 rounded-md bg-stone-900 hover:bg-stone-800 text-white text-sm">
              Save changes
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete lesson?</DialogTitle>
            <DialogDescription>
              This permanently removes {lang.name} Week {week.number}: {week.title}. Cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button onClick={() => setDeleteOpen(false)} className="px-4 h-9 rounded-md border border-stone-200 text-sm hover:bg-stone-50">
              Cancel
            </button>
            <button onClick={handleDelete} className="px-4 h-9 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm">
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={regenOpen} onOpenChange={setRegenOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate lesson?</DialogTitle>
            <DialogDescription>
              Deletes the saved lesson and returns to the generator. Your notes are preserved.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button onClick={() => setRegenOpen(false)} className="px-4 h-9 rounded-md border border-stone-200 text-sm hover:bg-stone-50">
              Cancel
            </button>
            <button onClick={handleRegen} className="px-4 h-9 rounded-md bg-orange-700 hover:bg-orange-800 text-white text-sm">
              Yes, regenerate
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
