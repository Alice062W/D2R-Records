import uniques from '../../../data/uniques.json';
import sets from '../../../data/sets.json';

export interface LocalizedText {
  en: string;
  'zh-TW': string;
  'zh-CN': string;
}

export type Locale = 'en' | 'zh-TW' | 'zh-CN';

export interface RawGrailProperty {
  code: string;
  label: LocalizedText;
  // min/max/variable are carried alongside the pre-composed label text so
  // the Grail find-tracking feature can record which specific value a
  // player rolled within a variable stat's range. `label` remains the
  // source of truth for display text -- these are additive, not for
  // re-deriving text from.
  min: number;
  max: number;
  variable: boolean;
  // Present only for "1 of the following: ..." pick-one property groups
  // (Sunder Charm affixes, Wraithstep, Opalvein). `label` above is the
  // whole group pre-composed as one flat multi-line block (for any
  // consumer that just wants the plain text) -- groupHeader/groupChoices
  // let the UI instead render the header as its own line and each choice
  // as its own bulleted, individually variable-flagged property.
  groupHeader?: LocalizedText;
  groupChoices?: RawGrailProperty[];
}

export interface RawGrailPieceBonus extends RawGrailProperty {
  piecesRequired: number;
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
  // Final, already-computed Defense/Damage range exactly as the real D2R
  // item tooltip shows it -- base item roll combined with the item's own
  // ac%/dmg% (Enhanced Defense/Damage) and flat ac/dmg-min/dmg-max bonuses.
  // See D2RAssets/docs/item-display-template.md "Defense is a COMPUTED
  // range" for the full derivation. NOT the base item's own raw roll range.
  defense: { min: number; max: number } | null;
  oneHandDamage: { min: number; max: number } | null;
  twoHandDamage: { min: number; max: number } | null;
  requiredStrength: number | null;
  requiredDexterity: number | null;
  weaponSpeed: number | null;
  durability: number | null;
  // Bare English class code (e.g. "Assassin") or null -- not localized in
  // the source pipeline, translate via this site's own class-name strings.
  classRestriction: string | null;
  invFile: string | null;
  // Bare id (e.g. "crown"), resolved to /items/hd/{hdIcon}.png. null when no
  // HD art exists for this item (2 confirmed genuine gaps in Blizzard's own
  // asset data -- see docs/item-display-template.md) -- render falls back
  // to invFile.
  hdIcon: string | null;
  // Already filtered (no-display-text stats removed) and sorted into the
  // real tooltip's display order by the extraction pipeline -- render
  // exactly as given, do not re-sort or filter.
  properties: RawGrailProperty[];
  setPiecesBonuses: RawGrailPieceBonus[];
  setFullBonus: RawGrailProperty[];
  setBonuses: RawGrailPieceBonus[];
  // Codes of this item's own variable-roll properties, in tooltip display
  // order -- used to rank a player's recorded finds by best-roll priority.
  statPriority: string[];
  ladderRestricted: boolean;
  firstLadderSeason: number | null;
  lastLadderSeason: number | null;
}

export interface GrailProperty {
  code: string;
  label: string;
  min: number;
  max: number;
  variable: boolean;
  groupHeader?: string;
  groupChoices?: GrailProperty[];
}

export interface GrailPieceBonus extends GrailProperty {
  piecesRequired: number;
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
  oneHandDamage: { min: number; max: number } | null;
  twoHandDamage: { min: number; max: number } | null;
  requiredStrength: number | null;
  requiredDexterity: number | null;
  weaponSpeed: number | null;
  durability: number | null;
  classRestriction: string | null;
  invFile: string | null;
  hdIcon: string | null;
  properties: GrailProperty[];
  setPiecesBonuses: GrailPieceBonus[];
  setFullBonus: GrailProperty[];
  setBonuses: GrailPieceBonus[];
  statPriority: string[];
  ladderRestricted: boolean;
  firstLadderSeason: number | null;
  lastLadderSeason: number | null;
}

const ALL_ITEMS: RawGrailItem[] = [...(uniques as RawGrailItem[]), ...(sets as RawGrailItem[])];

export function getAllGrailItems(): RawGrailItem[] {
  return ALL_ITEMS;
}

function localizeProps(list: RawGrailProperty[], locale: Locale): GrailProperty[] {
  return list.map(p => ({
    code: p.code, label: p.label[locale], min: p.min, max: p.max, variable: p.variable,
    ...(p.groupHeader
      ? { groupHeader: p.groupHeader[locale], groupChoices: localizeProps(p.groupChoices ?? [], locale) }
      : {}),
  }));
}

function localizePieceBonuses(list: RawGrailPieceBonus[], locale: Locale): GrailPieceBonus[] {
  return list.map(p => ({
    code: p.code, label: p.label[locale], min: p.min, max: p.max, variable: p.variable,
    piecesRequired: p.piecesRequired,
    ...(p.groupHeader
      ? { groupHeader: p.groupHeader[locale], groupChoices: localizeProps(p.groupChoices ?? [], locale) }
      : {}),
  }));
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
    oneHandDamage: item.oneHandDamage,
    twoHandDamage: item.twoHandDamage,
    requiredStrength: item.requiredStrength,
    requiredDexterity: item.requiredDexterity,
    weaponSpeed: item.weaponSpeed,
    durability: item.durability,
    classRestriction: item.classRestriction,
    invFile: item.invFile,
    hdIcon: item.hdIcon,
    properties: localizeProps(item.properties, locale),
    setPiecesBonuses: localizePieceBonuses(item.setPiecesBonuses, locale),
    setFullBonus: localizeProps(item.setFullBonus, locale),
    setBonuses: localizePieceBonuses(item.setBonuses, locale),
    statPriority: item.statPriority,
    ladderRestricted: item.ladderRestricted,
    firstLadderSeason: item.firstLadderSeason,
    lastLadderSeason: item.lastLadderSeason,
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
      : ALL_ITEMS.filter(i => i.kind === kind && i.slotCategory === category);
    result[category] = items.map(i => i.id);
  }
  return result;
}

// Exposed for the Unique per-category detail page, which filters
// ALL_ITEMS by category directly rather than through getItemIdsByCategory.
export function itemsForUniqueCategory(category: string): RawGrailItem[] {
  return ALL_ITEMS.filter(i => i.kind === 'unique' && i.slotCategory === category);
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
