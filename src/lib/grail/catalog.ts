import uniques from '../../../data/uniques.json';
import sets from '../../../data/sets.json';

export interface LocalizedText {
  en: string;
  'zh-TW': string;
  'zh-CN': string;
}

export type Locale = 'en' | 'zh-TW' | 'zh-CN';

export interface RawGrailStat {
  key: string;
  label: LocalizedText;
  min: number;
  max: number;
  isSkillRef: boolean;
}

export interface RawGrailFixedStat {
  key: string;
  label: LocalizedText;
  value: number;
  isSkillRef: boolean;
}

export interface RawGrailItem {
  id: string;
  code: string;
  name: LocalizedText;
  kind: 'unique' | 'set';
  setName: LocalizedText | null;
  levelReq: number;
  baseName: LocalizedText;
  grade: 'normal' | 'exceptional' | 'elite';
  slotCategory: string;
  defense: { min: number; max: number } | null;
  requiredStrength: number | null;
  durability: number | null;
  invFile: string;
  stats: RawGrailStat[];
  fixedStats: RawGrailFixedStat[];
  setBonuses: RawGrailStat[];
  statPriority: string[];
}

export interface GrailStat {
  key: string;
  label: string;
  min: number;
  max: number;
  isSkillRef: boolean;
}

export interface GrailFixedStat {
  key: string;
  label: string;
  value: number;
  isSkillRef: boolean;
}

export interface GrailItem {
  id: string;
  code: string;
  name: string;
  kind: 'unique' | 'set';
  setName: string | null;
  levelReq: number;
  baseName: string;
  grade: 'normal' | 'exceptional' | 'elite';
  slotCategory: string;
  defense: { min: number; max: number } | null;
  requiredStrength: number | null;
  durability: number | null;
  invFile: string;
  stats: GrailStat[];
  fixedStats: GrailFixedStat[];
  setBonuses: GrailStat[];
  statPriority: string[];
}

const ALL_ITEMS: RawGrailItem[] = [...(uniques as RawGrailItem[]), ...(sets as RawGrailItem[])];

export function getAllGrailItems(): RawGrailItem[] {
  return ALL_ITEMS;
}

export function localizeGrailItem(item: RawGrailItem, locale: Locale): GrailItem {
  return {
    id: item.id,
    code: item.code,
    name: item.name[locale],
    kind: item.kind,
    setName: item.setName ? item.setName[locale] : null,
    levelReq: item.levelReq,
    baseName: item.baseName[locale],
    grade: item.grade,
    slotCategory: item.slotCategory,
    defense: item.defense,
    requiredStrength: item.requiredStrength,
    durability: item.durability,
    invFile: item.invFile,
    stats: item.stats.map(s => ({ key: s.key, label: s.label[locale], min: s.min, max: s.max, isSkillRef: s.isSkillRef })),
    fixedStats: item.fixedStats.map(f => ({ key: f.key, label: f.label[locale], value: f.value, isSkillRef: f.isSkillRef })),
    setBonuses: item.setBonuses.map(b => ({ key: b.key, label: b.label[locale], min: b.min, max: b.max, isSkillRef: b.isSkillRef })),
    statPriority: item.statPriority,
  };
}

// d2r.world's presentation order: armor slots, jewelry, then weapons.
export const SLOT_ORDER = [
  'helms', 'armors', 'shields', 'belts', 'boots', 'gloves',
  'rings', 'amulets', 'charms', 'jewels',
  'swords', 'daggers', 'axes', 'polearms', 'spears',
  'clubs', 'maces', 'hammers', 'scepters', 'staves',
  'orbs', 'wands', 'grimoires', 'katars',
  'bows', 'crossbows', 'javelins', 'throwings',
] as const;

const GRADE_ORDER = { normal: 0, exceptional: 1, elite: 2 } as const;

export function sortItemsForDisplay(items: GrailItem[]): GrailItem[] {
  return [...items].sort(
    (a, b) => GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade] || a.levelReq - b.levelReq
  );
}

const WEAPON_SLOTS_FOR_SET_COMBINATION = new Set([
  'swords', 'daggers', 'axes', 'polearms', 'spears',
  'clubs', 'maces', 'hammers', 'scepters', 'staves',
  'orbs', 'wands', 'katars', 'grimoires',
  'bows', 'crossbows', 'javelins', 'throwings',
]);

// d2r.world's Unique Items browser doesn't give grimoires (a Necromancer
// off-hand book item type added in a later D2R patch) their own category —
// it lists them under Shields. Matched here for the Unique category grid
// only; Set/Magic/Rare/Base categorization is untouched.
const UNIQUE_CATEGORY_MERGES: Record<string, string> = { grimoires: 'shields' };
function displaySlotForUnique(slotCategory: string): string {
  return UNIQUE_CATEGORY_MERGES[slotCategory] ?? slotCategory;
}

export function getCategoriesForKind(kind: 'unique' | 'set'): string[] {
  const items = ALL_ITEMS.filter(i => i.kind === kind);
  const slotOf = kind === 'unique'
    ? (i: RawGrailItem) => displaySlotForUnique(i.slotCategory)
    : (i: RawGrailItem) => i.slotCategory;
  const populated = SLOT_ORDER.filter(slot => items.some(i => slotOf(i) === slot));
  if (kind !== 'set') return populated;

  const hasWeapon = populated.some(slot => WEAPON_SLOTS_FOR_SET_COMBINATION.has(slot));
  const nonWeapon = populated.filter(slot => !WEAPON_SLOTS_FOR_SET_COMBINATION.has(slot));
  return hasWeapon ? ['weapons', ...nonWeapon] : nonWeapon;
}

export function getItemsForSetWeaponsCategory(): RawGrailItem[] {
  return ALL_ITEMS.filter(i => i.kind === 'set' && WEAPON_SLOTS_FOR_SET_COMBINATION.has(i.slotCategory));
}

// Item ids grouped by the same category buckets getCategoriesForKind()
// names (including the collapsed 'weapons' bucket for 'set') — lets a
// category grid compute "X of Y owned" without re-deriving the weapons
// special-case itself.
export function getItemIdsByCategory(kind: 'unique' | 'set'): Record<string, string[]> {
  const categories = getCategoriesForKind(kind);
  const result: Record<string, string[]> = {};
  for (const category of categories) {
    const items = kind === 'set' && category === 'weapons'
      ? getItemsForSetWeaponsCategory()
      : kind === 'unique'
        ? ALL_ITEMS.filter(i => i.kind === 'unique' && displaySlotForUnique(i.slotCategory) === category)
        : ALL_ITEMS.filter(i => i.kind === kind && i.slotCategory === category);
    result[category] = items.map(i => i.id);
  }
  return result;
}

// Exposed for the Unique per-category detail page, which filters
// ALL_ITEMS by category directly rather than through getItemIdsByCategory.
export function itemsForUniqueCategory(category: string): RawGrailItem[] {
  return ALL_ITEMS.filter(i => i.kind === 'unique' && displaySlotForUnique(i.slotCategory) === category);
}

// Every item id for a kind, regardless of category — used for the
// page-level "your collection: X/Y" summary on the Unique/Set landing pages.
export function getAllItemIdsForKind(kind: 'unique' | 'set'): string[] {
  return ALL_ITEMS.filter(i => i.kind === kind).map(i => i.id);
}

export function slugifySetName(name: string): string {
  return name
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
