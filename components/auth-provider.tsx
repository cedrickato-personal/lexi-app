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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const configured = isSupabaseConfigured();

  // Determine the signed-in user's role. We prefer the is_admin() database
  // function (SECURITY DEFINER — bypasses profiles RLS, so it's authoritative
  // even if the profiles SELECT policy is misconfigured). Fall back to reading
  // profiles.role directly.
  const fetchRole = useCallback(
    async (userId: string) => {
      if (!configured) return;
      try {
        const supabase = createClient();
        const { data: adminFlag, error: rpcError } = await supabase.rpc("is_admin");
        if (!rpcError && typeof adminFlag === "boolean") {
          console.log("[auth] is_admin() →", adminFlag);
          setRole(adminFlag ? "admin" : "user");
          return;
        }
        // Fallback: direct read
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", userId)
          .maybeSingle();
        console.log(
          "[auth] role fallback → profiles.role =",
          data?.role,
          rpcError ? `(rpc err: ${rpcError.message})` : "",
          error ? `(select err: ${error.message})` : "",
        );
        setRole((data?.role as string | undefined) ?? "user");
      } catch (err) {
        console.warn("[auth] fetchRole threw:", err);
        setRole("user");
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

    // Phase 1: fast initial paint from cached session (no network call).
    // getSession reads from local storage / cookies and resolves instantly,
    // so the nav and gate aren't stuck on a spinner waiting for the network.
    supabase.auth
      .getSession()
      .then(({ data }) => {
        const u = data.session?.user ?? null;
        setUser(u);
        if (u) fetchRole(u.id);
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
      if (nextUser) fetchRole(nextUser.id);
      else setRole(null);
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
