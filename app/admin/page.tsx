"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, RefreshCw, FileText, Plus, Pencil, Trash2 } from "lucide-react";
import { Nav } from "@/components/nav";
import { useAuth } from "@/components/auth-provider";
import { fetchAuditLog, fetchAllAvailableCounts, type AuditEntry } from "@/lib/lessons";
import { LANGUAGES } from "@/lib/languages";

const ACTION_META: Record<string, { label: string; icon: React.ElementType; cls: string }> = {
  "lesson.create": { label: "Published", icon: Plus, cls: "text-emerald-700 bg-emerald-50" },
  "lesson.update": { label: "Updated", icon: Pencil, cls: "text-sky-700 bg-sky-50" },
  "lesson.delete": { label: "Deleted", icon: Trash2, cls: "text-red-700 bg-red-50" },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function AdminPage() {
  const router = useRouter();
  const { isAdmin, loading, mode } = useAuth();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading) return;
    // Non-admins (and guests) don't belong here.
    if (mode === "anonymous") {
      router.replace("/auth?next=/admin");
      return;
    }
    if (!isAdmin) {
      router.replace("/");
      return;
    }
    load();
  }, [loading, isAdmin, mode, router]);

  const load = () => {
    setFetching(true);
    Promise.all([fetchAuditLog(300), fetchAllAvailableCounts()])
      .then(([log, c]) => {
        setEntries(log);
        setCounts(c);
      })
      .finally(() => setFetching(false));
  };

  if (loading || !isAdmin) return null;

  const totalPublished = Object.values(counts).reduce((s, n) => s + n, 0);
  const languagesWithContent = Object.values(counts).filter((n) => n > 0).length;

  return (
    <>
      <Nav />
      <main className="min-h-[calc(100vh-3.5rem)]">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-orange-700" />
            <p className="text-xs uppercase tracking-[0.22em] text-orange-800/80 font-medium">
              Admin
            </p>
          </div>
          <div className="flex items-baseline justify-between gap-4 flex-wrap mb-10">
            <h1 className="font-display text-4xl md:text-5xl font-semibold text-stone-900 tracking-tight">
              Activity <span className="italic text-orange-800">log</span>
            </h1>
            <button
              onClick={load}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md text-sm font-medium border border-stone-300 bg-white hover:bg-stone-50 text-stone-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${fetching ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {/* Library summary */}
          <div className="grid grid-cols-2 gap-4 mb-10">
            <div className="bg-white rounded-xl border border-stone-200/70 shadow-sm p-6">
              <p className="text-[10px] font-mono uppercase tracking-widest text-stone-400 mb-2">
                Lessons published
              </p>
              <p className="font-display text-4xl font-semibold text-stone-900 tabular-nums">
                {totalPublished.toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-stone-200/70 shadow-sm p-6">
              <p className="text-[10px] font-mono uppercase tracking-widest text-stone-400 mb-2">
                Languages with content
              </p>
              <p className="font-display text-4xl font-semibold text-stone-900 tabular-nums">
                {languagesWithContent}
                <span className="text-stone-300 text-2xl"> / {Object.keys(LANGUAGES).length}</span>
              </p>
            </div>
          </div>

          {/* Audit log */}
          <h2 className="font-display text-lg font-semibold text-stone-900 mb-4">
            Recent actions
          </h2>
          {fetching ? (
            <div className="bg-white rounded-xl border border-stone-200/70 p-12 text-center text-stone-400 animate-pulse">
              Loading…
            </div>
          ) : entries.length === 0 ? (
            <div className="bg-white rounded-xl border border-stone-200/70 p-12 text-center">
              <FileText className="w-8 h-8 text-stone-300 mx-auto mb-3" />
              <p className="text-sm text-stone-500">
                No activity yet. When admins publish, update, or delete lessons, it shows up here.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-stone-200/70 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50/60 text-left">
                    <th className="font-mono text-[10px] uppercase tracking-widest text-stone-400 font-medium px-4 py-3">Action</th>
                    <th className="font-mono text-[10px] uppercase tracking-widest text-stone-400 font-medium px-4 py-3">Lesson</th>
                    <th className="font-mono text-[10px] uppercase tracking-widest text-stone-400 font-medium px-4 py-3">By</th>
                    <th className="font-mono text-[10px] uppercase tracking-widest text-stone-400 font-medium px-4 py-3 text-right">When</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => {
                    const meta = ACTION_META[e.action] ?? {
                      label: e.action,
                      icon: FileText,
                      cls: "text-stone-600 bg-stone-100",
                    };
                    const Icon = meta.icon;
                    const langName = e.langCode ? LANGUAGES[e.langCode]?.name ?? e.langCode : "—";
                    return (
                      <tr key={e.id} className="border-b border-stone-50 last:border-0 hover:bg-stone-50/40">
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${meta.cls}`}>
                            <Icon className="w-3 h-3" />
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-stone-700">
                          {e.langCode ? (
                            <Link
                              href={`/${e.langCode}/lesson/${e.weekNumber}`}
                              className="hover:text-orange-800 transition-colors"
                            >
                              {langName} · Week {e.weekNumber}
                            </Link>
                          ) : (
                            "—"
                          )}
                          {e.detail && <span className="text-stone-400 text-xs ml-2">({e.detail})</span>}
                        </td>
                        <td className="px-4 py-3 text-stone-600 text-xs">{e.userEmail ?? "—"}</td>
                        <td className="px-4 py-3 text-stone-400 text-xs text-right tabular-nums" title={new Date(e.createdAt).toLocaleString()}>
                          {timeAgo(e.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
