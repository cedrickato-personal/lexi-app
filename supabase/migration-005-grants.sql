-- =============================================================================
-- Lexi · Migration 005 · Table grants for API roles
-- Run once in Supabase → SQL Editor. Safe to re-run.
--
-- Fixes: "permission denied for table shared_lessons" (Postgres 42501).
-- Cause: tables created via the SQL editor didn't inherit grants for the
-- anon/authenticated API roles. RLS policies govern WHICH rows each user can
-- touch; these GRANTs allow the roles to attempt operations at all.
-- =============================================================================

grant usage on schema public to anon, authenticated;

-- Shared lessons: everyone reads; only authenticated can write (RLS = admin-only).
grant select on public.shared_lessons to anon, authenticated;
grant insert, update, delete on public.shared_lessons to authenticated;

-- Audit log: authenticated can insert their own rows + admins read (RLS).
grant select, insert on public.audit_log to authenticated;

-- Existing per-user tables (harmless to re-grant).
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.lessons to authenticated;
grant select, insert, update, delete on public.notes to authenticated;
grant select, insert, update, delete on public.language_metadata to authenticated;

-- Sequences (identity columns on audit_log / feedback).
grant usage, select on all sequences in schema public to anon, authenticated;

-- Default privileges so FUTURE tables auto-grant (prevents this recurring).
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant select on tables to anon;
alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated;

-- If you've created the feedback table (migration-004), grant it too:
--   grant select, insert, update on public.feedback to anon, authenticated;
