// app/auth/callback/route.ts
// OAuth callback handler. Exchanges the code for a session, sets cookies on
// the redirect response, and surfaces any errors back to /auth.

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/onboarding";

  // The OAuth provider may report an error directly in the redirect
  // (e.g., user denied access, mismatched redirect_uri).
  const providerError = searchParams.get("error");
  const providerErrorDesc = searchParams.get("error_description");
  if (providerError) {
    const url = new URL(`${origin}/auth`);
    url.searchParams.set("error", providerError);
    if (providerErrorDesc) url.searchParams.set("message", providerErrorDesc);
    return NextResponse.redirect(url);
  }

  if (!code) {
    const url = new URL(`${origin}/auth`);
    url.searchParams.set("error", "missing_code");
    return NextResponse.redirect(url);
  }

  // Per @supabase/ssr docs: create the redirect response first, then write
  // cookies onto it from the Supabase client. This guarantees session
  // cookies land in the same response that does the redirect.
  const response = NextResponse.redirect(`${origin}${next}`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("[auth/callback] exchangeCodeForSession failed:", error);
    const url = new URL(`${origin}/auth`);
    url.searchParams.set("error", "exchange_failed");
    url.searchParams.set("message", error.message);
    return NextResponse.redirect(url);
  }

  return response;
}
