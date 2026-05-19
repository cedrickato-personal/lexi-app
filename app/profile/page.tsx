"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Trash2 } from "lucide-react";
import { Nav } from "@/components/nav";
import { ProfileForm, type ProfileDraft } from "@/components/profile-form";
import { clearProfile, getProfile, saveProfile } from "@/lib/storage";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { LearnerProfile } from "@/lib/types";

export default function ProfilePage() {
  const router = useRouter();
  const [draft, setDraft] = useState<ProfileDraft>({});
  const [hasProfile, setHasProfile] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const p = getProfile();
    if (p) {
      setDraft(p);
      setHasProfile(true);
    }
    setLoaded(true);
  }, []);

  const handleSave = () => {
    const profile: LearnerProfile = {
      gallupTop10: draft.gallupTop10?.length === 10 ? draft.gallupTop10 : undefined,
      vark: draft.vark,
      motivation: draft.motivation,
      timeCommitment: draft.timeCommitment,
      priorExperience: draft.priorExperience,
      goalLevel: draft.goalLevel,
      notes: draft.notes?.trim() || undefined,
    };
    saveProfile(profile);
    toast.success("Profile saved");
    setHasProfile(true);
  };

  const handleClear = () => {
    clearProfile();
    setDraft({});
    setHasProfile(false);
    setClearOpen(false);
    toast.success("Profile cleared");
  };

  if (!loaded) return null;

  return (
    <>
      <Nav />
      <main className="min-h-[calc(100vh-3.5rem)]">
        <div className="max-w-4xl mx-auto px-6 pt-12 pb-32">
          <p className="text-xs uppercase tracking-[0.22em] text-orange-800/80 font-medium mb-4 flex items-center gap-2">
            <span className="inline-block w-8 h-px bg-orange-700/60" />
            Your Profile
          </p>
          <div className="flex items-baseline justify-between gap-4 flex-wrap mb-3">
            <h1 className="font-display text-4xl md:text-5xl font-semibold text-stone-900 tracking-tight">
              Learner <span className="italic text-orange-800">profile</span>
            </h1>
            {hasProfile && (
              <div className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Lessons calibrated to your profile
              </div>
            )}
          </div>
          <p className="text-base text-stone-600 max-w-2xl mb-10 leading-relaxed">
            All fields optional. Edit anytime. Changes apply to every future lesson
            you generate, across every language. Existing saved lessons stay as-is.
          </p>

          <ProfileForm draft={draft} onChange={setDraft} />

          <div className="sticky bottom-0 left-0 right-0 mt-10 -mx-6 px-6 py-4 bg-[#FAF8F3]/95 backdrop-blur-md border-t border-stone-200/70 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              {hasProfile && (
                <button
                  onClick={() => setClearOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-red-600 hover:bg-red-50 px-3 h-9 rounded-md transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear profile
                </button>
              )}
              <button
                onClick={() => router.push("/")}
                className="text-sm text-stone-500 hover:text-stone-800 transition-colors"
              >
                Cancel
              </button>
            </div>
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-lg h-10 px-5 text-sm font-medium bg-stone-900 hover:bg-stone-800 text-white shadow-sm"
            >
              <Check className="w-4 h-4" />
              {hasProfile ? "Update profile" : "Save profile"}
            </button>
          </div>
        </div>
      </main>

      <Dialog open={clearOpen} onOpenChange={setClearOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear your profile?</DialogTitle>
            <DialogDescription>
              This removes the profile from local storage. Future lessons will use
              the framework&apos;s balanced default. Saved lessons are unaffected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setClearOpen(false)}
              className="px-4 h-9 rounded-md border border-stone-200 text-sm hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              onClick={handleClear}
              className="px-4 h-9 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm"
            >
              Clear
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
