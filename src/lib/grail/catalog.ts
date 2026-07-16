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
}

export interface RawGrailFixedStat {
  key: string;
  label: LocalizedText;
  value: number;
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
}

export interface GrailFixedStat {
  key: string;
  label: string;
  value: number;
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
    stats: item.stats.map(s => ({ key: s.key, label: s.label[locale], min: s.min, max: s.max })),
    fixedStats: item.fixedStats.map(f => ({ key: f.key, label: f.label[locale], value: f.value })),
    setBonuses: item.setBonuses.map(b => ({ key: b.key, label: b.label[locale], min: b.min, max: b.max })),
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
]);

export function getCategoriesForKind(kind: 'unique' | 'set'): string[] {
  const items = ALL_ITEMS.filter(i => i.kind === kind);
  const populated = SLOT_ORDER.filter(slot => items.some(i => i.slotCategory === slot));
  if (kind !== 'set') return populated;

  const hasWeapon = populated.some(slot => WEAPON_SLOTS_FOR_SET_COMBINATION.has(slot));
  const nonWeapon = populated.filter(slot => !WEAPON_SLOTS_FOR_SET_COMBINATION.has(slot));
  return hasWeapon ? ['weapons', ...nonWeapon] : nonWeapon;
}

export function getItemsForSetWeaponsCategory(): RawGrailItem[] {
  return ALL_ITEMS.filter(i => i.kind === 'set' && WEAPON_SLOTS_FOR_SET_COMBINATION.has(i.slotCategory));
}

export function slugifySetName(name: string): string {
  return name
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
