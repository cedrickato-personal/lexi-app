"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { MessageSquarePlus, Bug, Lightbulb, PencilLine, MessageCircle, X, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth-provider";
import { toast } from "sonner";

type Kind = "bug" | "suggestion" | "correction" | "other";

const KINDS: { value: Kind; label: string; icon: React.ElementType }[] = [
  { value: "bug", label: "Bug", icon: Bug },
  { value: "suggestion", label: "Suggestion", icon: Lightbulb },
  { value: "correction", label: "Correction", icon: PencilLine },
  { value: "other", label: "Other", icon: MessageCircle },
];

export function FeedbackWidget() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind>("bug");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Don't show the tab on the auth screen — it's pre-app.
  if (pathname.startsWith("/auth")) return null;

  const submit = async () => {
    if (message.trim().length < 5) {
      toast.error("Add a little more detail so we can act on it.");
      return;
    }
    setSubmitting(true);
    try {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        const { error } = await supabase.from("feedback").insert({
          user_id: user?.id ?? null,
          user_email: user?.email ?? null,
          kind,
          message: message.trim(),
          page_url: typeof window !== "undefined" ? window.location.href : pathname,
        });
        if (error) throw error;
      }
      toast.success("Thanks! Your feedback was sent.");
      setMessage("");
      setKind("bug");
      setOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Couldn't send feedback";
      toast.error(
        /does not exist|schema cache/i.test(msg)
          ? "Feedback isn't set up yet — run migration-004 in Supabase."
          : msg,
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Right-edge vertical tab — icon upright on top, label reads downward */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Send feedback"
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-2 bg-stone-900 hover:bg-orange-800 text-white px-2 py-4 rounded-l-lg shadow-lg transition-colors group"
      >
        <MessageSquarePlus className="w-4 h-4" />
        <span
          className="text-xs font-medium tracking-wide"
          style={{ writingMode: "vertical-rl" }}
        >
          Feedback
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Share feedback</DialogTitle>
            <DialogDescription>
              Bugs, suggestions, corrections — anything. It goes straight to the team.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Kind selector */}
            <div className="grid grid-cols-4 gap-2">
              {KINDS.map(({ value, label, icon: Icon }) => {
                const active = kind === value;
                return (
                  <button
                    key={value}
                    onClick={() => setKind(value)}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-lg border text-xs font-medium transition-all ${
                      active
                        ? "border-orange-400 bg-orange-50/60 text-orange-800"
                        : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                );
              })}
            </div>

            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                kind === "bug"
                  ? "What happened? What did you expect instead?"
                  : kind === "correction"
                  ? "What's incorrect, and what should it say?"
                  : "Tell us more…"
              }
              className="min-h-32 resize-y border-stone-200 focus-visible:border-orange-300 focus-visible:ring-orange-200/40"
            />

            <p className="text-[11px] text-stone-400">
              We&apos;ll include the page you&apos;re on{user?.email ? ` and your email (${user.email})` : ""}.
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="px-4 h-9 rounded-md border border-stone-200 text-sm hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-4 h-9 rounded-md bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium disabled:bg-stone-200 disabled:text-stone-400"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquarePlus className="w-4 h-4" />}
                {submitting ? "Sending…" : "Send feedback"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
