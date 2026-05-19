"use client";

import {
  Headphones,
  Eye,
  PenLine,
  Activity,
  Sparkles,
  X,
  Check,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import type {
  GallupTheme,
  LearnerMotivation,
  LearnerProfile,
  PriorLanguageExperience,
  StatedGoalLevel,
  VARKPreference,
  WeeklyTimeCommitment,
} from "@/lib/types";
import { THEME_DOMAINS, type GallupDomain } from "@/lib/learner-profile-engine";
import { LANGUAGES_LIST, FSI_CATEGORIES } from "@/lib/languages";
import { FAMILY_THEMES } from "@/lib/family-theme";

export type ProfileDraft = Partial<LearnerProfile>;

const ALL_THEMES: GallupTheme[] = [
  "Achiever", "Activator", "Adaptability", "Analytical", "Arranger", "Belief",
  "Command", "Communication", "Competition", "Connectedness", "Consistency",
  "Context", "Deliberative", "Developer", "Discipline", "Empathy", "Focus",
  "Futuristic", "Harmony", "Ideation", "Includer", "Individualization", "Input",
  "Intellection", "Learner", "Maximizer", "Positivity", "Relator", "Responsibility",
  "Restorative", "Self-Assurance", "Significance", "Strategic", "Woo",
];

const DOMAIN_COLOR: Record<GallupDomain, string> = {
  Executing: "bg-violet-100 text-violet-800",
  Influencing: "bg-orange-100 text-orange-800",
  "Relationship Building": "bg-sky-100 text-sky-800",
  "Strategic Thinking": "bg-emerald-100 text-emerald-800",
};

const VARK_OPTIONS: { value: VARKPreference; label: string; icon: React.ElementType; desc: string }[] = [
  { value: "visual",          label: "Visual",          icon: Eye,        desc: "Mind maps, color-coded notes, diagrams, demo videos." },
  { value: "auditory",        label: "Auditory",        icon: Headphones, desc: "Podcasts, songs, recorded explanations, talking out loud." },
  { value: "reading-writing", label: "Reading-Writing", icon: PenLine,    desc: "Heavy on text, lists, written practice, vocabulary tables." },
  { value: "kinesthetic",     label: "Kinesthetic",     icon: Activity,   desc: "Role-play, shadowing, gestures, physical context cues." },
  { value: "multimodal",      label: "Multi-modal",     icon: Sparkles,   desc: "Switch among modes depending on the material." },
];

const MOTIVATIONS: { value: LearnerMotivation; label: string }[] = [
  { value: "heritage",              label: "Heritage / family roots" },
  { value: "travel",                label: "Travel" },
  { value: "work",                  label: "Work / career" },
  { value: "relationship",          label: "Relationship / partner / friends" },
  { value: "academic",              label: "Academic / scholarly" },
  { value: "religious",             label: "Religious / sacred texts" },
  { value: "cognitive-challenge",   label: "Cognitive challenge" },
  { value: "cultural-appreciation", label: "Cultural appreciation" },
  { value: "other",                 label: "Other" },
];

const TIME_OPTIONS: { value: WeeklyTimeCommitment; label: string; desc: string }[] = [
  { value: "casual",     label: "Casual",     desc: "1–2 hrs/week" },
  { value: "committed",  label: "Committed",  desc: "3–5 hrs/week" },
  { value: "intensive",  label: "Intensive",  desc: "5–10 hrs/week" },
  { value: "immersion",  label: "Immersion",  desc: "20+ hrs/week" },
];

const PRIOR_OPTIONS: { value: PriorLanguageExperience; label: string; desc: string }[] = [
  { value: "monolingual",      label: "First L2",         desc: "English only — this is my first second language." },
  { value: "one-prior-l2",     label: "One prior L2",     desc: "I've reached A2-B1 in one other language." },
  { value: "multilingual",     label: "Multilingual",     desc: "I speak 3 or more languages." },
  { value: "heritage-passive", label: "Heritage passive", desc: "I understand it from family but can't speak." },
  { value: "polyglot",         label: "Polyglot",         desc: "I speak 5+ languages." },
];

const GOAL_OPTIONS: { value: StatedGoalLevel; label: string; desc: string }[] = [
  { value: "A2",                    label: "A2",                    desc: "Basic survival — travel, simple conversations." },
  { value: "B1-B2",                 label: "B1–B2",                 desc: "Functional fluency — work, daily life, opinions." },
  { value: "C1+",                   label: "C1+",                   desc: "Advanced — professional, literary, near-native." },
  { value: "heritage-maintenance",  label: "Heritage maintenance",  desc: "Reconnect with what I once had." },
];

export function ProfileForm({
  draft,
  onChange,
}: {
  draft: ProfileDraft;
  onChange: (d: ProfileDraft) => void;
}) {
  const set = <K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) =>
    onChange({ ...draft, [key]: value });

  const setTheme = (slot: number, theme: GallupTheme | "") => {
    const current = [...(draft.gallupTop10 ?? [])] as (GallupTheme | undefined)[];
    while (current.length < 10) current.push(undefined);
    current[slot] = theme === "" ? undefined : theme;
    onChange({ ...draft, gallupTop10: current.filter(Boolean) as GallupTheme[] });
  };

  const themesUsed = new Set(draft.gallupTop10 ?? []);

  return (
    <div className="space-y-10">
      {/* ───── Gallup Top 10 ───── */}
      <Section
        kicker="01"
        title="CliftonStrengths Top 10"
        subtitle="If you've taken the Gallup assessment, enter your top 10 themes in order. Top 5 most heavily influence lesson design; positions 6-10 add nuance. Leave blank to skip."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-x-2 gap-y-5">
          {Array.from({ length: 10 }).map((_, i) => {
            const value = (draft.gallupTop10?.[i] ?? "") as GallupTheme | "";
            const isTop5 = i < 5;
            return (
              <div key={i} className="flex flex-col gap-1.5 min-w-0">
                <label
                  className={`text-[10px] font-mono uppercase tracking-widest ${
                    isTop5 ? "text-orange-700 font-semibold" : "text-stone-400"
                  }`}
                >
                  #{i + 1}{isTop5 ? " · Top 5" : ""}
                </label>
                <select
                  value={value}
                  onChange={(e) => setTheme(i, e.target.value as GallupTheme | "")}
                  className="w-full h-9 px-2.5 pr-7 rounded-md border border-stone-200 bg-white text-sm focus:outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-200/40 appearance-none cursor-pointer"
                >
                  <option value="">—</option>
                  {ALL_THEMES.map((t) => {
                    const usedElsewhere = themesUsed.has(t) && draft.gallupTop10?.[i] !== t;
                    return (
                      <option key={t} value={t} disabled={usedElsewhere}>
                        {t}{usedElsewhere ? " (used)" : ""}
                      </option>
                    );
                  })}
                </select>
                <span
                  className={`inline-block self-start text-[10px] px-1.5 py-0.5 rounded leading-none h-4 ${
                    value ? DOMAIN_COLOR[THEME_DOMAINS[value]] : "invisible"
                  }`}
                >
                  {value ? THEME_DOMAINS[value] : "placeholder"}
                </span>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ───── VARK ───── */}
      <Section
        kicker="02"
        title="Learning modality"
        subtitle="How do you absorb information best? Pick the one that fits most — or multi-modal if it varies."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {VARK_OPTIONS.map(({ value, label, icon: Icon, desc }) => {
            const active = draft.vark === value;
            return (
              <button
                key={value}
                onClick={() => set("vark", active ? undefined : value)}
                className={`text-left p-4 rounded-xl border transition-all ${
                  active
                    ? "border-orange-400 bg-orange-50/60 shadow-sm"
                    : "border-stone-200 bg-white hover:border-stone-300"
                }`}
              >
                <Icon className={`w-4 h-4 mb-2 ${active ? "text-orange-700" : "text-stone-500"}`} />
                <p className="font-display font-semibold text-sm text-stone-900 mb-1">{label}</p>
                <p className="text-[11px] text-stone-500 leading-relaxed">{desc}</p>
              </button>
            );
          })}
        </div>
      </Section>

      {/* ───── Motivation (multi-select) ───── */}
      <Section
        kicker="03"
        title="Why are you learning?"
        subtitle="Pick any that apply — multiple reasons are common. Shapes how cultural content and weekly challenges are framed."
      >
        <div className="flex flex-wrap gap-2">
          {MOTIVATIONS.map(({ value, label }) => {
            const motivations = draft.motivations ?? [];
            const active = motivations.includes(value);
            return (
              <button
                key={value}
                onClick={() => {
                  const next = active
                    ? motivations.filter((m) => m !== value)
                    : [...motivations, value];
                  const update: Partial<ProfileDraft> = {
                    motivations: next.length > 0 ? next : undefined,
                  };
                  // If user un-checks "other", clear the free-text field too
                  if (active && value === "other") update.motivationOther = undefined;
                  onChange({ ...draft, ...update });
                }}
                className={`inline-flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-medium transition-all ${
                  active
                    ? "bg-stone-900 text-white border border-stone-900"
                    : "border border-stone-200 bg-white text-stone-700 hover:border-stone-300"
                }`}
              >
                {active && <Check className="w-3 h-3" />}
                {label}
              </button>
            );
          })}
        </div>
        {draft.motivations?.includes("other") && (
          <div className="mt-3">
            <label className="text-[10px] font-mono uppercase tracking-widest text-stone-400 mb-1.5 block">
              Tell us about &quot;Other&quot;
            </label>
            <input
              type="text"
              value={draft.motivationOther ?? ""}
              onChange={(e) => set("motivationOther", e.target.value)}
              placeholder={'e.g., "preparing for a year abroad in Buenos Aires"'}
              className="w-full max-w-xl h-9 px-3 rounded-md border border-stone-200 bg-white text-sm focus:outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-200/40"
            />
          </div>
        )}
      </Section>

      {/* ───── Time Commitment ───── */}
      <Section
        kicker="04"
        title="Time commitment"
        subtitle="How much time can you actually give per week? Affects pacing recommendations."
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {TIME_OPTIONS.map(({ value, label, desc }) => {
            const active = draft.timeCommitment === value;
            return (
              <button
                key={value}
                onClick={() => set("timeCommitment", active ? undefined : value)}
                className={`text-left p-4 rounded-xl border transition-all ${
                  active
                    ? "border-orange-400 bg-orange-50/60 shadow-sm"
                    : "border-stone-200 bg-white hover:border-stone-300"
                }`}
              >
                <p className="font-display font-semibold text-sm text-stone-900 mb-0.5">{label}</p>
                <p className="text-[11px] text-stone-500">{desc}</p>
              </button>
            );
          })}
        </div>
      </Section>

      {/* ───── Prior experience ───── */}
      <Section
        kicker="05"
        title="Prior language experience"
        subtitle="Affects how much contrastive analysis appears in grammar notes."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {PRIOR_OPTIONS.map(({ value, label, desc }) => {
            const active = draft.priorExperience === value;
            return (
              <button
                key={value}
                onClick={() => set("priorExperience", active ? undefined : value)}
                className={`text-left p-4 rounded-xl border transition-all ${
                  active
                    ? "border-orange-400 bg-orange-50/60 shadow-sm"
                    : "border-stone-200 bg-white hover:border-stone-300"
                }`}
              >
                <p className="font-display font-semibold text-sm text-stone-900 mb-0.5">{label}</p>
                <p className="text-[11px] text-stone-500 leading-snug">{desc}</p>
              </button>
            );
          })}
        </div>
      </Section>

      {/* ───── Goal level ───── */}
      <Section
        kicker="06"
        title="Goal level"
        subtitle="Where you want to end up. The lesson generator paces accordingly."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {GOAL_OPTIONS.map(({ value, label, desc }) => {
            const active = draft.goalLevel === value;
            return (
              <button
                key={value}
                onClick={() => set("goalLevel", active ? undefined : value)}
                className={`text-left p-4 rounded-xl border transition-all ${
                  active
                    ? "border-orange-400 bg-orange-50/60 shadow-sm"
                    : "border-stone-200 bg-white hover:border-stone-300"
                }`}
              >
                <p className="font-display font-semibold text-sm text-stone-900 mb-0.5">{label}</p>
                <p className="text-[11px] text-stone-500 leading-snug">{desc}</p>
              </button>
            );
          })}
        </div>
      </Section>

      {/* ───── Languages of interest (multi-select) ───── */}
      <Section
        kicker="07"
        title="Languages you want to learn"
        subtitle="Pick any that interest you. They'll be prioritized on your home screen — you can still explore all 31 anytime."
      >
        <LanguagePicker
          selected={draft.interestedLanguages ?? []}
          onChange={(next) =>
            onChange({ ...draft, interestedLanguages: next.length ? next : undefined })
          }
        />
      </Section>

      {/* ───── Notes ───── */}
      <Section
        kicker="08"
        title="Anything else?"
        subtitle="Languages you already speak, specific interests, learning history — anything that would help calibrate lessons."
      >
        <Textarea
          value={draft.notes ?? ""}
          onChange={(e) => set("notes", e.target.value)}
          placeholder={`e.g., "Already speak Spanish (B2) and Italian (A2). Want to learn Japanese for literature — modern fiction especially."`}
          className="min-h-24 resize-y border-stone-200 bg-white focus-visible:border-orange-300 focus-visible:ring-orange-200/40"
        />
      </Section>
    </div>
  );
}

function Section({
  kicker,
  title,
  subtitle,
  children,
}: {
  kicker: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-baseline gap-3 mb-3">
        <span className="font-mono text-[10px] uppercase tracking-widest text-stone-400">{kicker}</span>
        <h3 className="font-display text-xl font-semibold text-stone-900 tracking-tight">{title}</h3>
      </div>
      {subtitle && <p className="text-sm text-stone-600 leading-relaxed max-w-2xl mb-4">{subtitle}</p>}
      {children}
    </section>
  );
}

function LanguagePicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const toggle = (code: string) => {
    if (selected.includes(code)) {
      onChange(selected.filter((c) => c !== code));
    } else {
      onChange([...selected, code]);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <p className="text-xs text-stone-500">
          {selected.length === 0
            ? "None selected yet — your home will show all 31 languages."
            : `${selected.length} selected · ${selected.length === 1 ? "shown" : "all shown"} on your home screen`}
        </p>
        {selected.length > 0 && (
          <button
            onClick={() => onChange([])}
            className="text-xs text-stone-500 hover:text-orange-800 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {FSI_CATEGORIES.map((cat) => {
        const langs = LANGUAGES_LIST.filter((l) => l.fsiCategory === cat.cat);
        if (!langs.length) return null;
        return (
          <div key={cat.cat}>
            <p className="font-mono text-[10px] uppercase tracking-widest text-stone-400 mb-2">
              {cat.label}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {langs.map((lang) => {
                const theme = FAMILY_THEMES[lang.family];
                const active = selected.includes(lang.code);
                return (
                  <button
                    key={lang.code}
                    onClick={() => toggle(lang.code)}
                    className={`inline-flex items-center gap-2 pl-2 pr-3 h-8 rounded-md text-xs font-medium border transition-all ${
                      active
                        ? "border-stone-900 bg-stone-900 text-white shadow-sm"
                        : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
                    }`}
                  >
                    {active ? (
                      <Check className="w-3 h-3 shrink-0" />
                    ) : (
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: theme.accentHex }}
                      />
                    )}
                    <span>{lang.name}</span>
                    <span
                      className={`text-[10px] ${active ? "text-stone-300" : "text-stone-400"}`}
                      style={lang.script !== "Latin" ? { fontFamily: theme.targetFontStack } : undefined}
                    >
                      {lang.nativeName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ClearProfileButton({ onClear }: { onClear: () => void }) {
  return (
    <button
      onClick={onClear}
      className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 inline-flex items-center gap-1 px-3 h-8 rounded-md transition-colors"
    >
      <X className="w-3.5 h-3.5" />
      Clear profile
    </button>
  );
}
