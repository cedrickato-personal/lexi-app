# Lexi — Admin Guide

This guide covers two things:
1. **For Cedric:** how to add an admin (e.g., Marcel)
2. **For Marcel:** how to process and publish lessons

---

## Part 1 — Adding an admin (Cedric / owner)

Admins are the only people who can publish, edit, or delete lessons. Everyone
else just reads them. There are two steps: **create the account**, then **mark
it admin**.

### Step 1 · Run the migration once (if you haven't already)

In Supabase → **SQL Editor** → paste and run `supabase/migration-002-shared-lessons.sql`.
This creates the shared-lesson tables, the audit log, the `role` column, and
makes `cedric.g.kato@gmail.com` an admin automatically.

### Step 2 · Create Marcel's account

**Option A — Supabase dashboard (recommended; works even if the email inbox isn't real yet):**
1. Supabase → **Authentication → Users → Add user → Create new user**
2. Email: `marcel@heylexi.app`
3. Set a temporary password (share it with Marcel privately)
4. ✅ Tick **Auto Confirm User** (so he can sign in immediately without email verification)
5. Click **Create user**

**Option B — Marcel signs up himself:**
1. Marcel goes to `https://heylexi.xyz/auth` → Create account
2. He confirms via the email link (requires `marcel@heylexi.app` to be a real inbox)

### Step 3 · Mark Marcel as admin

In Supabase → **SQL Editor**, run:

```sql
update public.profiles
  set role = 'admin'
  where email = 'marcel@heylexi.app';
```

You should see `UPDATE 1`. If you see `UPDATE 0`, his profile row doesn't exist
yet — have him sign in once (which creates it), then re-run.

### Verify

Marcel signs in → he should see an **"Admin · activity log"** item in his
account menu (top right), and **Edit / Regenerate / Delete** buttons on lessons.

To revoke admin later: `update public.profiles set role = 'user' where email = '...';`

---

## Part 2 — Marcel's workflow: publishing lessons

Your job: turn each week's prompt into a finished lesson that every learner sees.
It's a copy-paste loop. No coding.

### One-time setup
1. Sign in at **https://heylexi.xyz** with the email + password Cedric gave you.
2. You can skip the learner-profile onboarding (click **Skip for now**) — it's
   for learners, not needed for your admin work.

### For each lesson

1. **Pick the language and week.**
   - Top nav → **Pick a language** → choose (e.g., Spanish).
   - Click **The path** (curriculum) → click the week you're working on
     (e.g., Week 1). Weeks without a lesson yet show no green check.

2. **Open the Generate tab.**
   - On the week page you'll see tabs: **Lesson · Generate · Notes · Reference**.
   - Click **Generate**. (If a lesson already exists, this tab says **Regenerate**.)

3. **Step 1 — Copy the prompt.**
   - Click the **Copy** button at the top of the prompt box. It copies the full
     prompt (it's long — that's normal; it includes the pedagogy + language
     reference).

4. **Step 2 — Paste into Claude.ai.**
   - Click **Open Claude.ai** (opens a new tab).
   - Start a new chat, paste (Ctrl/Cmd+V), press Enter.
   - Wait for Claude to finish writing the full lesson (~2,500–4,000 words).

5. **Step 3 — Copy Claude's response back.**
   - In Claude.ai, copy the **entire** lesson response (from `### 1. Lesson
     Overview` to the end).
   - Return to the Lexi tab → paste into the **"Paste the response back"** box.
   - When it turns green ("ready"), click **Publish lesson**.

6. **Done.** The lesson is now live for everyone. You'll see it rendered in the
   **Lesson** tab. Use the **Next →** button in the page header to move to the
   next week.

### Tips
- **Quality check before publishing:** skim the pasted text — does it have all
  12 sections (Lesson Overview → Weekly Challenge)? If a section is missing, ask
  Claude to "continue" or regenerate, then paste the complete version.
- **Fixing a typo after publishing:** open the lesson → **Edit** → fix → save.
- **Replacing a lesson entirely:** open the lesson → **Regenerate** → it
  re-opens the prompt flow, pre-filled. Publishing overwrites the live version.
- **Everything you do is logged.** Cedric can see every publish/edit/delete in
  **Admin → Activity log**. This is normal and expected — it's just an audit trail.

### What learners see
- Published lessons appear instantly for everyone, read-only.
- Weeks you haven't done yet show a friendly "this lesson isn't ready yet" message.
- Learners can still add their own private **Notes** on any week.

That's the whole loop: **Pick week → Copy prompt → Paste into Claude → Paste
response → Publish.** Thank you, Marcel! 🙏
