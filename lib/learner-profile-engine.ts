// lib/learner-profile-engine.ts
//
// Level 2 deterministic rules engine for the learner profile system.
//
// Given a LearnerProfile, this module produces a focused, minimal guidance block
// to inject into lesson-generation prompts. Key design decisions:
//
// 1. ZERO AI CALLS — everything here is deterministic TypeScript logic
// 2. PROMPT TOKEN OPTIMIZATION — pulls only the relevant 10 theme sections from
//    gallup-strengths-pedagogy.md, not the full 34-theme document
// 3. EXPLICIT PATH RECOMMENDATION — uses weighted voting based on per-theme path
//    leanings to recommend Output Path (I/II/III) and Grammar Path (I/II/III)
// 4. DOMAIN-DENSITY RULES — counts themes per Gallup domain and emits density-
//    specific instructions
// 5. COMBINATION DETECTION — checks for the notable theme combinations documented
//    in gallup-strengths-pedagogy.md and injects only the applicable ones
//
// Token cost: full gallup pedagogy injection was ~12K tokens; the focused output
// of this engine is ~2.5K tokens per lesson — savings of ~9.5K tokens per lesson.

import type {
  GallupTheme,
  LearnerProfile,
  VARKPreference,
} from './types';
import { gallupPedagogy, learnerProfilePedagogy } from './references';

// ============================================================================
// DOMAIN CLASSIFICATION
// ============================================================================

export type GallupDomain =
  | 'Executing'
  | 'Influencing'
  | 'Relationship Building'
  | 'Strategic Thinking';

export const THEME_DOMAINS: Record<GallupTheme, GallupDomain> = {
  // Strategic Thinking
  Analytical: 'Strategic Thinking',
  Context: 'Strategic Thinking',
  Futuristic: 'Strategic Thinking',
  Ideation: 'Strategic Thinking',
  Input: 'Strategic Thinking',
  Intellection: 'Strategic Thinking',
  Learner: 'Strategic Thinking',
  Strategic: 'Strategic Thinking',
  // Relationship Building
  Adaptability: 'Relationship Building',
  Connectedness: 'Relationship Building',
  Developer: 'Relationship Building',
  Empathy: 'Relationship Building',
  Harmony: 'Relationship Building',
  Includer: 'Relationship Building',
  Individualization: 'Relationship Building',
  Positivity: 'Relationship Building',
  Relator: 'Relationship Building',
  // Executing
  Achiever: 'Executing',
  Arranger: 'Executing',
  Belief: 'Executing',
  Consistency: 'Executing',
  Deliberative: 'Executing',
  Discipline: 'Executing',
  Focus: 'Executing',
  Responsibility: 'Executing',
  Restorative: 'Executing',
  // Influencing
  Activator: 'Influencing',
  Command: 'Influencing',
  Communication: 'Influencing',
  Competition: 'Influencing',
  Maximizer: 'Influencing',
  'Self-Assurance': 'Influencing',
  Significance: 'Influencing',
  Woo: 'Influencing',
};

// ============================================================================
// PATH LEANINGS PER THEME
// ============================================================================
// Each theme has a leaning on two axes:
// - Output timing: 'I' (Input-First, Refold/ALG/Krashen) | 'II' (Output-First, Lewis) | 'III' (Balanced, Nation)
// - Grammar approach: 'I' (Explicit study, Tofugu) | 'II' (Acquired via input, StoryLearning) | 'III' (Hybrid, default)
//
// See Part 9 of pedagogy-foundations.md for what these paths mean.
// Leanings are derived from the per-theme guidance in gallup-strengths-pedagogy.md.

export type Path = 'I' | 'II' | 'III';

export const THEME_PATH_LEANINGS: Record<GallupTheme, { output: Path; grammar: Path }> = {
  // Strategic Thinking — generally Path I (input-first, explicit grammar)
  Input: { output: 'I', grammar: 'I' },
  Intellection: { output: 'I', grammar: 'I' },
  Learner: { output: 'III', grammar: 'III' },
  Ideation: { output: 'III', grammar: 'I' },
  Strategic: { output: 'III', grammar: 'III' },
  Analytical: { output: 'I', grammar: 'I' },
  Context: { output: 'I', grammar: 'I' },
  Futuristic: { output: 'III', grammar: 'III' },

  // Relationship Building — mostly balanced; depends on the specific theme
  Connectedness: { output: 'III', grammar: 'III' },
  Relator: { output: 'II', grammar: 'III' },
  Developer: { output: 'III', grammar: 'III' },
  Empathy: { output: 'I', grammar: 'III' },
  Harmony: { output: 'I', grammar: 'III' },
  Includer: { output: 'III', grammar: 'III' },
  Individualization: { output: 'III', grammar: 'III' },
  Positivity: { output: 'II', grammar: 'III' },
  Adaptability: { output: 'III', grammar: 'III' },

  // Executing — mostly flexible; few strong path signals
  Achiever: { output: 'III', grammar: 'III' },
  Arranger: { output: 'III', grammar: 'III' },
  Belief: { output: 'III', grammar: 'III' },
  Consistency: { output: 'III', grammar: 'I' },
  Deliberative: { output: 'I', grammar: 'I' },
  Discipline: { output: 'III', grammar: 'III' },
  Focus: { output: 'III', grammar: 'III' },
  Responsibility: { output: 'III', grammar: 'III' },
  Restorative: { output: 'III', grammar: 'I' },

  // Influencing — mostly Path II (output-first, just enough grammar to use)
  Activator: { output: 'II', grammar: 'II' },
  Command: { output: 'II', grammar: 'III' },
  Communication: { output: 'II', grammar: 'III' },
  Competition: { output: 'III', grammar: 'III' },
  Maximizer: { output: 'I', grammar: 'I' },
  'Self-Assurance': { output: 'II', grammar: 'III' },
  Significance: { output: 'III', grammar: 'III' },
  Woo: { output: 'II', grammar: 'II' },
};

// ============================================================================
// NOTABLE COMBINATIONS
// ============================================================================
// Pairs/triples of themes that, when co-present in the top 10, have specific
// guidance beyond what each theme alone implies. Sourced from the "Theme
// Combination Guidance" section of gallup-strengths-pedagogy.md.

export interface ThemeCombination {
  themes: GallupTheme[];
  guidance: string;
}

export const NOTABLE_COMBINATIONS: ThemeCombination[] = [
  {
    themes: ['Input', 'Intellection'],
    guidance:
      'Etymological/historical/theoretical depth. Show the full architecture of patterns. Vocabulary should include etymology and word families; grammar should include historical evolution and theoretical underpinnings.',
  },
  {
    themes: ['Input', 'Learner'],
    guidance:
      'Voracious resource consumer. Curate carefully or this learner will overwhelm themselves with materials. Recommend the highest-leverage resources and explicitly warn against resource hoarding.',
  },
  {
    themes: ['Connectedness', 'Context'],
    guidance:
      'Wants to see the language in its cultural-historical web. Heavy cultural note treatment connecting language to broader historical and philosophical context.',
  },
  {
    themes: ['Strategic', 'Analytical'],
    guidance:
      'Wants the most efficient path. Make tradeoffs explicit; surface choices; let them optimize. Show why each design choice was made so they can validate or override.',
  },
  {
    themes: ['Achiever', 'Discipline'],
    guidance:
      'Daily practice machine. Build clear daily structure. Visible progress tracking is high-value. Suggest specific daily routines (15 minutes vocab, 15 minutes audio, etc.).',
  },
  {
    themes: ['Activator', 'Communication'],
    guidance:
      'Speak from day one, find partners now. Strongly Path II (Output-First). Skip extended preparation; get them into conversation immediately.',
  },
  {
    themes: ['Empathy', 'Harmony'],
    guidance:
      'Sensitive to social risk in producing language. Provide pragmatic safety nets — "safe" phrases that always work, explicit norms about politeness. Gentle output paths. Avoid pressure to speak before ready.',
  },
  {
    themes: ['Maximizer', 'Analytical'],
    guidance:
      'Refinement-oriented. Native-like quality matters; explicit instruction on register and pragmatics. Beyond "is it grammatical" — also "is it natural" and "is it native".',
  },
  {
    themes: ['Ideation', 'Strategic'],
    guidance:
      'Loves seeing patterns and picking the best path. Show alternatives explicitly; let them choose. Frame learning as pattern recognition across the system, not rule memorization.',
  },
  {
    themes: ['Relator', 'Developer'],
    guidance:
      'Best served by a long-term tutor or language exchange partner relationship. Recommend finding one consistent partner early. Avoid recommending many shallow language exchange events.',
  },
  {
    themes: ['Belief', 'Significance'],
    guidance:
      'Driven by deep purpose. The motivation captured during onboarding (heritage, work, etc.) should be referenced explicitly in lesson framing. Connect each lesson to the deeper why.',
  },
  {
    themes: ['Futuristic', 'Achiever'],
    guidance:
      'Long-term vision + daily execution. Bridge today\'s work to long-term outcome regularly. Each lesson should briefly mention what future capability this builds toward.',
  },
  {
    themes: ['Context', 'Connectedness'],
    guidance:
      'Wants to see how everything connects historically. Heavy historical-cultural treatment. Show how the language emerged from its history; how cultural practices are visible in linguistic patterns.',
  },
];

// ============================================================================
// THEME SECTION EXTRACTOR
// ============================================================================
// Pulls a specific theme's guidance section from the full gallup-strengths-pedagogy.md
// content. Uses simple markdown parsing — finds `### {Theme}` and returns up to
// the next `### ` or `## ` boundary.

export function getThemeSection(theme: GallupTheme): string {
  const lines = gallupPedagogy.split('\n');
  const startMarker = `### ${theme}`;
  let startIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === startMarker) {
      startIdx = i;
      break;
    }
  }
  if (startIdx === -1) return ''; // theme not found

  // Find the next section boundary
  let endIdx = lines.length;
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (lines[i].startsWith('### ') || lines[i].startsWith('## ')) {
      endIdx = i;
      break;
    }
  }
  return lines.slice(startIdx, endIdx).join('\n').trim();
}

// ============================================================================
// PATH RECOMMENDATION (weighted voting)
// ============================================================================

export interface PathRecommendation {
  outputPath: Path;
  grammarPath: Path;
  outputConfidence: 'strong' | 'moderate' | 'weak';
  grammarConfidence: 'strong' | 'moderate' | 'weak';
  outputVoteTally: Record<Path, number>;
  grammarVoteTally: Record<Path, number>;
  rationale: string;
}

export function recommendPaths(top10: GallupTheme[]): PathRecommendation {
  const outputVotes: Record<Path, number> = { I: 0, II: 0, III: 0 };
  const grammarVotes: Record<Path, number> = { I: 0, II: 0, III: 0 };

  top10.forEach((theme, i) => {
    const weight = i < 5 ? 2 : 1; // top 5 weighted double
    const leanings = THEME_PATH_LEANINGS[theme];
    if (!leanings) return;
    outputVotes[leanings.output] += weight;
    grammarVotes[leanings.grammar] += weight;
  });

  const outputPath = pickWinner(outputVotes);
  const grammarPath = pickWinner(grammarVotes);
  const outputConfidence = classifyConfidence(outputVotes, outputPath);
  const grammarConfidence = classifyConfidence(grammarVotes, grammarPath);

  const rationale = buildPathRationale(
    outputPath,
    grammarPath,
    outputConfidence,
    grammarConfidence,
    outputVotes,
    grammarVotes,
  );

  return {
    outputPath,
    grammarPath,
    outputConfidence,
    grammarConfidence,
    outputVoteTally: outputVotes,
    grammarVoteTally: grammarVotes,
    rationale,
  };
}

function pickWinner(votes: Record<Path, number>): Path {
  // Ties go to Balanced (III) — the safest default
  const max = Math.max(votes.I, votes.II, votes.III);
  if (votes.III === max) return 'III';
  if (votes.I >= votes.II) return 'I';
  return 'II';
}

function classifyConfidence(
  votes: Record<Path, number>,
  winner: Path,
): 'strong' | 'moderate' | 'weak' {
  const total = votes.I + votes.II + votes.III;
  if (total === 0) return 'weak';
  const winnerShare = votes[winner] / total;
  if (winnerShare >= 0.6) return 'strong';
  if (winnerShare >= 0.45) return 'moderate';
  return 'weak';
}

function buildPathRationale(
  outputPath: Path,
  grammarPath: Path,
  outputConfidence: string,
  grammarConfidence: string,
  outputVotes: Record<Path, number>,
  grammarVotes: Record<Path, number>,
): string {
  const outputLabel = pathLabel(outputPath, 'output');
  const grammarLabel = pathLabel(grammarPath, 'grammar');
  return [
    `**Output timing recommendation: ${outputLabel}** (${outputConfidence} signal — votes: I=${outputVotes.I}, II=${outputVotes.II}, III=${outputVotes.III})`,
    `**Grammar approach recommendation: ${grammarLabel}** (${grammarConfidence} signal — votes: I=${grammarVotes.I}, II=${grammarVotes.II}, III=${grammarVotes.III})`,
  ].join('\n');
}

function pathLabel(path: Path, axis: 'output' | 'grammar'): string {
  if (axis === 'output') {
    return {
      I: 'Path I (Input-First — accumulate comprehensible input before producing)',
      II: 'Path II (Output-First — speak from day one, accept imperfection)',
      III: 'Path III (Balanced — Four-Strands approach, equal weight to input and output)',
    }[path];
  }
  return {
    I: 'Path I (Explicit Grammar — formula-based instruction with deliberate study)',
    II: 'Path II (Acquired Grammar — pattern emergence through massive input)',
    III: 'Path III (Hybrid — explicit framing plus rich input to internalize)',
  }[path];
}

// ============================================================================
// DOMAIN DENSITY ANALYSIS
// ============================================================================

export interface DomainAnalysis {
  counts: Record<GallupDomain, number>;
  dominantDomain: GallupDomain | 'mixed';
  guidance: string;
}

export function analyzeDomainDistribution(top10: GallupTheme[]): DomainAnalysis {
  const counts: Record<GallupDomain, number> = {
    Executing: 0,
    Influencing: 0,
    'Relationship Building': 0,
    'Strategic Thinking': 0,
  };

  top10.forEach((theme) => {
    const domain = THEME_DOMAINS[theme];
    if (domain) counts[domain]++;
  });

  // A domain is "dominant" if it has 5+ themes (half or more of the top 10)
  const dominant = (Object.entries(counts) as [GallupDomain, number][]).find(
    ([, n]) => n >= 5,
  );
  const dominantDomain: GallupDomain | 'mixed' = dominant ? dominant[0] : 'mixed';

  const guidance = buildDomainGuidance(counts, dominantDomain);

  return { counts, dominantDomain, guidance };
}

function buildDomainGuidance(
  counts: Record<GallupDomain, number>,
  dominantDomain: GallupDomain | 'mixed',
): string {
  const distribution = `Distribution in top 10: Executing ${counts.Executing}, Influencing ${counts.Influencing}, Relationship Building ${counts['Relationship Building']}, Strategic Thinking ${counts['Strategic Thinking']}.`;

  if (dominantDomain === 'mixed') {
    return `${distribution}\n\nNo single dominant domain — this is a balanced profile. Apply per-theme guidance individually; don't apply heavy domain-density rules.`;
  }

  const domainRules: Record<GallupDomain, string> = {
    Executing:
      'EXECUTING-DOMINANT profile. Lesson design should emphasize completion criteria, visible progress, daily routines. Sections 7 (Drill) and 12 (Weekly Challenge) should have clear "done" states. Streaks and milestones motivate. Avoid abstract theory without immediate application. Tone: practical, action-oriented.',
    Influencing:
      'INFLUENCING-DOMINANT profile. Lesson design should emphasize real-world application, social use, impact. Strongly Path II (Output-First). Section 8 (Speaking) and Section 12 (Weekly Challenge) framed around social use. Tone: confident, energetic. Avoid long silent-period methodology.',
    'Relationship Building':
      'RELATIONSHIP-BUILDING-DOMINANT profile. Lesson design should emphasize connection to real people, cultural empathy, human stories behind language. Section 6 (Cultural Note) framed around people and stories; Section 12 (Weekly Challenge) framed around connection. Tone: warm, story-rich, people-centered. Avoid mechanical drill-heavy lessons.',
    'Strategic Thinking':
      'STRATEGIC-THINKING-DOMINANT profile. Lesson design should emphasize intellectual depth, pattern recognition, etymology, contrastive analysis, "why" not just "what". Often Path I on both axes (Input-First + Explicit Grammar). Section 3 (Grammar) deep treatment; Section 6 (Cultural Note) historical/philosophical; Section 2 (Vocabulary) includes etymology. Tone: intellectual, peer-in-inquiry. AVOID: gamification pressure (streaks, leaderboards), peppy/sales-y tone — these demotivate this profile.',
  };

  return `${distribution}\n\n${domainRules[dominantDomain]}`;
}

// ============================================================================
// COMBINATION DETECTION
// ============================================================================

export function findRelevantCombinations(top10: GallupTheme[]): ThemeCombination[] {
  const topSet = new Set(top10);
  return NOTABLE_COMBINATIONS.filter((combo) =>
    combo.themes.every((theme) => topSet.has(theme)),
  );
}

// ============================================================================
// VARK GUIDANCE
// ============================================================================

const VARK_GUIDANCE: Record<VARKPreference, string> = {
  visual:
    'VISUAL preference. Emphasize visual associations in Section 2 (Vocabulary): images, color-coded patterns, mind maps. Section 3 (Grammar): diagrams, tree structures, color-coded patterns. Section 6 (Cultural Note): reference images of places, foods, artifacts. Section 7 (Drill): visual matching exercises.',
  auditory:
    'AUDITORY preference. Heavy emphasis on Section 5 (Listening Exercise) — longer tasks, extra recommendations. Section 8 (Speaking) focus on shadowing, repetition, sound mimicry. Section 2 (Vocabulary) include pronunciation guides and audio deck recommendations.',
  'reading-writing':
    'READING-WRITING preference. Heavy emphasis on Section 4 (Reading Passage) — longer, more complex texts within level. Section 9 (Writing Exercise) substantive prompts. Section 2 (Vocabulary) detailed definitions and etymology. Section 11 (Self-Assessment) journal-style reflection.',
  kinesthetic:
    'KINESTHETIC preference. Section 12 (Weekly Challenge) ALWAYS physical/real-world action — go somewhere, do something, interact with someone in person, cook a recipe. Section 8 (Speaking) role-play and embodied practice. Section 7 (Drill) movement-based recall.',
  multimodal:
    'MULTI-MODAL preference. Layer multiple modalities — visual aids in grammar, audio for vocabulary, written prompts, and physical Weekly Challenge. Don\'t favor any one modality heavily.',
};

// ============================================================================
// MAIN ENTRY POINT — BUILDS THE FOCUSED PROFILE GUIDANCE BLOCK
// ============================================================================

export function buildProfileGuidance(profile: LearnerProfile): string {
  if (!profile || (!profile.gallupTop10?.length && !profile.vark && !profile.motivations?.length)) {
    return ''; // no profile data, no guidance block
  }

  const sections: string[] = [];

  sections.push('## Learner Profile — Applied Guidance');
  sections.push('');
  sections.push(
    'The lesson must be calibrated for this learner. Apply the guidance below throughout the 12-section lesson.',
  );
  sections.push('');

  // --- Gallup CliftonStrengths block ---
  if (profile.gallupTop10?.length) {
    // List the top 10 with tier flags
    sections.push('### Learner\'s Top 10 CliftonStrengths Themes');
    sections.push('');
    sections.push(
      'Top 5 are DOMINANT influences (heavy weight). Positions 6-10 are SUPPORTING influences (color but don\'t dominate).',
    );
    sections.push('');
    profile.gallupTop10.forEach((theme, i) => {
      const tier = i < 5 ? 'DOMINANT' : 'SUPPORTING';
      const domain = THEME_DOMAINS[theme] || 'Unknown';
      sections.push(`${i + 1}. **${theme}** [${domain}] — ${tier}`);
    });
    sections.push('');

    // Domain analysis
    const domainAnalysis = analyzeDomainDistribution(profile.gallupTop10);
    sections.push('### Domain Distribution Analysis');
    sections.push('');
    sections.push(domainAnalysis.guidance);
    sections.push('');

    // Path recommendation
    const pathRec = recommendPaths(profile.gallupTop10);
    sections.push('### Recommended Learning Paths');
    sections.push('');
    sections.push(pathRec.rationale);
    sections.push('');
    sections.push(
      'Calibrate the lesson to favor these paths. If the learner\'s profile leans strongly toward Path I on output, de-emphasize early speaking pressure in Sections 8 and 12; treat speaking as preparation rather than primary practice. If Path II, frame Section 8 and 12 around immediate social use. If Path III, the framework\'s balanced default applies.',
    );
    sections.push('');

    // Per-theme guidance for each of the top 10
    sections.push('### Per-Theme Guidance (only the themes in this learner\'s top 10)');
    sections.push('');
    profile.gallupTop10.forEach((theme, i) => {
      const tier = i < 5 ? 'DOMINANT' : 'SUPPORTING';
      const section = getThemeSection(theme);
      if (section) {
        sections.push(`#### ${i + 1}. ${theme} (${tier})`);
        sections.push('');
        sections.push(section.replace(/^### .*\n/, '').trim());
        sections.push('');
      }
    });

    // Combinations
    const relevantCombos = findRelevantCombinations(profile.gallupTop10);
    if (relevantCombos.length > 0) {
      sections.push('### Notable Theme Combinations Present in This Profile');
      sections.push('');
      sections.push(
        'These combinations have specific guidance beyond what each theme alone implies:',
      );
      sections.push('');
      relevantCombos.forEach((combo) => {
        sections.push(`- **${combo.themes.join(' + ')}:** ${combo.guidance}`);
      });
      sections.push('');
    }
  }

  // --- VARK block ---
  if (profile.vark) {
    sections.push('### Learning Modality Preference');
    sections.push('');
    sections.push(VARK_GUIDANCE[profile.vark]);
    sections.push('');
  }

  // --- Motivation block ---
  if (profile.motivations?.length) {
    sections.push('### Stated Motivation(s)');
    sections.push('');
    const motivationList = profile.motivations
      .map((m) => (m === 'other' && profile.motivationOther ? `other (${profile.motivationOther})` : m))
      .join(', ');
    sections.push(
      `The learner is studying this language for: **${motivationList}**. Apply the corresponding framing to Section 6 (Cultural Note) and Section 12 (Weekly Challenge) per the Learner Profile Pedagogy document. When multiple motivations are present, weave them in proportion across the curriculum rather than serving only the most-listed one.`,
    );
    sections.push('');
  }

  // --- Time commitment block ---
  if (profile.timeCommitment) {
    sections.push('### Time Commitment');
    sections.push('');
    sections.push(
      `**${profile.timeCommitment}** weekly time available. Calibrate lesson density and supplementary recommendations accordingly. Casual = self-contained lessons that survive gaps; Committed = standard pacing; Intensive/Immersion = recommend additional supplementary material beyond the lesson.`,
    );
    sections.push('');
  }

  // --- Prior experience block ---
  if (profile.priorExperience) {
    sections.push('### Prior Language Experience');
    sections.push('');
    const experienceGuidance: Record<string, string> = {
      monolingual:
        'First L2 attempt. Provide heavy contrastive analysis with English. Explicit grammar explanations. More scaffolding. Don\'t assume awareness of linguistic concepts.',
      'one-prior-l2':
        'One prior L2 at A2-B1. Some pattern recognition transfers. Moderate scaffolding. Can reference the prior language in contrastive analysis.',
      multilingual:
        'Multilingual (3+). Sophisticated pattern recognition. Less scaffolding needed. Cross-language references are appreciated.',
      'heritage-passive':
        'Heritage passive fluency. Skip beginner content where appropriate. Focus on activating productive skills, register expansion, literacy if relevant.',
      polyglot:
        'Polyglot (5+ languages). Treat as peer in linguistic inquiry. Show comparative grammar across languages they may know. Don\'t oversimplify.',
    };
    sections.push(experienceGuidance[profile.priorExperience] || '');
    sections.push('');
  }

  // --- Goal level block ---
  if (profile.goalLevel) {
    sections.push('### Stated Goal Level');
    sections.push('');
    sections.push(
      `Target: **${profile.goalLevel}**. Calibrate lesson depth and supplementary recommendations to support this trajectory.`,
    );
    sections.push('');
  }

  // --- Notes ---
  if (profile.notes) {
    sections.push('### Additional Notes from Learner');
    sections.push('');
    sections.push(profile.notes);
    sections.push('');
  }

  return sections.join('\n');
}
