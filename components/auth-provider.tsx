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

    // Initial load — always release the loading state, even on error,
    // so the UI never gets stuck on the splash screen.
    supabase.auth
      .getUser()
      .then(({ data, error }) => {
        if (error) console.warn("[auth] getUser error:", error.message);
        setUser(data.user ?? null);
      })
      .catch((err) => {
        console.error("[auth] getUser threw:", err);
      })
      .finally(() => {
        setLoading(false);
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
