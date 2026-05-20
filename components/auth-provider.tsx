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
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
  setGuestMode: () => void;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  mode: "anonymous",
  configured: false,
  refresh: async () => {},
  signOut: async () => {},
  setGuestMode: () => {},
});

const GUEST_KEY = "lexi:guest-mode";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const configured = isSupabaseConfigured();

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

    // Phase 1: fast initial paint from cached session (no network call).
    // getSession reads from local storage / cookies and resolves instantly,
    // so the nav and gate aren't stuck on a spinner waiting for the network.
    supabase.auth
      .getSession()
      .then(({ data }) => {
        setUser(data.session?.user ?? null);
      })
      .catch((err) => {
        console.error("[auth] getSession threw:", err);
      })
      .finally(() => {
        setLoading(false);
      });

    // Phase 2: validate in background. Refreshes user info if the token rotated.
    supabase.auth
      .getUser()
      .then(({ data, error }) => {
        if (error) {
          console.warn("[auth] getUser error:", error.message);
          return; // don't clobber the cached user for transient errors
        }
        setUser(data.user ?? null);
      })
      .catch((err) => {
        console.warn("[auth] getUser threw:", err);
      });

    // Subscribe to auth changes — sync localStorage <-> Supabase on sign-in
    let lastSyncedUserId: string | null = null;
    const { data: subscription } = supabase.auth.onAuthStateChange(async (event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      if (
        nextUser &&
        (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") &&
        nextUser.id !== lastSyncedUserId
      ) {
        lastSyncedUserId = nextUser.id;
        try {
          await syncOnSignIn(nextUser.id, {
            email: nextUser.email,
            full_name: (nextUser.user_metadata?.full_name as string | undefined) ?? null,
            avatar_url: (nextUser.user_metadata?.avatar_url as string | undefined) ?? null,
          });
        } catch (err) {
          console.error("Sync on sign-in failed:", err);
        }
      }
    });

    return () => subscription.subscription.unsubscribe();
  }, [configured]);

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
  }, [configured]);

  const setGuestMode = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(GUEST_KEY, "true");
    }
    setIsGuest(true);
  }, []);

  const mode: AuthMode = user ? "authenticated" : isGuest ? "guest" : "anonymous";

  return (
    <AuthContext.Provider value={{ user, loading, mode, configured, refresh, signOut, setGuestMode }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
