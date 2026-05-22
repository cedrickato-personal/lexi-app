// lib/lessons.ts
// Shared (global) lesson content. Lessons are authored by admins and read by
// everyone — they are NOT per-user. Per-user data (profile, notes) lives
// elsewhere. When Supabase isn't configured the app falls back to localStorage
// so guest/offline mode still works for a single device.

import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import {
  getLesson as getLocalLesson,
  saveLesson as saveLocalLesson,
  deleteLesson as deleteLocalLesson,
  getAllLessons as getAllLocalLessons,
} from "@/lib/storage";
import { LANGUAGES } from "@/lib/languages";

export interface SharedLesson {
  langCode: string;
  weekNumber: number;
  content: string;
  updatedAt: string;
  updatedBy?: string | null;
}

// ────────── Reads (everyone) ──────────

export async function fetchSharedLesson(
  langCode: string,
  weekNumber: number,
): Promise<SharedLesson | null> {
  if (!isSupabaseConfigured()) {
    const local = getLocalLesson(langCode, weekNumber);
    return local
      ? {
          langCode,
          weekNumber,
          content: local.content,
          updatedAt: local.updatedAt ?? local.savedAt,
        }
      : null;
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("shared_lessons")
    .select("*")
    .eq("lang_code", langCode)
    .eq("week_number", weekNumber)
    .maybeSingle();
  if (error || !data) return null;
  return {
    langCode: data.lang_code,
    weekNumber: data.week_number,
    content: data.content,
    updatedAt: data.updated_at,
    updatedBy: data.updated_by,
  };
}

export async function fetchAvailableWeeks(langCode: string): Promise<Set<number>> {
  if (!isSupabaseConfigured()) {
    return new Set(Object.keys(getAllLocalLessons(langCode)).map(Number));
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("shared_lessons")
    .select("week_number")
    .eq("lang_code", langCode);
  if (error || !data) return new Set();
  return new Set(data.map((r) => r.week_number as number));
}

/** One query: how many shared lessons exist per language. */
export async function fetchAllAvailableCounts(): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  for (const code of Object.keys(LANGUAGES)) out[code] = 0;

  if (!isSupabaseConfigured()) {
    for (const code of Object.keys(LANGUAGES)) {
      out[code] = Object.keys(getAllLocalLessons(code)).length;
    }
    return out;
  }
  const supabase = createClient();
  const { data, error } = await supabase.from("shared_lessons").select("lang_code");
  if (error || !data) return out;
  for (const row of data) {
    const code = row.lang_code as string;
    out[code] = (out[code] ?? 0) + 1;
  }
  return out;
}

// ────────── Writes (admins only — RLS also enforces this server-side) ──────────

async function logAudit(
  user: User,
  action: "lesson.create" | "lesson.update" | "lesson.delete",
  langCode: string,
  weekNumber: number,
  detail?: string,
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = createClient();
  await supabase.from("audit_log").insert({
    user_id: user.id,
    user_email: user.email ?? null,
    action,
    lang_code: langCode,
    week_number: weekNumber,
    detail: detail ?? null,
  });
}

export async function saveSharedLesson(
  langCode: string,
  weekNumber: number,
  content: string,
  user: User | null,
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    // Local fallback (single-device, guest)
    saveLocalLesson(langCode, weekNumber, content);
    return { ok: true };
  }
  if (!user) return { ok: false, error: "Not signed in" };

  const supabase = createClient();
  const now = new Date().toISOString();

  // Determine create vs. update for the audit action.
  const existing = await fetchSharedLesson(langCode, weekNumber);

  const { error } = await supabase.from("shared_lessons").upsert(
    {
      lang_code: langCode,
      week_number: weekNumber,
      content,
      updated_by: user.id,
      updated_at: now,
      ...(existing ? {} : { created_by: user.id, created_at: now }),
    },
    { onConflict: "lang_code,week_number" },
  );

  if (error) {
    // Most common cause: RLS rejected because the user isn't an admin.
    return {
      ok: false,
      error: error.message.includes("row-level security")
        ? "You don't have permission to publish lessons (admin only)."
        : error.message,
    };
  }

  await logAudit(
    user,
    existing ? "lesson.update" : "lesson.create",
    langCode,
    weekNumber,
    `${content.length.toLocaleString()} chars`,
  );
  return { ok: true };
}

export async function deleteSharedLesson(
  langCode: string,
  weekNumber: number,
  user: User | null,
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    deleteLocalLesson(langCode, weekNumber);
    return { ok: true };
  }
  if (!user) return { ok: false, error: "Not signed in" };

  const supabase = createClient();
  const { error } = await supabase
    .from("shared_lessons")
    .delete()
    .eq("lang_code", langCode)
    .eq("week_number", weekNumber);

  if (error) {
    return {
      ok: false,
      error: error.message.includes("row-level security")
        ? "You don't have permission to delete lessons (admin only)."
        : error.message,
    };
  }
  await logAudit(user, "lesson.delete", langCode, weekNumber);
  return { ok: true };
}

// ────────── Audit log (admin read) ──────────

export interface AuditEntry {
  id: number;
  userEmail: string | null;
  action: string;
  langCode: string | null;
  weekNumber: number | null;
  detail: string | null;
  createdAt: string;
}

export async function fetchAuditLog(limit = 200): Promise<AuditEntry[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map((r) => ({
    id: r.id as number,
    userEmail: r.user_email as string | null,
    action: r.action as string,
    langCode: r.lang_code as string | null,
    weekNumber: r.week_number as number | null,
    detail: r.detail as string | null,
    createdAt: r.created_at as string,
  }));
}
