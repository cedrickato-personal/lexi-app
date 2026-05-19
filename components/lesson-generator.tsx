"use client";

import { useState, useCallback, useMemo } from "react";
import { Copy, Check, ExternalLink, Save, Clipboard } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { buildPrompt } from "@/lib/prompt-builder";
import { saveLesson, getProfile } from "@/lib/storage";
import { pushLesson } from "@/lib/storage-sync";
import { useAuth } from "@/components/auth-provider";
import { toast } from "sonner";

interface LessonGeneratorProps {
  langCode: string;
  weekNumber: number;
  initialContent?: string;
  onSaved: () => void;
}

function Step({
  n,
  title,
  active,
  done,
  children,
}: {
  n: string;
  title: string;
  active?: boolean;
  done?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`relative w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-colors shrink-0 ${
            done
              ? "bg-emerald-600 text-white"
              : active
              ? "bg-orange-700 text-white"
              : "bg-stone-200 text-stone-500"
          }`}
        >
          {done ? <Check className="w-4 h-4" /> : n}
        </div>
        <h3 className="font-display text-lg font-semibold text-stone-900 tracking-tight">{title}</h3>
      </div>
      <div className="ml-11">{children}</div>
    </div>
  );
}

export function LessonGenerator({
  langCode,
  weekNumber,
  initialContent = "",
  onSaved,
}: LessonGeneratorProps) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [opened, setOpened] = useState(false);
  const [response, setResponse] = useState(initialContent);

  const prompt = useMemo(() => {
    try {
      return buildPrompt(langCode, weekNumber, getProfile());
    } catch (err) {
      return `# Error building prompt\n\n${err instanceof Error ? err.message : "Unknown error"}`;
    }
  }, [langCode, weekNumber]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    toast.success(`Copied · ${prompt.length.toLocaleString()} characters`);
    setTimeout(() => setCopied(false), 2500);
  }, [prompt]);

  const handlePasteFromClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setResponse(text);
    } catch {
      toast.error("Couldn't read clipboard");
    }
  }, []);

  const handleSave = useCallback(() => {
    if (response.trim().length < 200) {
      toast.error("Lesson seems too short. Add more content or paste the full response.");
      return;
    }
    const content = response.trim();
    saveLesson(langCode, weekNumber, content);
    if (user) {
      pushLesson(user.id, langCode, weekNumber, content).catch(() => {});
    }
    toast.success(user ? "Lesson saved · synced to cloud" : "Lesson saved");
    onSaved();
  }, [langCode, weekNumber, response, onSaved, user]);

  const charCount = response.length;
  const minChars = 200;
  const canSave = response.trim().length >= minChars;

  return (
    <div className="relative">
      <div className="absolute left-4 top-8 bottom-8 w-px bg-stone-200/80 -z-0" />

      <div className="space-y-12 relative">
        <Step n="01" title="Copy the prompt" active={!copied} done={copied}>
          <div className="bg-white rounded-xl border border-stone-200/70 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-stone-100 bg-stone-50/60">
              <span className="font-mono text-[10px] uppercase tracking-widest text-stone-500">
                lesson-prompt.md · {prompt.length.toLocaleString()} chars
              </span>
              <button
                onClick={handleCopy}
                className={`inline-flex items-center gap-1.5 px-3 h-7 rounded-md text-xs font-medium transition-all ${
                  copied
                    ? "bg-emerald-600 text-white"
                    : "bg-orange-700 text-white hover:bg-orange-800 shadow-sm"
                }`}
              >
                {copied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
              </button>
            </div>
            <pre className="px-5 py-4 text-xs font-mono leading-relaxed overflow-auto max-h-72 whitespace-pre-wrap text-stone-700">
              {prompt}
            </pre>
            <p className="px-4 py-2 text-[11px] text-stone-400 border-t border-stone-100 bg-stone-50/40">
              This prompt is long — it includes the full pedagogy foundations + the {langCode.toUpperCase()} language reference. Claude.ai handles it fine.
            </p>
          </div>
        </Step>

        <Step n="02" title="Paste into Claude.ai" active={copied && !opened} done={opened}>
          <div className="bg-white rounded-xl border border-stone-200/70 shadow-sm p-6">
            <p className="text-sm text-stone-600 leading-relaxed mb-4 max-w-xl">
              Open a new chat at claude.ai, paste the prompt, and wait for the response.
              Expect a 2,500–4,000 word lesson — give it a minute to fully generate.
            </p>
            <a
              href="https://claude.ai/new"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpened(true)}
              className="inline-flex items-center gap-2 rounded-lg h-9 px-4 text-sm font-medium border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 transition-all shadow-sm hover:shadow"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Claude.ai
            </a>
          </div>
        </Step>

        <Step n="03" title="Paste the response back" active={opened || copied} done={canSave}>
          <div className="bg-white rounded-xl border border-stone-200/70 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-stone-500">Paste the full lesson markdown below.</p>
              <button
                onClick={handlePasteFromClipboard}
                className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-orange-800 transition-colors"
              >
                <Clipboard className="w-3 h-3" />
                Paste from clipboard
              </button>
            </div>
            <Textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder={`### 1. Lesson Overview\n\nBy the end of this week, you will...`}
              className="font-mono text-xs leading-relaxed min-h-72 resize-y border-stone-200 focus-visible:border-orange-300 focus-visible:ring-orange-200/40 bg-stone-50/40"
            />
            <div className="flex justify-between items-center mt-4">
              <p className="text-xs text-stone-400 tabular-nums">
                {charCount === 0 ? (
                  <span>Minimum {minChars.toLocaleString()} characters</span>
                ) : canSave ? (
                  <span className="text-emerald-700 font-medium">{charCount.toLocaleString()} characters · ready</span>
                ) : (
                  <span>{charCount.toLocaleString()} / {minChars.toLocaleString()} characters</span>
                )}
              </p>
              <button
                onClick={handleSave}
                disabled={!canSave}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md text-sm font-medium bg-stone-900 hover:bg-stone-800 text-white disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed shadow-sm"
              >
                <Save className="w-4 h-4" />
                Save lesson
              </button>
            </div>
          </div>
        </Step>
      </div>
    </div>
  );
}
