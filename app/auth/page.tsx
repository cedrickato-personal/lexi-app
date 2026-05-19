"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Mail, Lock, User, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth-provider";
import { toast } from "sonner";

type Mode = "sign-in" | "sign-up";

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setGuestMode, configured } = useAuth();
  const next = searchParams.get("next") ?? "/onboarding";

  const [mode, setMode] = useState<Mode>("sign-up");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configured) {
      toast.error("Supabase isn't configured yet. Use 'Continue as guest' for now.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    try {
      if (mode === "sign-up") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account, then sign in.");
        setMode("sign-in");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in");
        router.push(next);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!configured) {
      toast.error("Supabase isn't configured yet. Use 'Continue as guest' for now.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
    }
    // Browser navigates away — no further handling needed on success.
  };

  const handleGuest = () => {
    setGuestMode();
    toast.success("Continuing as guest — data stays on this device.");
    router.push(next);
  };

  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 grid lg:grid-cols-2">
        {/* ── Editorial side ── */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-orange-50/40 via-[#FAF8F3] to-orange-100/30 relative overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-orange-200/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl pointer-events-none" />
          <Link href="/" className="font-display text-3xl font-semibold text-stone-900 tracking-tight relative">
            Lexi
            <span className="ml-2 text-[10px] uppercase tracking-[0.18em] text-stone-400 font-medium">Curriculum</span>
          </Link>
          <div className="relative max-w-md">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-orange-800/80 mb-5 flex items-center gap-2">
              <span className="inline-block w-8 h-px bg-orange-700/60" />
              31 languages · A1 → C2
            </p>
            <h2 className="font-display text-5xl xl:text-6xl font-semibold text-stone-900 tracking-tight leading-[0.98] mb-6">
              A curriculum
              <br />
              <span className="italic text-orange-800">calibrated</span> to you.
            </h2>
            <p className="text-base text-stone-600 leading-relaxed">
              Sign in to sync your progress across devices, or continue as guest and keep
              everything on this device.
            </p>
          </div>
          <p className="text-xs text-stone-400 relative">
            Your data is yours. Local-first when you&apos;re a guest, encrypted in transit when you sign in.
          </p>
        </div>

        {/* ── Form side ── */}
        <div className="flex flex-col justify-center px-6 py-12 md:px-12 lg:px-16">
          <div className="w-full max-w-md mx-auto">
            <Link href="/" className="lg:hidden font-display text-2xl font-semibold text-stone-900 mb-12 inline-block">
              Lexi
            </Link>

            <h1 className="font-display text-4xl font-semibold text-stone-900 tracking-tight mb-2">
              {mode === "sign-up" ? "Create your account" : "Welcome back"}
            </h1>
            <p className="text-base text-stone-600 mb-8">
              {mode === "sign-up"
                ? "Save your progress. Sync across devices."
                : "Sign in to pick up where you left off."}
            </p>

            {!configured && (
              <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200 flex gap-3 text-sm text-amber-900">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <strong>Supabase isn&apos;t configured yet.</strong> Sign-in is disabled until
                  env vars are set. You can still continue as guest below.
                </div>
              </div>
            )}

            {/* Google OAuth */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading || !configured}
              className="w-full inline-flex items-center justify-center gap-3 h-11 px-5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-sm font-medium text-stone-800 transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed mb-3"
            >
              <GoogleIcon className="w-4 h-4" />
              Continue with Google
            </button>

            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-stone-200" />
              <span className="text-xs uppercase tracking-wider text-stone-400">or with email</span>
              <div className="flex-1 h-px bg-stone-200" />
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-3">
              {mode === "sign-up" && (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <Input
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="pl-10 h-11 border-stone-200 focus-visible:border-orange-300 focus-visible:ring-orange-200/40"
                  />
                </div>
              )}
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 h-11 border-stone-200 focus-visible:border-orange-300 focus-visible:ring-orange-200/40"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <Input
                  type="password"
                  placeholder="Password (8+ characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="pl-10 h-11 border-stone-200 focus-visible:border-orange-300 focus-visible:ring-orange-200/40"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !configured}
                className="w-full inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {mode === "sign-up" ? "Create account" : "Sign in"}
                    <ArrowRight className="w-4 h-4 opacity-60" />
                  </>
                )}
              </button>
            </form>

            <p className="text-sm text-stone-500 mt-6 text-center">
              {mode === "sign-up" ? "Already have an account?" : "New to Lexi?"}{" "}
              <button
                onClick={() => setMode(mode === "sign-up" ? "sign-in" : "sign-up")}
                className="text-orange-800 hover:underline font-medium"
              >
                {mode === "sign-up" ? "Sign in" : "Create account"}
              </button>
            </p>

            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-px bg-stone-200" />
            </div>

            <button
              onClick={handleGuest}
              className="w-full inline-flex items-center justify-center gap-2 h-10 px-5 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
            >
              Continue as guest
              <span className="text-xs text-stone-400">— data stays on this device</span>
            </button>
            <p className="text-[11px] text-stone-400 text-center mt-3">
              Guest mode keeps everything local. Sign in later to migrate your data to the cloud.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0012 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.99 10.99 0 001 12c0 1.77.42 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
