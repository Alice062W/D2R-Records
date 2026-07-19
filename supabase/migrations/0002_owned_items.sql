-- supabase/migrations/0002_owned_items.sql
-- Applied manually via the Supabase Dashboard SQL editor (this project has
-- no migration runner — the dashboard is the actual source of truth, same
-- as 0001_finds.sql). Checked in for documentation.

create table public.owned_items (
  user_id uuid not null default auth.uid(),
  item_id text not null,
  kind text not null check (kind in ('unique', 'set', 'runeword')),
  created_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

alter table public.owned_items enable row level security;

create policy "select own owned_items" on public.owned_items
  for select using (auth.uid() = user_id);

create policy "insert own owned_items" on public.owned_items
  for insert with check (auth.uid() = user_id);

create policy "delete own owned_items" on public.owned_items
  for delete using (auth.uid() = user_id);
