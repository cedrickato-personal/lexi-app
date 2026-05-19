// lib/prompt-builder.ts
// Builds the per-lesson prompt that the user copies into Claude.ai.
// Composes: pedagogy foundations + language reference + addendum + profile guidance + week spec + universal template.

import { LANGUAGES } from './languages';
import { getCurriculum } from './curricula';
import {
  pedagogyFoundations,
  getLanguageReference,
  getLanguageAddendum,
} from './references';
import { buildProfileGuidance } from './learner-profile-engine';
import type { LearnerProfile } from './types';

const LESSON_TEMPLATE = `
## Required Lesson Structure (12 sections — ALL of them)

Produce a complete lesson with all 12 sections. Use the section names exactly as below. Use markdown headings with \`### N. Section Name\` for the 12 numbered sections.

### 1. Lesson Overview
Brief intro: what this week covers, why it matters, how it builds on prior weeks. Announce the anchor sentence here. 2-3 paragraphs.

### 2. Key Vocabulary
~20-30 vocabulary items. Each item: target-language word/phrase, English gloss, part of speech, grammatical info appropriate to the language (gender, plural, case forms, aspect pair for verbs, etc. — follow the language reference's conventions). Pair words with their most common collocations. Cultural notes where relevant. For difficult items (false friends, unfamiliar phonology, non-Latin scripts), include a mnemonic anchor where genuinely helpful.

### 3. Grammar Focus
The main grammatical pattern(s) of the week. Present each pattern as: a compact formula (e.g., \`N1 wa N2 desu\`), a natural-language explanation, a contrast with English when useful, and 5-10 memorable examples (target language + English). Add a "Common Pitfalls" subsection with 2-4 typical mistakes English speakers make.

### 4. Reading Passage
A level-appropriate passage in the target language (consult the language reference for per-level word-count guidance). Must hit ≥95% comprehension threshold using known vocabulary from this and prior weeks. New vocabulary appears in Section 2 first; the passage reuses it in context.

### 5. Listening Exercise
One specific, real, findable resource (YouTube channel + video, podcast + episode topic, song + artist, or film scene) calibrated to this level. 3-5 comprehension questions the learner should be able to answer after listening.

### 6. Cultural Note
1-2 substantive paragraphs. Tied to this week's content. Name SPECIFIC countries, customs, people, dishes, holidays, songs, places, or events — no generic statements. Rotate across the rotation strategy from the language reference. Apply sensitivity guidance from Part 10 of the reference.

### 7. Reading Exercise
3-5 comprehension or analysis questions on the Section 4 passage (or a related short text). Mix factual recall with inference. Include vocabulary-from-context items where appropriate.

### 8. Speaking Exercise
10 speaking prompts (record yourself, listen back). Plus ONE pronunciation drill targeting this week's specific challenge: tongue-twister, minimal-pair set, tone drill, or a difficult sound. For language-specific pronunciation challenges (aspirated stops, tones, palatalization, pharyngeals, etc.) follow the reference.

### 9. Writing Exercise
One concrete, communicative prompt at appropriate word count for the level. 3-5 guiding questions to help structure the response. A "Look out for" subsection with 2-3 common error patterns relevant to this week's grammar. Provide a brief model answer.

### 10. Cultural / Pragmatic Notes
Honorific/register guidance, address terms, formality cues, regional variation. Anything pragmatic the learner should know to avoid social missteps even with correct grammar.

### 11. Self-Assessment Checklist
5-8 specific "Can I..." statements directly mapped to this week's Learning Objectives. Learner rates each 1-5 honestly. Add: "Anything rated 3 or below, revisit before moving on." For B1+ lessons, gently acknowledge the intermediate plateau where appropriate.

### 12. Weekly Challenge
One concrete real-world mini-mission. Specific, measurable, time-bound, action-oriented. Not "improve your speaking" but "by Friday, have a 2-minute conversation with a tutor about [specific topic]." Doable today. For B2+ lessons, invite the learner to personalize around their own interests.

## Quality Standards

- Write natural target-language text a native speaker would actually use; not textbook-stilted.
- Match the variety decisions from the language reference (Part 2).
- Apply the seven-dimensions framework appropriately for this language.
- Honor cultural sensitivity guidance, particularly Part 10 of the language reference.
- Include script work where relevant for non-Latin scripts in early weeks.
- Honor honorific levels where relevant (vous/tu, ви/ти, aap/tum/tu, etc.).
- For sensitive topics: present factually; don't endorse political positions; don't falsely "balance" facts that are matters of historical record.
- Vary modality across weeks — don't default to the same exercise format every time.
- Mistakes are framed as data, not failure. Tone is encouraging.

## Format

Use markdown. Headings with ##. Subheadings with ###. Use tables where helpful. Use bold for key terms. Use code blocks for grammar formulas and SRS cards. Keep total length roughly 2,500-4,000 words. Output ONLY the lesson — no preamble, no postamble, no "Here's the lesson" — start directly with \`### 1. Lesson Overview\`.
`.trim();

export function buildPrompt(
  langCode: string,
  weekNumber: number,
  profile?: LearnerProfile | null
): string {
  const lang = LANGUAGES[langCode];
  const curriculum = getCurriculum(langCode);
  if (!lang || !curriculum) {
    throw new Error(`Unknown language: ${langCode}`);
  }

  const week = curriculum.weeks.find((w) => w.number === weekNumber);
  if (!week) {
    throw new Error(`Week ${weekNumber} not found for ${langCode}`);
  }

  const langRef = getLanguageReference(langCode);
  const addendum = getLanguageAddendum(langCode);

  const prev = curriculum.weeks.find((w) => w.number === weekNumber - 1);
  const next = curriculum.weeks.find((w) => w.number === weekNumber + 1);

  const levelWeeks = curriculum.weeks.filter((w) => w.level === week.level);
  const positionInLevel = levelWeeks.findIndex((w) => w.number === weekNumber) + 1;

  const profileGuidance = profile ? buildProfileGuidance(profile) : '';

  const enrichmentLines: string[] = [];
  if (week.anchorSentence) {
    enrichmentLines.push(`- **Anchor sentence:** ${week.anchorSentence}`);
  }
  if (week.culturalTouchstones?.length) {
    enrichmentLines.push(
      `- **Cultural touchstones for this week:** ${week.culturalTouchstones.join(', ')}`
    );
  }
  if (week.signatureGrammarPatterns?.length) {
    enrichmentLines.push(
      `- **Signature grammar patterns:** ${week.signatureGrammarPatterns.join(', ')}`
    );
  }
  const enrichmentBlock = enrichmentLines.length
    ? '\n' + enrichmentLines.join('\n')
    : '';

  return `You are creating Week ${weekNumber} of a ${lang.totalWeeks}-week ${lang.name} curriculum for an English-speaking learner. This lesson will be saved as content for a future ${lang.name} language learning app, so consistency and quality matter.

## Pedagogy Context (universal principles)

${pedagogyFoundations}

## ${lang.name}-Specific Reference

${langRef}
${addendum ? `\n## ${lang.name}-Specific Pedagogical Addendum\n\n${addendum}\n` : ''}${profileGuidance ? `\n${profileGuidance}\n` : ''}

## This Week's Spec

- **Week:** ${weekNumber} of ${lang.totalWeeks}
- **Title:** ${week.title}
- **Level:** ${week.level}
- **Core focus:** ${week.focus}
- **Position in level:** Week ${positionInLevel} of ${levelWeeks.length}
- **Previous week:** ${prev ? `${prev.number}: ${prev.title}` : 'None (this is week 1)'}
- **Next week:** ${next ? `${next.number}: ${next.title}` : 'None (this is the final week)'}${enrichmentBlock}

${LESSON_TEMPLATE}

Begin the lesson now.`;
}

/** Lightweight character count used for UX display. */
export function estimatePromptSize(langCode: string, weekNumber: number, profile?: LearnerProfile | null): number {
  try {
    return buildPrompt(langCode, weekNumber, profile).length;
  } catch {
    return 0;
  }
}
