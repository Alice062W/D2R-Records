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
      { key: 'item_base', path: 'items/base', icon: '🗡️' },
      { key: 'item_magic', path: 'items/magic', colorClass: 'text-[#8080f3]', icon: '🔷' },
      { key: 'item_rare', path: 'items/rare', colorClass: 'text-[#eeee75]', icon: '🌟' },
      { key: 'item_runes', path: 'items/runes', colorClass: 'text-[#ee7a03]', icon: '🪨' },
      { key: 'item_cubeRecipes', path: 'items/cube-recipes', icon: '🧊' },
      { key: 'item_crafted', path: 'items/crafted', colorClass: 'text-[#ee7a03]', icon: '🔨' },
      { key: 'misc_fcrFhrFbr', path: 'character/fcr-fhr-fbr', icon: '⚡' },
      { key: 'misc_alvl85', path: 'monster/alvl85', icon: '🗺️' },
      { key: 'misc_areaLevel', path: 'monster/area-level', icon: '📍' },
      { key: 'misc_levelUp', path: 'character/level-up', icon: '📈' },
      { key: 'misc_maxSockets', path: 'misc/max-sockets', icon: '⚙️' },
      { key: 'misc_auras', path: 'character/auras', icon: '💠' },
    ],
  },
];

// Nav-link key -> the full id list used to compute its "X%" collection
// badge in the nav drawer (only shown once signed in). Kept alongside the
// group data since it's keyed by the same link keys.
export const PERCENT_LINK_KEYS = ['item_unique', 'item_set', 'item_runewords'] as const;
