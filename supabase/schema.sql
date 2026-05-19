-- =============================================================================
-- Lexi database schema
-- Run this once in your Supabase project's SQL Editor.
-- =============================================================================

-- 1. Profiles -----------------------------------------------------------------
create table if not exists public.profiles (
  user_id            uuid primary key references auth.users(id) on delete cascade,
  display_name       text,
  email              text,
  avatar_url         text,
  gallup_top10       text[],
  vark               text,
  motivations        text[],
  motivation_other   text,
  time_commitment    text,
  prior_experience   text,
  goal_level         text,
  notes              text,
  onboarding_state   text,                              -- 'completed' | 'skipped' | null
  last_used_language text,
  updated_at         timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = user_id);

create policy "Users can delete own profile"
  on public.profiles for delete
  using (auth.uid() = user_id);

-- 2. Lessons ------------------------------------------------------------------
create table if not exists public.lessons (
  user_id     uuid not null references auth.users(id) on delete cascade,
  lang_code   text not null,
  week_number int  not null,
  content     text not null,
  saved_at    timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (user_id, lang_code, week_number)
);

create index if not exists lessons_user_lang_idx on public.lessons(user_id, lang_code);

alter table public.lessons enable row level security;

create policy "Users can read own lessons"
  on public.lessons for select using (auth.uid() = user_id);
create policy "Users can insert own lessons"
  on public.lessons for insert with check (auth.uid() = user_id);
create policy "Users can update own lessons"
  on public.lessons for update using (auth.uid() = user_id);
create policy "Users can delete own lessons"
  on public.lessons for delete using (auth.uid() = user_id);

-- 3. Notes --------------------------------------------------------------------
create table if not exists public.notes (
  user_id     uuid not null references auth.users(id) on delete cascade,
  lang_code   text not null,
  week_number int  not null,
  content     text not null default '',
  updated_at  timestamptz not null default now(),
  primary key (user_id, lang_code, week_number)
);

create index if not exists notes_user_lang_idx on public.notes(user_id, lang_code);

alter table public.notes enable row level security;

create policy "Users can read own notes"
  on public.notes for select using (auth.uid() = user_id);
create policy "Users can insert own notes"
  on public.notes for insert with check (auth.uid() = user_id);
create policy "Users can update own notes"
  on public.notes for update using (auth.uid() = user_id);
create policy "Users can delete own notes"
  on public.notes for delete using (auth.uid() = user_id);

-- 4. Language metadata --------------------------------------------------------
create table if not exists public.language_metadata (
  user_id          uuid not null references auth.users(id) on delete cascade,
  lang_code        text not null,
  started_at       timestamptz not null default now(),
  last_accessed_at timestamptz not null default now(),
  primary key (user_id, lang_code)
);

alter table public.language_metadata enable row level security;

create policy "Users can read own language meta"
  on public.language_metadata for select using (auth.uid() = user_id);
create policy "Users can insert own language meta"
  on public.language_metadata for insert with check (auth.uid() = user_id);
create policy "Users can update own language meta"
  on public.language_metadata for update using (auth.uid() = user_id);
create policy "Users can delete own language meta"
  on public.language_metadata for delete using (auth.uid() = user_id);

-- 5. Auto-create profile row when a new user signs up ------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
