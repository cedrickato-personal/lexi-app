"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ChevronLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { saveProfile, setOnboardingResolved } from "@/lib/storage";
import { pushProfile } from "@/lib/storage-sync";
import { Nav } from "@/components/nav";
import { ProfileForm, type ProfileDraft } from "@/components/profile-form";
import { useAuth } from "@/components/auth-provider";
import type { LearnerProfile } from "@/lib/types";
import { toast } from "sonner";

const STEPS = [
  { id: "welcome", label: "Welcome" },
  { id: "profile", label: "Profile" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<ProfileDraft>({});

  const handleSkip = async () => {
    setOnboardingResolved("skipped");
    if (user) {
      pushProfile(user.id, {}, { onboardingState: "skipped" }).catch(() => {});
    }
    toast.success("Skipped — lessons will use the framework's balanced default.", {
      duration: 4000,
    });
    router.push("/");
  };

  const handleSave = async () => {
    const profile: LearnerProfile = {
      gallupTop10: draft.gallupTop10?.length === 10 ? draft.gallupTop10 : undefined,
      vark: draft.vark,
      motivations: draft.motivations?.length ? draft.motivations : undefined,
      motivationOther: draft.motivations?.includes("other") && draft.motivationOther?.trim()
        ? draft.motivationOther.trim()
        : undefined,
      timeCommitment: draft.timeCommitment,
      priorExperience: draft.priorExperience,
      goalLevel: draft.goalLevel,
      interestedLanguages: draft.interestedLanguages?.length ? draft.interestedLanguages : undefined,
      notes: draft.notes?.trim() || undefined,
    };
    const hasAnything = Object.values(profile).some(
      (v) => v !== undefined && (Array.isArray(v) ? v.length > 0 : true)
    );
    if (!hasAnything) {
      toast.error("Add at least one field — or skip if you'd rather not share.");
      return;
    }
    saveProfile(profile);
    if (user) {
      pushProfile(user.id, profile, {
        onboardingState: "completed",
        display_name: (user.user_metadata?.full_name as string | undefined) ?? null,
        email: user.email ?? null,
        avatar_url: (user.user_metadata?.avatar_url as string | undefined) ?? null,
      }).catch(() => {});
    }
    toast.success("Profile saved — lessons will be calibrated to you.");
    router.push("/");
  };

  return (
    <>
      <Nav />
      <main className="min-h-[calc(100vh-3.5rem)]">
        {step === 0 ? (
          <WelcomeStep onContinue={() => setStep(1)} onSkip={handleSkip} />
        ) : (
          <ProfileStep
            draft={draft}
            setDraft={setDraft}
            onBack={() => setStep(0)}
            onSave={handleSave}
            onSkip={handleSkip}
          />
        )}
      </main>
    </>
  );
}

function WelcomeStep({ onContinue, onSkip }: { onContinue: () => void; onSkip: () => void }) {
  return (
    <div className="max-w-3xl mx-auto px-6 pt-16 pb-24">
      <p className="text-xs uppercase tracking-[0.22em] text-orange-800/80 font-medium mb-5 flex items-center gap-2">
        <span className="inline-block w-8 h-px bg-orange-700/60" />
        Welcome to Lexi
      </p>

      <h1 className="font-display text-5xl md:text-6xl font-semibold text-stone-900 tracking-tight leading-[1.02] mb-7">
        A curriculum generator,
        <br />
        <span className="italic text-orange-800">calibrated to you</span>.
      </h1>

      <p className="text-lg text-stone-600 leading-relaxed mb-3 max-w-xl">
        Lexi generates research-grounded weekly lessons across 31 languages — from A1
        beginner to C2 mastery — powered by Claude.ai.
      </p>
      <p className="text-base text-stone-500 leading-relaxed mb-10 max-w-xl">
        Before you start, we&apos;d like to know a few things about how you learn best.
        It takes about 3 minutes, and every lesson afterward is calibrated to your
        strengths and preferences. <span className="text-stone-700">Completely optional</span> —
        you can skip and still get excellent lessons.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-10">
        {[
          {
            kicker: "01",
            title: "How you process",
            body: "CliftonStrengths Top 10 — if you've taken Gallup. Otherwise leave blank.",
          },
          {
            kicker: "02",
            title: "How you absorb",
            body: "Visual, auditory, reading-writing, kinesthetic, or multi-modal.",
          },
          {
            kicker: "03",
            title: "Why & how much",
            body: "Your motivation, time commitment, prior experience, and goal level.",
          },
        ].map((card) => (
          <div
            key={card.kicker}
            className="bg-white rounded-xl border border-stone-200/70 p-5"
          >
            <p className="font-mono text-[10px] uppercase tracking-widest text-stone-400 mb-3">
              {card.kicker}
            </p>
            <h3 className="font-display text-base font-semibold text-stone-900 mb-1.5">
              {card.title}
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">{card.body}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={onContinue}
          className="inline-flex items-center justify-center gap-2 rounded-lg h-11 px-6 text-sm font-medium bg-stone-900 hover:bg-stone-800 text-white transition-all shadow-sm hover:shadow"
        >
          <Sparkles className="w-4 h-4" />
          Set up my profile
          <ArrowRight className="w-4 h-4 ml-1 opacity-60" />
        </button>
        <button
          onClick={onSkip}
          className="inline-flex items-center justify-center gap-2 h-11 px-5 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
        >
          Skip for now
        </button>
        <Link
          href="/_about"
          className="ml-auto text-xs text-stone-400 hover:text-orange-800 transition-colors inline-flex items-center gap-1"
        >
          What this is
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

function ProfileStep({
  draft,
  setDraft,
  onBack,
  onSave,
  onSkip,
}: {
  draft: ProfileDraft;
  setDraft: (d: ProfileDraft) => void;
  onBack: () => void;
  onSave: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="max-w-4xl mx-auto px-6 pt-12 pb-24">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-orange-800 transition-colors mb-6"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        Back
      </button>

      <p className="text-xs uppercase tracking-[0.22em] text-orange-800/80 font-medium mb-4 flex items-center gap-2">
        <span className="inline-block w-8 h-px bg-orange-700/60" />
        Step 2 of 2 · Profile
      </p>
      <h1 className="font-display text-4xl md:text-5xl font-semibold text-stone-900 tracking-tight mb-3">
        Calibrate your <span className="italic text-orange-800">lessons</span>
      </h1>
      <p className="text-base text-stone-600 max-w-2xl mb-10 leading-relaxed">
        Fill in what feels relevant — leave the rest blank. Every section is optional.
        The more you share, the more lesson generation can be tuned to you.
      </p>

      <ProfileForm draft={draft} onChange={setDraft} />

      <div className="sticky bottom-0 left-0 right-0 mt-10 -mx-6 px-6 py-4 bg-[#FAF8F3]/95 backdrop-blur-md border-t border-stone-200/70 flex items-center justify-between flex-wrap gap-3">
        <button
          onClick={onSkip}
          className="text-sm text-stone-500 hover:text-stone-800 transition-colors"
        >
          Skip — use balanced defaults
        </button>
        <button
          onClick={onSave}
          className="inline-flex items-center gap-2 rounded-lg h-10 px-5 text-sm font-medium bg-stone-900 hover:bg-stone-800 text-white shadow-sm"
        >
          <Check className="w-4 h-4" />
          Save profile &amp; continue
        </button>
      </div>
    </div>
  );
}
