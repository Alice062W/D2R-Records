-- supabase/migrations/0003_profiles.sql
-- Applied manually via the Supabase Dashboard SQL editor (this project has
-- no migration runner — the dashboard is the actual source of truth, same
-- as 0001_finds.sql / 0002_owned_items.sql). Checked in for documentation.

create table public.profiles (
  user_id uuid primary key default auth.uid(),
  battletag text,
  avatar_choice text,
  updated_at timestamptz not null default now()
);

-- Table-level privileges: required because this project disables automatic
-- Data API exposure of new tables ("Automatically expose new tables" off) —
-- same reason 0001_finds.sql / 0002_owned_items.sql grant these. Without
-- this, every insert/select/update fails with a permission error before
-- RLS is ever evaluated, even though the policies below are otherwise
-- correct.
grant select, insert, update on table public.profiles to authenticated;

alter table public.profiles enable row level security;

create policy "select own profile" on public.profiles
  for select using (auth.uid() = user_id);

create policy "insert own profile" on public.profiles
  for insert with check (auth.uid() = user_id);

create policy "update own profile" on public.profiles
  for update using (auth.uid() = user_id);
