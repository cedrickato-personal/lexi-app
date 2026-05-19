# Supabase setup

Lexi uses Supabase for authentication (email/password + Google OAuth) and for
cloud sync of lessons, notes, and learner profile. The app works fine without
Supabase configured — it falls back to guest/localStorage-only mode — but the
sign-in screen is disabled in that state.

This guide takes about 10 minutes.

---

## 1. Create the Supabase project

1. Go to **https://supabase.com** → **New project**
2. Pick a name (`lexi`) and a strong database password
3. Pick the region closest to you
4. Wait ~1 minute for provisioning

---

## 2. Run the database schema

1. In your new project, go to **SQL Editor** in the left sidebar
2. Click **New query**
3. Open `supabase/schema.sql` from this repo, copy its full contents, paste into
   the editor
4. Click **Run**

This creates four tables (`profiles`, `lessons`, `notes`, `language_metadata`),
sets up Row Level Security so each user can only access their own data, and
installs a trigger that auto-creates a profile row when a new user signs up.

---

## 3. Get your environment variables

1. In Supabase, go to **Project Settings** → **API** (or **Configuration → Data API**)
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Local development

Copy `.env.local.example` to `.env.local` and fill in the values:

```
NEXT_PUBLIC_SUPABASE_URL=https://abcxyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

Then restart `npm run dev`.

### Production (Vercel)

```
vercel env add NEXT_PUBLIC_SUPABASE_URL          # paste value, choose all environments
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY     # same
vercel --prod                                     # redeploy
```

Or via the Vercel dashboard: **Settings → Environment Variables**.

---

## 4. Enable Google OAuth (optional but recommended)

If you want the "Continue with Google" button to work:

### A. Create OAuth credentials in Google Cloud Console

1. Go to **https://console.cloud.google.com**
2. Pick or create a project
3. Navigate to **APIs & Services → OAuth consent screen**
4. Configure consent (External, app name "Lexi", your email as developer contact, no scopes needed beyond defaults)
5. Navigate to **APIs & Services → Credentials → Create credentials → OAuth client ID**
6. Application type: **Web application**
7. Name: `Lexi`
8. **Authorized redirect URIs**: paste this exact value (replace YOUR-PROJECT-REF):
   ```
   https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback
   ```
9. Click **Create**, copy the **Client ID** and **Client secret**

### B. Add credentials to Supabase

1. In Supabase, go to **Authentication → Providers**
2. Find **Google**, toggle it on
3. Paste **Client ID** and **Client Secret**
4. Save

### C. Make sure your app domain is in Supabase redirect allowlist

1. In Supabase, go to **Authentication → URL Configuration**
2. **Site URL**: your production URL (e.g., `https://lexi-app-tau.vercel.app`)
3. **Redirect URLs** (allow list): add both:
   - `http://localhost:3000/**`
   - `https://lexi-app-tau.vercel.app/**` (or your domain)

---

## 5. Enable email/password (default)

Email/password auth is on by default. To require email confirmation:

1. Supabase → **Authentication → Sign in / Providers**
2. Under **Email**, toggle **Confirm email** on/off as you prefer

For low friction during development, you can leave email confirmation off — but
**turn it on for production** to prevent fake signups.

---

## 6. Verify

1. Restart your dev server (`npm run dev`)
2. Visit `http://localhost:3000`
3. You should be redirected to `/auth`
4. Try **Continue with Google** → should sign in and redirect to `/onboarding`
5. Complete or skip onboarding → home page
6. Check your Supabase **Table Editor → profiles** — your row should be there

---

## What gets synced

When a user is signed in:

- **Profile** (Gallup top 10, VARK, motivations, time commitment, prior experience, goal level, notes) writes to the `profiles` table
- **Lessons** (the markdown content saved per language+week) writes to the `lessons` table
- **Notes** writes to the `notes` table
- **Onboarding state + last-used language** lives on the `profiles` row

On sign-in, the app fetches cloud data and merges into localStorage. Local-only
items (created before sign-in, e.g., during a guest session) are pushed up to
the cloud during this same sync.

All tables use Row Level Security; users can only see and modify their own
rows. The `anon` key is safe to ship in the browser.
