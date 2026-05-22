-- ============================================================================
-- LEXI — RUN THIS ONCE in Supabase → SQL Editor → New query → paste all → Run
-- ----------------------------------------------------------------------------
-- It is safe to run multiple times. It does four things:
--   1. Adds the admin role system + shared lessons + audit log
--   2. Makes cedric.g.kato@gmail.com an admin
--   3. Recovers lessons you saved under the old per-user model
-- After running: hard-refresh the site (Cmd/Ctrl+Shift+R).
-- ============================================================================

-- 1 ── Role column + is_admin() helper ───────────────────────────────────────
alter table public.profiles add column if not exists role text not null default 'user';

create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.profiles where user_id = auth.uid() and role = 'admin');
$$;

-- 2 ── Shared lessons (global, admin-authored) ───────────────────────────────
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
create policy "Anyone can read shared lessons" on public.shared_lessons for select using (true);
drop policy if exists "Admins can insert shared lessons" on public.shared_lessons;
create policy "Admins can insert shared lessons" on public.shared_lessons for insert with check (public.is_admin());
drop policy if exists "Admins can update shared lessons" on public.shared_lessons;
create policy "Admins can update shared lessons" on public.shared_lessons for update using (public.is_admin());
drop policy if exists "Admins can delete shared lessons" on public.shared_lessons;
create policy "Admins can delete shared lessons" on public.shared_lessons for delete using (public.is_admin());

-- 3 ── Audit log ─────────────────────────────────────────────────────────────
create table if not exists public.audit_log (
  id          bigint generated always as identity primary key,
  user_id     uuid references auth.users(id),
  user_email  text,
  action      text not null,
  lang_code   text,
  week_number int,
  detail      text,
  created_at  timestamptz not null default now()
);
create index if not exists audit_log_created_idx on public.audit_log(created_at desc);
alter table public.audit_log enable row level security;

drop policy if exists "Admins can read audit log" on public.audit_log;
create policy "Admins can read audit log" on public.audit_log for select using (public.is_admin());
drop policy if exists "Authenticated can insert audit rows" on public.audit_log;
create policy "Authenticated can insert audit rows" on public.audit_log for insert with check (auth.uid() = user_id);

-- 4 ── Make the founder an admin (robust: joins auth.users) ──────────────────
update public.profiles p
  set role = 'admin'
  from auth.users u
  where p.user_id = u.id and u.email = 'cedric.g.kato@gmail.com';

-- 5 ── Recover old per-user lessons into the shared table ────────────────────
insert into public.shared_lessons (lang_code, week_number, content, created_by, updated_by, created_at, updated_at)
select l.lang_code, l.week_number, l.content, l.user_id, l.user_id, l.saved_at, coalesce(l.updated_at, l.saved_at)
from public.lessons l
join auth.users u on u.id = l.user_id
where u.email = 'cedric.g.kato@gmail.com'
on conflict (lang_code, week_number) do nothing;

-- 6 ── Show the result ───────────────────────────────────────────────────────
select 'Your role:' as label, p.role as value
from public.profiles p join auth.users u on u.id = p.user_id
where u.email = 'cedric.g.kato@gmail.com'
union all
select 'Shared lessons recovered:', count(*)::text from public.shared_lessons;
