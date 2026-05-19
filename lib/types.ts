// lib/types.ts
// Universal types shared across all language curricula in the lesson-generator app.

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface Level {
  code: CEFRLevel;
  name: string;            // e.g., "Foundations", "Elementary"
  startWeek: number;
  endWeek: number;
  targetVocab?: number;    // approximate cumulative vocab target by end of level
}

export interface Week {
  number: number;
  level: CEFRLevel;
  title: string;
  focus: string;           // core grammar/focus/topic for this week

  // Optional enrichment fields (added per AJALT-inspired pedagogical refinements).
  // When present, the prompt builder includes these in the prompt for richer lessons.
  // When absent, Claude.ai generates lessons normally without explicit anchors.

  /**
   * A single signature sentence in the target language that anchors this week's lesson.
   * Example (Japanese Week 5): "Watashi wa Baado desu." (I am Bird.)
   * Example (Spanish Week 1): "Hola, me llamo María."
   * Example (Ukrainian Week 10): "Slava Ukrayini! Heroyam slava!"
   * Gives learners a concrete, memorable hook for the week.
   */
  anchorSentence?: string;

  /**
   * Specific cultural concepts, practices, or contexts associated with this week.
   * Example (Japanese Week 7): ["order of surname and given name", "calling pupils by surname", "talking to young children"]
   * Example (Ukrainian Week 10): ["Slava Ukrayini greeting", "Heavenly Hundred", "patriotic expression usage"]
   * Concrete and specific — not generic ("Japanese culture") but pointed ("soroban abacus tradition").
   */
  culturalTouchstones?: string[];

  /**
   * Abstract grammar pattern notation used in the AJALT/textbook tradition.
   * Example (Japanese Week 1): ["N1 wa N2 desu", "N1 wa N2 dewa (ja) arimasen", "S ka?"]
   * Example (Ukrainian Week 8): ["Ya bachu + accusative", "animate masc: acc = gen"]
   * Compact formulas that learners can hold in working memory and apply to new vocab.
   */
  signatureGrammarPatterns?: string[];

  isGroupedRange?: boolean;
  groupRangeStart?: number;
  groupRangeEnd?: number;
}

export interface Curriculum {
  langCode: string;
  totalWeeks: number;
  levels: Level[];
  weeks: Week[];
}

// ===========================================================================
// LEARNER PROFILE TYPES
// ===========================================================================
// Optional per-learner data collected during onboarding. When provided, the
// prompt builder injects relevant pedagogy mappings into the lesson prompt.
// All fields are optional — lessons remain excellent without any profile data.

/**
 * The 34 Gallup CliftonStrengths themes. These names are Gallup trademarks;
 * the framework references them factually for pedagogical interpretation.
 */
export type GallupTheme =
  // Strategic Thinking
  | 'Analytical' | 'Context' | 'Futuristic' | 'Ideation' | 'Input'
  | 'Intellection' | 'Learner' | 'Strategic'
  // Relationship Building
  | 'Adaptability' | 'Connectedness' | 'Developer' | 'Empathy' | 'Harmony'
  | 'Includer' | 'Individualization' | 'Positivity' | 'Relator'
  // Executing
  | 'Achiever' | 'Arranger' | 'Belief' | 'Consistency' | 'Deliberative'
  | 'Discipline' | 'Focus' | 'Responsibility' | 'Restorative'
  // Influencing
  | 'Activator' | 'Command' | 'Communication' | 'Competition'
  | 'Maximizer' | 'Self-Assurance' | 'Significance' | 'Woo';

export type VARKPreference = 'visual' | 'auditory' | 'reading-writing' | 'kinesthetic' | 'multimodal';

export type LearnerMotivation =
  | 'heritage' | 'travel' | 'work' | 'relationship' | 'academic'
  | 'religious' | 'cognitive-challenge' | 'cultural-appreciation' | 'other';

export type WeeklyTimeCommitment =
  | 'casual'        // 1-2 hrs/week
  | 'committed'     // 3-5 hrs/week
  | 'intensive'     // 5-10 hrs/week
  | 'immersion';    // 20+ hrs/week

export type PriorLanguageExperience =
  | 'monolingual'           // English only or first L2 attempt
  | 'one-prior-l2'          // One prior language at A2-B1
  | 'multilingual'          // 3+ languages
  | 'heritage-passive'      // Passive heritage fluency in target language
  | 'polyglot';             // 5+ languages

export type StatedGoalLevel = 'A2' | 'B1-B2' | 'C1+' | 'heritage-maintenance';

export interface LearnerProfile {
  /**
   * Top 10 Gallup CliftonStrengths in order (most dominant first).
   * Top 5 are weighted as "dominant" influences on lesson design;
   * positions 6-10 are weighted as "supporting" influences.
   */
  gallupTop10?: GallupTheme[];

  /**
   * Preferred learning modality. Most learners are multi-modal; this signals
   * which modalities to emphasize in lesson presentation and supplementary recommendations.
   */
  vark?: VARKPreference;

  /** Why the learner is studying this language. Shapes Section 6 (Cultural) and Section 12 (Weekly Challenge) framing. */
  motivation?: LearnerMotivation;

  /** Time commitment per week. Affects pacing recommendations. */
  timeCommitment?: WeeklyTimeCommitment;

  /** Prior language experience. Affects scaffolding depth and contrastive analysis. */
  priorExperience?: PriorLanguageExperience;

  /** Where the learner wants to end up. Affects curriculum compression/extension. */
  goalLevel?: StatedGoalLevel;

  /** Free-form notes — e.g., specific interest topics, languages already known, learning history. */
  notes?: string;
}

