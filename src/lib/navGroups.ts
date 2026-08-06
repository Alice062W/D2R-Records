import runewordsFull from '../../data/runewords.json';
import { getAllItemIdsForKind } from '@/lib/grail/catalog';

// Single source of truth for the site's nav-drawer groups and the
// homepage's card grid — both render the exact same group/link structure,
// so it's defined once here rather than duplicated in two components.
//
// `key` is always a key under the `Nav` i18n namespace. `colorClass` is the
// authentic D2/d2r.world rarity-tint color for that link (verified against
// d2r.world's own computed styles), omitted where d2r.world itself uses the
// default white/neutral text.
export interface NavLinkDef {
  key: string;
  path: string;
  colorClass?: string;
  icon: string;
  // Path under public/ (no leading slash, BASE_PATH prepended at render time)
  // to a real high-quality game-asset image, used instead of the emoji
  // `icon` when present.
  image?: string;
}

export interface NavGroupDef {
  key: string;
  links: NavLinkDef[];
}

export const NAV_GROUPS: NavGroupDef[] = [
  {
    key: 'group_myChronicle',
    links: [
      { key: 'item_unique', path: 'items/unique', colorClass: 'text-[#cbb87f]', icon: '👑' },
      { key: 'item_set', path: 'items/set', colorClass: 'text-[#22ff55]', icon: '💎' },
      { key: 'item_runewords', path: 'items/runewords', colorClass: 'text-[#cbb87f]', icon: '📜' },
    ],
  },
  {
    key: 'group_myBuilds',
    links: [
      { key: 'my_builds', path: 'builds', icon: '🛠️' },
    ],
  },
  {
    key: 'group_academy',
    links: [
      { key: 'item_base', path: 'items/base', icon: '🗡️', image: 'items/hd/hand_axe.png' },
      { key: 'item_magic', path: 'items/magic', colorClass: 'text-[#8080f3]', icon: '🔷', image: 'items/hd/light_gauntlets.png' },
      { key: 'item_rare', path: 'items/rare', colorClass: 'text-[#eeee75]', icon: '🌟', image: 'items/hd/perfect_diamond3.png' },
      { key: 'item_runes', path: 'items/runes', colorClass: 'text-[#ee7a03]', icon: '🪨', image: 'items/hd/lo_rune.png' },
      { key: 'item_cubeRecipes', path: 'items/cube-recipes', icon: '🧊', image: 'items/hd/horadric_cube.png' },
      { key: 'item_crafted', path: 'items/crafted', colorClass: 'text-[#ee7a03]', icon: '🔨', image: 'items/hd/amulet.png' },
      { key: 'item_quests', path: 'quests', icon: '📜', image: 'items/hd/super_khalim_flail.png' },
      { key: 'misc_fcrFhrFbr', path: 'character/fcr-fhr-fbr', icon: '⚡', image: 'items/hd/bark_scroll.png' },
      { key: 'misc_auras', path: 'character/auras', icon: '💠', image: 'skills/icons/prayer.png' },
    ],
  },
];

// Nav-link key -> the full id list used to compute its "X%" collection
// badge — shown in the nav drawer and on the homepage cards, only once
// signed in. Kept alongside the group data since it's keyed by the same
// link keys, and shared here so both call sites can't drift apart.
export const PERCENT_LINK_KEYS = ['item_unique', 'item_set', 'item_runewords'] as const;

export const PERCENT_ID_LISTS: Partial<Record<(typeof PERCENT_LINK_KEYS)[number], string[]>> = {
  item_unique: getAllItemIdsForKind('unique'),
  item_set: getAllItemIdsForKind('set'),
  item_runewords: runewordsFull.map(rw => rw.id),
};

export function completionPercent(ids: string[], ownedIds: Set<string>): number {
  if (ids.length === 0) return 0;
  return Math.round((ids.filter(id => ownedIds.has(id)).length / ids.length) * 100);
}

// Same three-way completeness bucketing CategoryCardGrid already uses for
// the Unique/Set category tiles (complete/partial/none), reused here so the
// homepage's My Chronicle cards get the identical color treatment instead
// of a separate, drifting copy of the same logic.
export type CompletionState = 'complete' | 'partial' | 'none';

export function collectionState(ids: string[], ownedIds: Set<string>): { owned: number; total: number; state: CompletionState } {
  const total = ids.length;
  const owned = ids.filter(id => ownedIds.has(id)).length;
  const state: CompletionState = total === 0 || owned === 0 ? 'none' : owned === total ? 'complete' : 'partial';
  return { owned, total, state };
}
