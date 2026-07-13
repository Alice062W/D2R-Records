-- supabase/migrations/0001_finds.sql
-- Run this in the Supabase Dashboard SQL Editor (Project -> SQL Editor -> New query).
create table if not exists public.finds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  item_code text not null,
  item_kind text not null check (item_kind in ('unique', 'set')),
  stat_values jsonb not null default '{}'::jsonb,
  ethereal boolean not null default false,
  found_act text,
  found_area text,
  found_at date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.finds enable row level security;

create policy "select_own_finds" on public.finds
  for select using (auth.uid() = user_id);

create policy "insert_own_finds" on public.finds
  for insert with check (auth.uid() = user_id);

create policy "update_own_finds" on public.finds
  for update using (auth.uid() = user_id);

create policy "delete_own_finds" on public.finds
  for delete using (auth.uid() = user_id);
