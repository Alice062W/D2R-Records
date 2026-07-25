-- supabase/migrations/0003_owned_items_add_rune_kind.sql
-- Applied manually via the Supabase Dashboard SQL editor (this project has
-- no migration runner — the dashboard is the actual source of truth, same
-- as 0001_finds.sql / 0002_owned_items.sql). Checked in for documentation.
--
-- Adds "rune" to owned_items.kind's allowed values so runes can be tracked
-- as a collection like unique/set/runeword items already are.

alter table public.owned_items drop constraint owned_items_kind_check;

alter table public.owned_items add constraint owned_items_kind_check
  check (kind in ('unique', 'set', 'runeword', 'rune'));
