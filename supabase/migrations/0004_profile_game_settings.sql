-- supabase/migrations/0004_profile_game_settings.sql
-- Applied manually via the Supabase Dashboard SQL editor (this project has
-- no migration runner — the dashboard is the actual source of truth, same
-- as the earlier migrations). Checked in for documentation.

alter table public.profiles
  add column server text check (server in ('us', 'europe', 'asia', 'china')),
  add column game_mode text check (game_mode in ('hardcore', 'softcore')),
  add column platform text check (platform in ('pc', 'ps', 'xbox', 'ns')),
  add column seasonal boolean;
