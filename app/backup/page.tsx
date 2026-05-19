"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Download, Upload, Trash2, FileArchive, FileJson, RotateCcw, AlertCircle, Globe } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Nav } from "@/components/nav";
import {
  exportAll,
  importAll,
  clearAll,
  getAllLessons,
  getAllProgress,
  type BackupBlob,
} from "@/lib/storage";
import { LANGUAGES, LANGUAGES_LIST } from "@/lib/languages";
import { FAMILY_THEMES } from "@/lib/family-theme";
import { toast } from "sonner";

function Section({
  icon: Icon,
  title,
  description,
  children,
  destructive,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
  destructive?: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-xl border shadow-sm p-6 ${
        destructive ? "border-red-100" : "border-stone-200/70"
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${destructive ? "bg-red-50 text-red-600" : "bg-orange-50 text-orange-700"}`}>
          <Icon className="w-5 h-5" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-lg font-semibold text-stone-900 tracking-tight mb-1">{title}</h3>
          <p className="text-sm text-stone-600 leading-relaxed mb-4 max-w-xl">{description}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function BackupPage() {
  const [clearOpen, setClearOpen] = useState(false);
  const [progressByLang, setProgressByLang] = useState<Record<string, { completed: number; total: number }>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProgressByLang(getAllProgress());
  }, []);

  const totalCompleted = Object.values(progressByLang).reduce((s, p) => s + p.completed, 0);
  const languagesWithData = Object.entries(progressByLang).filter(([, p]) => p.completed > 0);

  const handleDownloadFullJson = useCallback(() => {
    const blob = exportAll();
    const data = new Blob([JSON.stringify(blob, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lexi-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup downloaded");
  }, []);

  const handleDownloadZip = useCallback(async () => {
    const JSZip = (await import("jszip")).default;
    const blob = exportAll();
    const zip = new JSZip();
    zip.file("metadata.json", JSON.stringify({
      schemaVersion: blob.schemaVersion,
      exportedAt: blob.exportedAt,
      languages: Object.fromEntries(
        Object.entries(blob.languages).map(([code, data]) => [
          code,
          {
            name: LANGUAGES[code]?.name,
            metadata: data.metadata,
            lessonCount: Object.keys(data.lessons).length,
            noteCount: Object.keys(data.notes).length,
          },
        ])
      ),
    }, null, 2));
    if (blob.profile) {
      zip.file("profile.json", JSON.stringify(blob.profile, null, 2));
    }
    for (const [code, data] of Object.entries(blob.languages)) {
      const folder = zip.folder(code);
      if (!folder) continue;
      for (const [weekStr, lesson] of Object.entries(data.lessons)) {
        folder.file(`week-${weekStr.padStart(3, "0")}.md`, lesson.content);
      }
      if (Object.keys(data.notes).length > 0) {
        folder.file("notes.json", JSON.stringify(data.notes, null, 2));
      }
    }
    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lexi-backup-${new Date().toISOString().slice(0, 10)}.zip`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("ZIP downloaded");
  }, []);

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const blob = JSON.parse(text) as BackupBlob;
      if (blob.schemaVersion !== "1.0") {
        throw new Error("Unsupported backup version");
      }
      const result = importAll(blob);
      const msg = [
        `${result.mergedLanguages} language${result.mergedLanguages === 1 ? "" : "s"}`,
        `${result.mergedLessons} new lesson${result.mergedLessons === 1 ? "" : "s"}`,
        result.overwrittenLessons > 0 ? `${result.overwrittenLessons} overwritten` : "",
      ].filter(Boolean).join(" · ");
      toast.success(`Imported: ${msg}`);
      if (result.errors.length > 0) {
        toast.error(`${result.errors.length} error(s) during import.`);
      }
      setProgressByLang(getAllProgress());
    } catch (err) {
      toast.error(`Import failed: ${err instanceof Error ? err.message : "Invalid file"}`);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }, []);

  const handleDownloadLanguage = useCallback((langCode: string) => {
    const lessons = getAllLessons(langCode);
    if (Object.keys(lessons).length === 0) return;
    const lang = LANGUAGES[langCode];
    const blob = {
      schemaVersion: "1.0",
      lang: langCode,
      langName: lang?.name,
      exportedAt: new Date().toISOString(),
      lessons,
    };
    const data = new Blob([JSON.stringify(blob, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lexi-${langCode}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${lang?.name} lessons downloaded`);
  }, []);

  const handleClear = useCallback(() => {
    clearAll();
    setProgressByLang(getAllProgress());
    setClearOpen(false);
    toast.success("All data cleared");
  }, []);

  return (
    <>
      <Nav />
      <main className="min-h-[calc(100vh-3.5rem)]">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <p className="text-xs uppercase tracking-[0.22em] text-orange-800/80 font-medium mb-4 flex items-center gap-2">
            <span className="inline-block w-8 h-px bg-orange-700/60" />
            Your Data
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-stone-900 tracking-tight mb-3">
            Backup &amp; <span className="italic text-orange-800">restore</span>
          </h1>
          <p className="text-base text-stone-600 max-w-xl mb-10 leading-relaxed">
            {totalCompleted.toLocaleString()} lesson{totalCompleted !== 1 ? "s" : ""} saved across{" "}
            {languagesWithData.length} language{languagesWithData.length !== 1 ? "s" : ""}. Export to keep them safe.
          </p>

          <div className="space-y-4">
            <Section
              icon={FileJson}
              title="Download full backup as JSON"
              description="Single structured JSON file with all lessons, notes, metadata, learner profile, and onboarding state. Easiest format to reimport."
            >
              <button
                onClick={handleDownloadFullJson}
                disabled={totalCompleted === 0}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-md text-sm font-medium bg-stone-900 hover:bg-stone-800 text-white disabled:bg-stone-200 disabled:text-stone-400"
              >
                <Download className="w-4 h-4" />
                Download backup ({totalCompleted} lessons)
              </button>
            </Section>

            <Section
              icon={FileArchive}
              title="Download as ZIP"
              description="Each lesson as a .md file, organized into per-language folders. Plus profile.json and metadata.json at the root."
            >
              <button
                onClick={handleDownloadZip}
                disabled={totalCompleted === 0}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-md text-sm font-medium border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 disabled:opacity-40"
              >
                <Download className="w-4 h-4" />
                Download ZIP archive
              </button>
            </Section>

            <Section
              icon={RotateCcw}
              title="Restore from JSON"
              description="Upload a previously exported JSON backup. Existing lessons for the same weeks will be overwritten."
            >
              <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
              <button
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-md text-sm font-medium border border-stone-300 bg-white hover:bg-stone-50 text-stone-800"
              >
                <Upload className="w-4 h-4" />
                Choose backup file
              </button>
            </Section>

            <Section
              icon={Trash2}
              title="Clear all data"
              description="Permanently delete every saved lesson, note, and the profile. There is no undo — export a backup first."
              destructive
            >
              <button
                onClick={() => setClearOpen(true)}
                disabled={totalCompleted === 0 && languagesWithData.length === 0}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-md text-sm font-medium border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-40"
              >
                <Trash2 className="w-4 h-4" />
                Clear all data
              </button>
            </Section>
          </div>

          {/* Per-language downloads */}
          {languagesWithData.length > 0 && (
            <section className="mt-12">
              <div className="flex items-baseline gap-2 mb-4">
                <Globe className="w-4 h-4 text-stone-400" />
                <h3 className="font-display text-xl font-semibold text-stone-900 tracking-tight">
                  Per-language exports
                </h3>
              </div>
              <p className="text-sm text-stone-500 mb-4">
                Download lessons for just one language.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {LANGUAGES_LIST.filter((l) => (progressByLang[l.code]?.completed ?? 0) > 0).map((lang) => {
                  const theme = FAMILY_THEMES[lang.family];
                  const p = progressByLang[lang.code];
                  return (
                    <button
                      key={lang.code}
                      onClick={() => handleDownloadLanguage(lang.code)}
                      className="flex items-center gap-3 p-3 rounded-lg border border-stone-200/70 bg-white hover:border-stone-300 hover:shadow-sm transition-all text-left"
                    >
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: theme.accentHex }} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-stone-900 text-sm">{lang.name}</p>
                        <p className="text-xs text-stone-500">{p.completed} / {p.total} lessons</p>
                      </div>
                      <Download className="w-3.5 h-3.5 text-stone-400" />
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </main>

      <Dialog open={clearOpen} onOpenChange={setClearOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              Clear all data?
            </DialogTitle>
            <DialogDescription>
              Permanently deletes every saved lesson, note, profile, and onboarding state.
              There is no undo. Download a backup first if you want to be safe.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setClearOpen(false)}
              className="px-4 h-9 rounded-md border border-stone-200 text-sm hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              onClick={handleClear}
              className="px-4 h-9 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm"
            >
              Yes, delete everything
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
