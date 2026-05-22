-- =============================================================================
-- Lexi · Migration 002 · Shared lessons, roles, and audit log
-- Run this once in your Supabase project's SQL Editor (after schema.sql).
-- Safe to re-run — everything is idempotent.
-- =============================================================================

-- 1. Roles --------------------------------------------------------------------
-- Every profile gets a role; default 'user'. Admins can manage shared lessons.
alter table public.profiles add column if not exists role text not null default 'user';

-- Helper: is the current user an admin?
-- SECURITY DEFINER so it can read profiles regardless of the caller's RLS,
-- avoiding recursive policy evaluation.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

-- 2. Shared lessons -----------------------------------------------------------
-- Global, admin-authored lesson content. One row per (language, week).
-- Everyone can READ; only admins can WRITE.
create table if not exists public.shared_lessons (
  lang_code   text not null,
  week_number int  not null,
  content     text not null,
  created_by  uuid references auth.users(id),
  updated_by  uuid references auth.users(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (lang_code, week_number)
);

alter table public.shared_lessons enable row level security;

drop policy if exists "Anyone can read shared lessons" on public.shared_lessons;
create policy "Anyone can read shared lessons"
  on public.shared_lessons for select
  using (true);

drop policy if exists "Admins can insert shared lessons" on public.shared_lessons;
create policy "Admins can insert shared lessons"
  on public.shared_lessons for insert
  with check (public.is_admin());

drop policy if exists "Admins can update shared lessons" on public.shared_lessons;
create policy "Admins can update shared lessons"
  on public.shared_lessons for update
  using (public.is_admin());

drop policy if exists "Admins can delete shared lessons" on public.shared_lessons;
create policy "Admins can delete shared lessons"
  on public.shared_lessons for delete
  using (public.is_admin());

-- 3. Audit log ----------------------------------------------------------------
-- Records every admin action on shared lessons. Admins can read; any
-- authenticated user can insert their own action rows.
create table if not exists public.audit_log (
  id          bigint generated always as identity primary key,
  user_id     uuid references auth.users(id),
  user_email  text,
  action      text not null,        -- 'lesson.create' | 'lesson.update' | 'lesson.delete'
  lang_code   text,
  week_number int,
  detail      text,
  created_at  timestamptz not null default now()
);

create index if not exists audit_log_created_idx on public.audit_log(created_at desc);

alter table public.audit_log enable row level security;

drop policy if exists "Admins can read audit log" on public.audit_log;
create policy "Admins can read audit log"
  on public.audit_log for select
  using (public.is_admin());

drop policy if exists "Authenticated can insert audit rows" on public.audit_log;
create policy "Authenticated can insert audit rows"
  on public.audit_log for insert
  with check (auth.uid() = user_id);

-- 4. Seed admins --------------------------------------------------------------
-- Mark the founder account as admin. We join to auth.users (the source of
-- truth for email) rather than relying on profiles.email being populated,
-- which the signup trigger doesn't always set for OAuth users.
update public.profiles p
  set role = 'admin'
  from auth.users u
  where p.user_id = u.id
    and u.email = 'cedric.g.kato@gmail.com';

-- Add Marcel the same way once his account exists (see ADMIN_GUIDE.md):
-- update public.profiles p set role = 'admin'
--   from auth.users u where p.user_id = u.id and u.email = 'marcel@heylexi.app';

-- If this matches 0 rows, the account hasn't signed in yet (no profile row).
-- Sign in once, then re-run this UPDATE.
