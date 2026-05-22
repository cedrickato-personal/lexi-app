"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { syncOnSignIn } from "@/lib/storage-sync";

type AuthMode = "authenticated" | "guest" | "anonymous";

interface AuthState {
  user: User | null;
  loading: boolean;
  mode: AuthMode;
  configured: boolean;
  role: string | null;
  isAdmin: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
  setGuestMode: () => void;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  mode: "anonymous",
  configured: false,
  role: null,
  isAdmin: false,
  refresh: async () => {},
  signOut: async () => {},
  setGuestMode: () => {},
});

const GUEST_KEY = "lexi:guest-mode";

/** Reject after `ms` so a hung Supabase call can't stall the UI forever. */
function withTimeout<T>(p: PromiseLike<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    Promise.resolve(p),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms),
    ),
  ]);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const configured = isSupabaseConfigured();

  // Determine the signed-in user's role via the is_admin() database function
  // (SECURITY DEFINER — bypasses profiles RLS, authoritative). Retries a couple
  // times because a cold Supabase project can be slow on the first call.
  const fetchRole = useCallback(
    async (userId: string) => {
      if (!configured) return;
      const supabase = createClient();
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const { data, error } = await withTimeout(
            supabase.rpc("is_admin"),
            5000,
            "is_admin",
          );
          if (error) {
            console.warn(`[auth] is_admin attempt ${attempt} error:`, error.message);
          } else if (typeof data === "boolean") {
            console.log("[auth] is_admin() →", data);
            setRole(data ? "admin" : "user");
            return;
          }
        } catch (err) {
          console.warn(`[auth] is_admin attempt ${attempt}:`, (err as Error).message);
        }
        await new Promise((r) => setTimeout(r, 800 * attempt));
      }
      // Last resort: direct profiles read (works if RLS allows it).
      try {
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", userId)
          .maybeSingle();
        console.log("[auth] role via profiles fallback →", data?.role);
        if (data?.role) setRole(data.role as string);
      } catch {
        /* leave role as-is rather than clobbering a known-admin on a fluke */
      }
    },
    [configured],
  );

  const refresh = useCallback(async () => {
    if (!configured) {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    setUser(data.user ?? null);
    setLoading(false);
  }, [configured]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsGuest(localStorage.getItem(GUEST_KEY) === "true");
    }
    if (!configured) {
      // No Supabase env vars: app runs in pure guest mode.
      setLoading(false);
      return;
    }
    const supabase = createClient();
    let roleFetchedFor: string | null = null;
    let syncedFor: string | null = null;

    const onUser = (u: User | null) => {
      setUser(u);
      if (u) {
        // Role check is on the critical path (gates the admin UI) — run now.
        if (roleFetchedFor !== u.id) {
          roleFetchedFor = u.id;
          fetchRole(u.id);
        }
        // Heavy cross-device sync is NOT critical — defer it so it doesn't
        // contend with getSession/role for the auth Web Lock.
        if (syncedFor !== u.id) {
          syncedFor = u.id;
          setTimeout(() => {
            syncOnSignIn(u.id, {
              email: u.email,
              full_name: (u.user_metadata?.full_name as string | undefined) ?? null,
              avatar_url: (u.user_metadata?.avatar_url as string | undefined) ?? null,
            }).catch((err) => console.warn("[auth] background sync failed:", err));
          }, 1500);
        }
      } else {
        setRole(null);
      }
    };

    // Fast path: read the cached session (local, no network). Releases loading.
    withTimeout(supabase.auth.getSession(), 4000, "getSession")
      .then(({ data }) => onUser(data.session?.user ?? null))
      .catch((err) => console.warn("[auth]", (err as Error).message))
      .finally(() => setLoading(false));

    // Keep state fresh on sign-in / sign-out / token refresh.
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      onUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.subscription.unsubscribe();
  }, [configured, fetchRole]);

  const signOut = useCallback(async () => {
    if (configured) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem(GUEST_KEY);
    }
    setIsGuest(false);
    setUser(null);
    setRole(null);
  }, [configured]);

  const setGuestMode = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(GUEST_KEY, "true");
    }
    setIsGuest(true);
  }, []);

  const mode: AuthMode = user ? "authenticated" : isGuest ? "guest" : "anonymous";
  const isAdmin = role === "admin";

  return (
    <AuthContext.Provider
      value={{ user, loading, mode, configured, role, isAdmin, refresh, signOut, setGuestMode }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
