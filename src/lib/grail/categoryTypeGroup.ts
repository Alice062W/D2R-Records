// src/lib/grail/categoryTypeGroup.ts
//
// Classifies a Magic/Rare affix category slug (see generate-grail-data.mjs's
// MAGIC_LEAF_SLUGS) into a coarse "weapons"/"armor"/"other" UI group, purely
// for grouping the category-card grid on the Magic/Rare items pages so users
// can scan by broad item type instead of one long undifferentiated list.

export type CategoryTypeGroup = 'weapons' | 'armor' | 'other';

// Covers both the granular Magic/Rare slug set (generate-grail-data.mjs's
// MAGIC_LEAF_SLUGS, e.g. "assassinKatars"/"throwingAxes") and the coarser
// Unique/Set/Base slug set (catalog.ts's SLOT_ORDER / basesCatalog.ts's
// BASE_CATEGORY_ORDER, e.g. "katars"/"throwings") -- both naming schemes
// are used across this project's category pages, and this classifier is
// shared by all of them.
const WEAPON_CATEGORIES = new Set([
  'axes', 'amazonBows', 'amazonJavelins', 'amazonSpears', 'assassinKatars', 'katars',
  'bows', 'clubs', 'crossbows', 'daggers', 'hammers', 'javelins', 'maces',
  'orbs', 'polearms', 'scepters', 'spears', 'staves', 'swords',
  'throwingAxes', 'throwingKnives', 'throwings', 'wands',
]);

// "grimoires" (術士魔典) is a shield-type off-hand item (itemtypes.json:
// grim's Equiv1 is "shld", "Any Shield") -- an armor-slot defensive item,
// not a weapon, despite occupying the same hand slot as an orb/wand.
const ARMOR_CATEGORIES = new Set([
  'armors', 'barbarianHelms', 'belts', 'boots', 'circlets', 'druidHelms',
  'gloves', 'grimoires', 'helms', 'paladinShields', 'shields', 'shrunkenHeads',
]);

export function categoryTypeGroup(category: string): CategoryTypeGroup {
  if (WEAPON_CATEGORIES.has(category)) return 'weapons';
  if (ARMOR_CATEGORIES.has(category)) return 'armor';
  return 'other';
}
