// lib/family-theme.ts
// Subtle accent color per language family + script-appropriate web font hints.
// Used by per-language UI surfaces to subtly distinguish the 31 languages.

import type { LanguageFamily, LanguageMeta } from './languages';

export interface FamilyTheme {
  /** Tailwind color name root (e.g., 'orange', 'blue') */
  accent: string;
  /** OKLCH or hex for the accent CSS variable */
  accentHex: string;
  /** Soft tinted background used on certain surfaces */
  tintHex: string;
  /** Human label, like "Warm earth" or "Cool slate" */
  vibe: string;
  /** CSS font-family stack to use when rendering target-language text */
  targetFontStack: string;
}

export const FAMILY_THEMES: Record<LanguageFamily, FamilyTheme> = {
  // Romance — warm terracotta (Spanish, French, Italian, Portuguese)
  Romance: {
    accent: 'orange',
    accentHex: '#9A3412',
    tintHex: '#FEF3E2',
    vibe: 'Warm earth',
    targetFontStack: 'var(--font-display), Georgia, serif',
  },
  // Germanic — slate blue (German, Dutch, Danish, Swedish, Norwegian, English)
  Germanic: {
    accent: 'blue',
    accentHex: '#1E40AF',
    tintHex: '#EEF2FF',
    vibe: 'Steel blue',
    targetFontStack: 'var(--font-display), Georgia, serif',
  },
  // East Slavic — cool indigo (Russian, Ukrainian)
  'East Slavic': {
    accent: 'indigo',
    accentHex: '#3730A3',
    tintHex: '#EEF2FF',
    vibe: 'Deep indigo',
    targetFontStack: 'var(--font-cyrillic), var(--font-display), Georgia, serif',
  },
  // West Slavic — muted plum (Polish)
  'West Slavic': {
    accent: 'violet',
    accentHex: '#5B21B6',
    tintHex: '#F3E8FF',
    vibe: 'Muted plum',
    targetFontStack: 'var(--font-display), Georgia, serif',
  },
  // Hellenic — Aegean teal (Greek)
  Hellenic: {
    accent: 'teal',
    accentHex: '#0F766E',
    tintHex: '#CCFBF1',
    vibe: 'Aegean teal',
    targetFontStack: 'var(--font-greek), var(--font-display), Georgia, serif',
  },
  // Celtic — moss green (Irish)
  Celtic: {
    accent: 'emerald',
    accentHex: '#047857',
    tintHex: '#D1FAE5',
    vibe: 'Moss green',
    targetFontStack: 'var(--font-display), Georgia, serif',
  },
  // Indo-Aryan — saffron (Hindi, Bengali, Urdu)
  'Indo-Aryan': {
    accent: 'amber',
    accentHex: '#B45309',
    tintHex: '#FEF3C7',
    vibe: 'Saffron',
    targetFontStack: 'var(--font-devanagari), var(--font-bengali), var(--font-nastaliq), serif',
  },
  // Iranian — turquoise (Persian)
  Iranian: {
    accent: 'cyan',
    accentHex: '#0E7490',
    tintHex: '#CFFAFE',
    vibe: 'Turquoise',
    targetFontStack: 'var(--font-persian), var(--font-arabic), serif',
  },
  // Austronesian — warm coral (Filipino, Cebuano, Indonesian)
  Austronesian: {
    accent: 'rose',
    accentHex: '#BE123C',
    tintHex: '#FFE4E6',
    vibe: 'Warm coral',
    targetFontStack: 'var(--font-display), Georgia, serif',
  },
  // Austroasiatic — jade (Vietnamese)
  Austroasiatic: {
    accent: 'green',
    accentHex: '#15803D',
    tintHex: '#DCFCE7',
    vibe: 'Jade',
    targetFontStack: 'var(--font-display), Georgia, serif',
  },
  // Tai-Kadai — lotus pink (Thai)
  'Tai-Kadai': {
    accent: 'pink',
    accentHex: '#BE185D',
    tintHex: '#FCE7F3',
    vibe: 'Lotus pink',
    targetFontStack: 'var(--font-thai), serif',
  },
  // Turkic — sky (Turkish)
  Turkic: {
    accent: 'sky',
    accentHex: '#0369A1',
    tintHex: '#E0F2FE',
    vibe: 'Anatolian sky',
    targetFontStack: 'var(--font-display), Georgia, serif',
  },
  // Semitic — warm sand (Arabic, Hebrew)
  Semitic: {
    accent: 'yellow',
    accentHex: '#A16207',
    tintHex: '#FEF9C3',
    vibe: 'Warm sand',
    targetFontStack: 'var(--font-arabic), var(--font-hebrew), serif',
  },
  // Sino-Tibetan — ink black (Mandarin)
  'Sino-Tibetan': {
    accent: 'stone',
    accentHex: '#1C1917',
    tintHex: '#F5F5F4',
    vibe: 'Refined ink',
    targetFontStack: 'var(--font-cjk), serif',
  },
  // Japonic — sumi black (Japanese)
  Japonic: {
    accent: 'slate',
    accentHex: '#1E293B',
    tintHex: '#F1F5F9',
    vibe: 'Sumi black',
    targetFontStack: 'var(--font-cjk), serif',
  },
  // Koreanic — celadon (Korean)
  Koreanic: {
    accent: 'lime',
    accentHex: '#3F6212',
    tintHex: '#ECFCCB',
    vibe: 'Celadon',
    targetFontStack: 'var(--font-cjk), serif',
  },
  // Niger-Congo — sunset orange (Swahili)
  'Niger-Congo': {
    accent: 'orange',
    accentHex: '#C2410C',
    tintHex: '#FED7AA',
    vibe: 'Sunset',
    targetFontStack: 'var(--font-display), Georgia, serif',
  },
};

export function getTheme(lang: LanguageMeta): FamilyTheme {
  return FAMILY_THEMES[lang.family];
}

/** Tailwind class helpers for a given theme's accent color */
export function accentClasses(theme: FamilyTheme) {
  return {
    text: `text-${theme.accent}-800`,
    textSubtle: `text-${theme.accent}-700`,
    bg: `bg-${theme.accent}-800`,
    bgSubtle: `bg-${theme.accent}-50`,
    bgHover: `hover:bg-${theme.accent}-50`,
    border: `border-${theme.accent}-200`,
    borderStrong: `border-${theme.accent}-400`,
    ring: `ring-${theme.accent}-200`,
    button: `bg-${theme.accent}-700 hover:bg-${theme.accent}-800 text-white`,
  };
}
