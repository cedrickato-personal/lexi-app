-- =============================================================================
-- Lexi · Migration 003 · Recover pre-shared-model lessons
-- One-time recovery: copies lessons saved under the OLD per-user model
-- (public.lessons, keyed by user_id) into the NEW shared model
-- (public.shared_lessons, global). Safe to re-run — conflicts are skipped.
--
-- Only recovers lessons authored by admins (the people who created content
-- under the old model). Run AFTER migration-002 and after the founder is admin.
-- =============================================================================

-- Optional diagnostic — see what's recoverable for a given account:
--   select l.lang_code, l.week_number, length(l.content) as chars
--   from public.lessons l
--   join auth.users u on u.id = l.user_id
--   where u.email = 'cedric.g.kato@gmail.com'
--   order by l.lang_code, l.week_number;

insert into public.shared_lessons (lang_code, week_number, content, created_by, updated_by, created_at, updated_at)
select
  l.lang_code,
  l.week_number,
  l.content,
  l.user_id,
  l.user_id,
  l.saved_at,
  coalesce(l.updated_at, l.saved_at)
from public.lessons l
join public.profiles p on p.user_id = l.user_id
where p.role = 'admin'
on conflict (lang_code, week_number) do nothing;

-- If the founder isn't admin yet, scope by email instead:
--   ... from public.lessons l
--   join auth.users u on u.id = l.user_id
--   where u.email = 'cedric.g.kato@gmail.com'
--   on conflict (lang_code, week_number) do nothing;
