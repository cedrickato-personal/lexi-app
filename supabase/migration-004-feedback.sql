-- =============================================================================
-- Lexi · Migration 004 · Feedback
-- Run once in Supabase → SQL Editor. Safe to re-run.
-- Stores in-app feedback (bugs, suggestions, corrections). Anyone may submit;
-- only admins can read.
-- =============================================================================

create table if not exists public.feedback (
  id          bigint generated always as identity primary key,
  user_id     uuid references auth.users(id),
  user_email  text,
  kind        text not null default 'other',   -- 'bug' | 'suggestion' | 'correction' | 'other'
  message     text not null,
  page_url    text,
  status      text not null default 'open',     -- 'open' | 'resolved'
  created_at  timestamptz not null default now()
);

create index if not exists feedback_created_idx on public.feedback(created_at desc);

alter table public.feedback enable row level security;

-- Anyone (including not-yet-signed-in visitors) can submit feedback.
drop policy if exists "Anyone can submit feedback" on public.feedback;
create policy "Anyone can submit feedback"
  on public.feedback for insert
  with check (true);

-- Only admins can read or update feedback.
drop policy if exists "Admins can read feedback" on public.feedback;
create policy "Admins can read feedback"
  on public.feedback for select
  using (public.is_admin());

drop policy if exists "Admins can update feedback" on public.feedback;
create policy "Admins can update feedback"
  on public.feedback for update
  using (public.is_admin());
