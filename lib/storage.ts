// lib/storage.ts
// localStorage helpers. All lesson/note data is namespaced by language code.
// Profile and "lastUsedLanguage" are global.

import type { LearnerProfile } from './types';
import { LANGUAGES } from './languages';

const LESSONS_KEY = (lang: string) => `lang:${lang}:lessons`;
const NOTES_KEY = (lang: string) => `lang:${lang}:notes`;
const META_KEY = (lang: string) => `lang:${lang}:metadata`;
const LAST_LANG_KEY = 'lastUsedLanguage';
const PROFILE_KEY = 'learnerProfile';
const PROFILE_GATE_KEY = 'onboardingResolved'; // 'completed' | 'skipped' | absent

export interface SavedLesson {
  weekNumber: number;
  savedAt: string;
  updatedAt?: string;
  content: string;
}

export interface LanguageMetadata {
  startedAt?: string;
  lastAccessedAt?: string;
}

function isClient(): boolean {
  return typeof window !== 'undefined';
}

function read<T>(key: string, fallback: T): T {
  if (!isClient()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  if (!isClient()) return;
  localStorage.setItem(key, JSON.stringify(value));
}

function remove(key: string): void {
  if (!isClient()) return;
  localStorage.removeItem(key);
}

// ────────── Lessons ──────────

export function getLesson(lang: string, week: number): SavedLesson | null {
  const lessons = read<Record<number, SavedLesson>>(LESSONS_KEY(lang), {});
  return lessons[week] ?? null;
}

export function saveLesson(lang: string, week: number, content: string): void {
  const lessons = read<Record<number, SavedLesson>>(LESSONS_KEY(lang), {});
  const now = new Date().toISOString();
  const existing = lessons[week];
  lessons[week] = {
    weekNumber: week,
    content,
    savedAt: existing?.savedAt ?? now,
    updatedAt: now,
  };
  write(LESSONS_KEY(lang), lessons);
  touchLanguage(lang);
}

export function deleteLesson(lang: string, week: number): void {
  const lessons = read<Record<number, SavedLesson>>(LESSONS_KEY(lang), {});
  delete lessons[week];
  write(LESSONS_KEY(lang), lessons);
}

export function getAllLessons(lang: string): Record<number, SavedLesson> {
  return read<Record<number, SavedLesson>>(LESSONS_KEY(lang), {});
}

// ────────── Notes ──────────

export function getNote(lang: string, week: number): string {
  const notes = read<Record<number, string>>(NOTES_KEY(lang), {});
  return notes[week] ?? '';
}

export function saveNote(lang: string, week: number, content: string): void {
  const notes = read<Record<number, string>>(NOTES_KEY(lang), {});
  notes[week] = content;
  write(NOTES_KEY(lang), notes);
}

// ────────── Metadata ──────────

export function touchLanguage(lang: string): void {
  const meta = read<LanguageMetadata>(META_KEY(lang), {});
  const now = new Date().toISOString();
  if (!meta.startedAt) meta.startedAt = now;
  meta.lastAccessedAt = now;
  write(META_KEY(lang), meta);
  write(LAST_LANG_KEY, lang);
}

export function getLanguageMeta(lang: string): LanguageMetadata {
  return read<LanguageMetadata>(META_KEY(lang), {});
}

export function getLastUsed(): string | null {
  if (!isClient()) return null;
  return localStorage.getItem(LAST_LANG_KEY);
}

// ────────── Progress ──────────

export function getLanguageProgress(lang: string): {
  completed: number;
  total: number;
} {
  const lessons = getAllLessons(lang);
  const total = LANGUAGES[lang]?.totalWeeks ?? 0;
  return { completed: Object.keys(lessons).length, total };
}

export function getAllProgress(): Record<string, { completed: number; total: number }> {
  const out: Record<string, { completed: number; total: number }> = {};
  for (const code of Object.keys(LANGUAGES)) {
    out[code] = getLanguageProgress(code);
  }
  return out;
}

export function getMostRecent(): {
  lang: string;
  week: number;
  savedAt: string;
} | null {
  let best: { lang: string; week: number; savedAt: string } | null = null;
  for (const code of Object.keys(LANGUAGES)) {
    const lessons = getAllLessons(code);
    for (const lesson of Object.values(lessons)) {
      const ts = lesson.updatedAt ?? lesson.savedAt;
      if (!best || ts > best.savedAt) {
        best = { lang: code, week: lesson.weekNumber, savedAt: ts };
      }
    }
  }
  return best;
}

// ────────── Profile ──────────

export function getProfile(): LearnerProfile | null {
  if (!isClient()) return null;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as LearnerProfile) : null;
  } catch {
    return null;
  }
}

export function saveProfile(profile: LearnerProfile): void {
  write(PROFILE_KEY, profile);
  setOnboardingResolved('completed');
}

export function clearProfile(): void {
  remove(PROFILE_KEY);
}

export type OnboardingState = 'completed' | 'skipped' | null;

export function getOnboardingState(): OnboardingState {
  if (!isClient()) return null;
  const v = localStorage.getItem(PROFILE_GATE_KEY);
  if (v === 'completed' || v === 'skipped') return v;
  return null;
}

export function setOnboardingResolved(state: 'completed' | 'skipped'): void {
  if (!isClient()) return;
  localStorage.setItem(PROFILE_GATE_KEY, state);
}

// ────────── Backup ──────────

export interface BackupBlob {
  schemaVersion: '1.0';
  exportedAt: string;
  profile: LearnerProfile | null;
  onboardingState: OnboardingState;
  languages: Record<
    string,
    {
      lessons: Record<number, SavedLesson>;
      notes: Record<number, string>;
      metadata: LanguageMetadata;
    }
  >;
}

export function exportAll(): BackupBlob {
  const languages: BackupBlob['languages'] = {};
  for (const code of Object.keys(LANGUAGES)) {
    const lessons = getAllLessons(code);
    const notes = read<Record<number, string>>(NOTES_KEY(code), {});
    const metadata = getLanguageMeta(code);
    if (
      Object.keys(lessons).length === 0 &&
      Object.keys(notes).length === 0 &&
      !metadata.startedAt
    ) {
      continue;
    }
    languages[code] = { lessons, notes, metadata };
  }
  return {
    schemaVersion: '1.0',
    exportedAt: new Date().toISOString(),
    profile: getProfile(),
    onboardingState: getOnboardingState(),
    languages,
  };
}

export interface ImportResult {
  mergedLanguages: number;
  mergedLessons: number;
  overwrittenLessons: number;
  errors: string[];
}

export function importAll(blob: BackupBlob): ImportResult {
  const result: ImportResult = {
    mergedLanguages: 0,
    mergedLessons: 0,
    overwrittenLessons: 0,
    errors: [],
  };

  if (blob.profile) {
    write(PROFILE_KEY, blob.profile);
  }
  if (blob.onboardingState) {
    setOnboardingResolved(blob.onboardingState as 'completed' | 'skipped');
  }

  for (const [lang, data] of Object.entries(blob.languages)) {
    if (!LANGUAGES[lang]) {
      result.errors.push(`Unknown language code "${lang}" — skipped.`);
      continue;
    }
    result.mergedLanguages++;

    const existingLessons = getAllLessons(lang);
    for (const [weekStr, lesson] of Object.entries(data.lessons)) {
      const week = parseInt(weekStr);
      if (existingLessons[week]) result.overwrittenLessons++;
      else result.mergedLessons++;
      existingLessons[week] = lesson;
    }
    write(LESSONS_KEY(lang), existingLessons);

    const existingNotes = read<Record<number, string>>(NOTES_KEY(lang), {});
    for (const [weekStr, note] of Object.entries(data.notes)) {
      existingNotes[parseInt(weekStr)] = note;
    }
    write(NOTES_KEY(lang), existingNotes);

    if (data.metadata.startedAt) {
      write(META_KEY(lang), data.metadata);
    }
  }
  return result;
}

export function clearAll(): void {
  if (!isClient()) return;
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (key.startsWith('lang:') || key === LAST_LANG_KEY || key === PROFILE_KEY || key === PROFILE_GATE_KEY) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
}
