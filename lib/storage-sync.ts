// lib/storage-sync.ts
// Two-way sync between localStorage and Supabase for authenticated users.
// Local writes happen first (fast & offline-tolerant); cloud writes happen in
// the background. On sign-in, cloud data is fetched and merged into localStorage.

import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { LearnerProfile } from "./types";
import {
  getOnboardingState,
  type SavedLesson,
} from "./storage";
import { LANGUAGES } from "./languages";

// ────────── Profile ──────────

export async function pushProfile(
  userId: string,
  profile: LearnerProfile,
  meta?: {
    display_name?: string | null;
    email?: string | null;
    avatar_url?: string | null;
    onboardingState?: "completed" | "skipped" | null;
    lastUsedLanguage?: string | null;
  },
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = createClient();
  const payload: Record<string, unknown> = {
    user_id: userId,
    gallup_top10: profile.gallupTop10 ?? null,
    vark: profile.vark ?? null,
    motivations: profile.motivations ?? null,
    motivation_other: profile.motivationOther ?? null,
    time_commitment: profile.timeCommitment ?? null,
    prior_experience: profile.priorExperience ?? null,
    goal_level: profile.goalLevel ?? null,
    interested_languages: profile.interestedLanguages ?? null,
    notes: profile.notes ?? null,
    onboarding_state: meta?.onboardingState ?? null,
    last_used_language: meta?.lastUsedLanguage ?? null,
    updated_at: new Date().toISOString(),
  };
  if (meta?.display_name !== undefined) payload.display_name = meta.display_name;
  if (meta?.email !== undefined) payload.email = meta.email;
  if (meta?.avatar_url !== undefined) payload.avatar_url = meta.avatar_url;

  await supabase.from("profiles").upsert(payload, { onConflict: "user_id" });
}

export async function pullProfile(userId: string): Promise<
  | (LearnerProfile & {
      onboarding_state: string | null;
      display_name: string | null;
      email: string | null;
      avatar_url: string | null;
    })
  | null
> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    gallupTop10: (data.gallup_top10 as LearnerProfile["gallupTop10"]) ?? undefined,
    vark: (data.vark as LearnerProfile["vark"]) ?? undefined,
    motivations: (data.motivations as LearnerProfile["motivations"]) ?? undefined,
    motivationOther: data.motivation_other ?? undefined,
    timeCommitment: (data.time_commitment as LearnerProfile["timeCommitment"]) ?? undefined,
    priorExperience: (data.prior_experience as LearnerProfile["priorExperience"]) ?? undefined,
    goalLevel: (data.goal_level as LearnerProfile["goalLevel"]) ?? undefined,
    interestedLanguages: (data.interested_languages as string[] | null) ?? undefined,
    notes: data.notes ?? undefined,
    onboarding_state: data.onboarding_state,
    display_name: data.display_name,
    email: data.email,
    avatar_url: data.avatar_url,
  };
}

// ────────── Lessons ──────────

export async function pushLesson(
  userId: string,
  langCode: string,
  weekNumber: number,
  content: string,
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = createClient();
  const now = new Date().toISOString();
  await supabase.from("lessons").upsert(
    {
      user_id: userId,
      lang_code: langCode,
      week_number: weekNumber,
      content,
      saved_at: now,
      updated_at: now,
    },
    { onConflict: "user_id,lang_code,week_number" },
  );
}

export async function deleteLessonCloud(
  userId: string,
  langCode: string,
  weekNumber: number,
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = createClient();
  await supabase
    .from("lessons")
    .delete()
    .eq("user_id", userId)
    .eq("lang_code", langCode)
    .eq("week_number", weekNumber);
}

export async function pullAllLessons(
  userId: string,
): Promise<Record<string, Record<number, SavedLesson>>> {
  if (!isSupabaseConfigured()) return {};
  const supabase = createClient();
  const { data } = await supabase.from("lessons").select("*").eq("user_id", userId);
  const out: Record<string, Record<number, SavedLesson>> = {};
  for (const row of data ?? []) {
    if (!out[row.lang_code]) out[row.lang_code] = {};
    out[row.lang_code][row.week_number] = {
      weekNumber: row.week_number,
      content: row.content,
      savedAt: row.saved_at,
      updatedAt: row.updated_at,
    };
  }
  return out;
}

// ────────── Notes ──────────

export async function pushNote(
  userId: string,
  langCode: string,
  weekNumber: number,
  content: string,
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = createClient();
  await supabase.from("notes").upsert(
    {
      user_id: userId,
      lang_code: langCode,
      week_number: weekNumber,
      content,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,lang_code,week_number" },
  );
}

export async function pullAllNotes(
  userId: string,
): Promise<Record<string, Record<number, string>>> {
  if (!isSupabaseConfigured()) return {};
  const supabase = createClient();
  const { data } = await supabase.from("notes").select("*").eq("user_id", userId);
  const out: Record<string, Record<number, string>> = {};
  for (const row of data ?? []) {
    if (!out[row.lang_code]) out[row.lang_code] = {};
    out[row.lang_code][row.week_number] = row.content;
  }
  return out;
}

// ────────── Initial sync on sign-in ──────────

/**
 * Pulls cloud data and merges into localStorage.
 * Strategy: cloud wins for items present in both; local-only items are pushed up.
 * Returns a summary of what happened.
 */
export async function syncOnSignIn(
  userId: string,
  userMeta: { email?: string | null; full_name?: string | null; avatar_url?: string | null },
): Promise<{ pulledLessons: number; pushedLessons: number; profileSynced: boolean }> {
  if (!isSupabaseConfigured() || typeof window === "undefined") {
    return { pulledLessons: 0, pushedLessons: 0, profileSynced: false };
  }

  let pulled = 0;
  let pushed = 0;
  let profileSynced = false;

  // 1. Pull profile from cloud
  const cloudProfile = await pullProfile(userId);
  const localProfileRaw = localStorage.getItem("learnerProfile");
  const localProfile = localProfileRaw ? (JSON.parse(localProfileRaw) as LearnerProfile) : null;
  const localOnboardingState = getOnboardingState();

  if (cloudProfile) {
    // Cloud has data — overwrite local
    const local: LearnerProfile = {
      gallupTop10: cloudProfile.gallupTop10,
      vark: cloudProfile.vark,
      motivations: cloudProfile.motivations,
      motivationOther: cloudProfile.motivationOther,
      timeCommitment: cloudProfile.timeCommitment,
      priorExperience: cloudProfile.priorExperience,
      goalLevel: cloudProfile.goalLevel,
      interestedLanguages: cloudProfile.interestedLanguages,
      notes: cloudProfile.notes,
    };
    const hasAnything = Object.values(local).some((v) =>
      v !== undefined && (Array.isArray(v) ? v.length > 0 : true),
    );
    if (hasAnything) {
      localStorage.setItem("learnerProfile", JSON.stringify(local));
    }
    if (cloudProfile.onboarding_state) {
      localStorage.setItem("onboardingResolved", cloudProfile.onboarding_state);
    }
    profileSynced = true;
  } else if (localProfile || localOnboardingState) {
    // Local has data, cloud doesn't — push up
    await pushProfile(userId, localProfile ?? {}, {
      onboardingState: localOnboardingState ?? undefined,
      display_name: userMeta.full_name,
      email: userMeta.email,
      avatar_url: userMeta.avatar_url,
    });
    profileSynced = true;
  } else {
    // Neither — initialize the profile row with auth metadata
    await pushProfile(userId, {}, {
      display_name: userMeta.full_name,
      email: userMeta.email,
      avatar_url: userMeta.avatar_url,
    });
  }

  // 2. Pull cloud lessons & merge into localStorage
  const cloudLessons = await pullAllLessons(userId);
  for (const [lang, lessons] of Object.entries(cloudLessons)) {
    if (!LANGUAGES[lang]) continue;
    const key = `lang:${lang}:lessons`;
    const existing = JSON.parse(localStorage.getItem(key) ?? "{}");
    for (const [weekStr, lesson] of Object.entries(lessons)) {
      existing[weekStr] = lesson; // cloud wins
      pulled++;
    }
    localStorage.setItem(key, JSON.stringify(existing));
  }

  // 3. Push local-only lessons up
  for (const code of Object.keys(LANGUAGES)) {
    const key = `lang:${code}:lessons`;
    const local: Record<number, SavedLesson> = JSON.parse(localStorage.getItem(key) ?? "{}");
    const cloudForLang = cloudLessons[code] ?? {};
    for (const [weekStr, lesson] of Object.entries(local)) {
      const week = parseInt(weekStr);
      if (!cloudForLang[week]) {
        await pushLesson(userId, code, week, lesson.content);
        pushed++;
      }
    }
  }

  // 4. Pull notes
  const cloudNotes = await pullAllNotes(userId);
  for (const [lang, notes] of Object.entries(cloudNotes)) {
    if (!LANGUAGES[lang]) continue;
    const key = `lang:${lang}:notes`;
    const existing = JSON.parse(localStorage.getItem(key) ?? "{}");
    for (const [weekStr, note] of Object.entries(notes)) {
      existing[weekStr] = note;
    }
    localStorage.setItem(key, JSON.stringify(existing));
  }

  return { pulledLessons: pulled, pushedLessons: pushed, profileSynced };
}
