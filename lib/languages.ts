// lib/languages.ts
// Metadata for all 31 supported languages.

export type FSICategory = 1 | 2 | 2.5 | 3 | 4;

export type LanguageFamily =
  | 'Romance'
  | 'Germanic'
  | 'East Slavic'
  | 'West Slavic'
  | 'Hellenic'
  | 'Celtic'
  | 'Indo-Aryan'
  | 'Iranian'
  | 'Austronesian'
  | 'Austroasiatic'
  | 'Tai-Kadai'
  | 'Turkic'
  | 'Semitic'
  | 'Sino-Tibetan'
  | 'Japonic'
  | 'Koreanic'
  | 'Niger-Congo';

export interface LanguageMeta {
  code: string;
  name: string;
  nativeName: string;
  fsiCategory: FSICategory;
  totalWeeks: number;
  family: LanguageFamily;
  familyLabel: string; // longer display: "Indo-European → Romance"
  script: string;
  rtl: boolean;
  notes?: string;
}

export const LANGUAGES: Record<string, LanguageMeta> = {
  // ── FSI Category I — 130 weeks ──────────────────────────────
  es: { code: 'es', name: 'Spanish',    nativeName: 'Español',     fsiCategory: 1, totalWeeks: 130, family: 'Romance',  familyLabel: 'Indo-European → Romance',     script: 'Latin',      rtl: false, notes: 'Neutral Latin American base; Castilian as receptive.' },
  fr: { code: 'fr', name: 'French',     nativeName: 'Français',    fsiCategory: 1, totalWeeks: 130, family: 'Romance',  familyLabel: 'Indo-European → Romance',     script: 'Latin',      rtl: false },
  it: { code: 'it', name: 'Italian',    nativeName: 'Italiano',    fsiCategory: 1, totalWeeks: 130, family: 'Romance',  familyLabel: 'Indo-European → Romance',     script: 'Latin',      rtl: false },
  pt: { code: 'pt', name: 'Portuguese', nativeName: 'Português',   fsiCategory: 1, totalWeeks: 130, family: 'Romance',  familyLabel: 'Indo-European → Romance',     script: 'Latin',      rtl: false, notes: 'Brazilian primary; European parallel.' },
  nl: { code: 'nl', name: 'Dutch',      nativeName: 'Nederlands',  fsiCategory: 1, totalWeeks: 130, family: 'Germanic', familyLabel: 'Indo-European → Germanic',    script: 'Latin',      rtl: false },
  da: { code: 'da', name: 'Danish',     nativeName: 'Dansk',       fsiCategory: 1, totalWeeks: 130, family: 'Germanic', familyLabel: 'Indo-European → Germanic',    script: 'Latin',      rtl: false },
  sv: { code: 'sv', name: 'Swedish',    nativeName: 'Svenska',     fsiCategory: 1, totalWeeks: 130, family: 'Germanic', familyLabel: 'Indo-European → Germanic',    script: 'Latin',      rtl: false },
  no: { code: 'no', name: 'Norwegian',  nativeName: 'Norsk',       fsiCategory: 1, totalWeeks: 130, family: 'Germanic', familyLabel: 'Indo-European → Germanic',    script: 'Latin',      rtl: false, notes: 'Bokmål primary; Nynorsk parallel.' },

  // ── FSI Category II — 150 weeks ─────────────────────────────
  de: { code: 'de', name: 'German',     nativeName: 'Deutsch',     fsiCategory: 2, totalWeeks: 150, family: 'Germanic',    familyLabel: 'Indo-European → Germanic',  script: 'Latin', rtl: false },
  sw: { code: 'sw', name: 'Swahili',    nativeName: 'Kiswahili',   fsiCategory: 2, totalWeeks: 150, family: 'Niger-Congo', familyLabel: 'Niger-Congo → Bantu',       script: 'Latin', rtl: false },
  id: { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', fsiCategory: 2, totalWeeks: 150, family: 'Austronesian', familyLabel: 'Austronesian → Malayo-Polynesian', script: 'Latin', rtl: false },

  // ── FSI Category II-III — 160 weeks ─────────────────────────
  el: { code: 'el', name: 'Greek',      nativeName: 'Ελληνικά',     fsiCategory: 2.5, totalWeeks: 160, family: 'Hellenic', familyLabel: 'Indo-European → Hellenic',   script: 'Greek',  rtl: false },

  // ── FSI Category III — 150-170 weeks (160 for Filipino/Cebuano/Irish) ──
  en:  { code: 'en',  name: 'English',     nativeName: 'English',      fsiCategory: 3, totalWeeks: 150, family: 'Germanic',    familyLabel: 'Indo-European → Germanic',   script: 'Latin',                  rtl: false, notes: 'For non-English speakers.' },
  ru:  { code: 'ru',  name: 'Russian',     nativeName: 'Русский',      fsiCategory: 3, totalWeeks: 170, family: 'East Slavic', familyLabel: 'Indo-European → East Slavic', script: 'Cyrillic',               rtl: false },
  pl:  { code: 'pl',  name: 'Polish',      nativeName: 'Polski',       fsiCategory: 3, totalWeeks: 170, family: 'West Slavic', familyLabel: 'Indo-European → West Slavic', script: 'Latin',                  rtl: false },
  uk:  { code: 'uk',  name: 'Ukrainian',   nativeName: 'Українська',   fsiCategory: 3, totalWeeks: 170, family: 'East Slavic', familyLabel: 'Indo-European → East Slavic', script: 'Cyrillic',               rtl: false },
  hi:  { code: 'hi',  name: 'Hindi',       nativeName: 'हिन्दी',         fsiCategory: 3, totalWeeks: 170, family: 'Indo-Aryan',  familyLabel: 'Indo-European → Indo-Aryan',  script: 'Devanagari',             rtl: false },
  bn:  { code: 'bn',  name: 'Bengali',     nativeName: 'বাংলা',          fsiCategory: 3, totalWeeks: 170, family: 'Indo-Aryan',  familyLabel: 'Indo-European → Indo-Aryan',  script: 'Bengali',                rtl: false },
  ur:  { code: 'ur',  name: 'Urdu',        nativeName: 'اردو',          fsiCategory: 3, totalWeeks: 170, family: 'Indo-Aryan',  familyLabel: 'Indo-European → Indo-Aryan',  script: 'Perso-Arabic (Nastaliq)', rtl: true },
  fa:  { code: 'fa',  name: 'Persian',     nativeName: 'فارسی',         fsiCategory: 3, totalWeeks: 170, family: 'Iranian',     familyLabel: 'Indo-European → Iranian',     script: 'Perso-Arabic',           rtl: true,  notes: 'Tehran Farsi primary.' },
  tl:  { code: 'tl',  name: 'Filipino',    nativeName: 'Filipino',     fsiCategory: 3, totalWeeks: 160, family: 'Austronesian', familyLabel: 'Austronesian → Malayo-Polynesian', script: 'Latin',          rtl: false, notes: 'Tagalog-based.' },
  ceb: { code: 'ceb', name: 'Cebuano',     nativeName: 'Sinugboanon',  fsiCategory: 3, totalWeeks: 160, family: 'Austronesian', familyLabel: 'Austronesian → Malayo-Polynesian', script: 'Latin',          rtl: false },
  vi:  { code: 'vi',  name: 'Vietnamese',  nativeName: 'Tiếng Việt',    fsiCategory: 3, totalWeeks: 170, family: 'Austroasiatic', familyLabel: 'Austroasiatic → Vietic',     script: 'Vietnamese Latin',       rtl: false, notes: 'Northern (Hanoi) primary.' },
  tr:  { code: 'tr',  name: 'Turkish',     nativeName: 'Türkçe',       fsiCategory: 3, totalWeeks: 170, family: 'Turkic',      familyLabel: 'Turkic → Oghuz',              script: 'Latin',                  rtl: false },
  he:  { code: 'he',  name: 'Hebrew',      nativeName: 'עברית',         fsiCategory: 3, totalWeeks: 170, family: 'Semitic',     familyLabel: 'Afro-Asiatic → Semitic',      script: 'Hebrew',                 rtl: true },
  ga:  { code: 'ga',  name: 'Irish',       nativeName: 'Gaeilge',      fsiCategory: 3, totalWeeks: 160, family: 'Celtic',      familyLabel: 'Indo-European → Celtic',      script: 'Latin',                  rtl: false },

  // ── FSI Category IV — 180-200 weeks (180 for Korean/Thai, 190 for Mandarin) ──
  zh: { code: 'zh', name: 'Mandarin',  nativeName: '中文',     fsiCategory: 4, totalWeeks: 190, family: 'Sino-Tibetan', familyLabel: 'Sino-Tibetan → Sinitic',     script: 'Simplified Chinese',         rtl: false, notes: 'Putonghua, simplified characters.' },
  ja: { code: 'ja', name: 'Japanese',  nativeName: '日本語',    fsiCategory: 4, totalWeeks: 200, family: 'Japonic',      familyLabel: 'Japonic',                     script: 'Kanji + Hiragana + Katakana', rtl: false },
  ko: { code: 'ko', name: 'Korean',    nativeName: '한국어',    fsiCategory: 4, totalWeeks: 180, family: 'Koreanic',     familyLabel: 'Koreanic',                    script: 'Hangul',                      rtl: false },
  ar: { code: 'ar', name: 'Arabic',    nativeName: 'العربية',   fsiCategory: 4, totalWeeks: 200, family: 'Semitic',      familyLabel: 'Afro-Asiatic → Semitic',      script: 'Arabic',                      rtl: true,  notes: 'MSA primary; Egyptian Arabic parallel.' },
  th: { code: 'th', name: 'Thai',      nativeName: 'ภาษาไทย',  fsiCategory: 4, totalWeeks: 180, family: 'Tai-Kadai',    familyLabel: 'Tai-Kadai → Tai',             script: 'Thai',                        rtl: false },
};

export const LANGUAGES_LIST: LanguageMeta[] = Object.values(LANGUAGES);

export function getLanguage(code: string): LanguageMeta | undefined {
  return LANGUAGES[code];
}

export const FSI_CATEGORIES: { cat: FSICategory; label: string; description: string }[] = [
  { cat: 1,   label: 'Category I',     description: 'Closely cognate with English. ~600-750 hours to General Professional Proficiency.' },
  { cat: 2,   label: 'Category II',    description: 'Significant linguistic and/or cultural distance. ~900 hours.' },
  { cat: 2.5, label: 'Category II–III', description: 'Hard, but a step before the hardest. ~1,100 hours.' },
  { cat: 3,   label: 'Category III',   description: 'Hard languages with significant differences from English. ~1,100 hours.' },
  { cat: 4,   label: 'Category IV',    description: 'Exceptionally difficult for English speakers. ~2,200 hours.' },
];

export function getLanguagesByCategory(cat: FSICategory): LanguageMeta[] {
  return LANGUAGES_LIST.filter((l) => l.fsiCategory === cat);
}
