import basesFull from '../../../data/bases-full.json';
import { type Locale } from './catalog';

// Base-items-page-specific category order and visibility -- distinct from
// catalog.ts's SLOT_ORDER (which drives unique/set item categorization and
// must stay unchanged). Rings/amulets/charms/jewels are hidden here since
// base items carry little useful info for those slots (no properties, just
// a name/icon). Non-weapon armor/shield slots (including Grimoires, which
// behave as a Warlock offhand shield rather than a weapon) are grouped
// first, followed by all weapon slots.
const BASE_CATEGORY_ORDER = [
  'helms', 'armors', 'shields', 'belts', 'boots', 'gloves', 'grimoires',
  'swords', 'daggers', 'axes', 'polearms', 'spears',
  'clubs', 'maces', 'hammers', 'scepters', 'staves',
  'orbs', 'wands', 'katars',
  'bows', 'crossbows', 'javelins', 'throwings',
] as const;

export interface BaseStatRow {
  code: string;
  min?: number;
  max?: number;
  value?: number;
}

export interface BaseGrade {
  name: string;
  invFile: string | null;
  hdIcon: string | null;
  levelReq: number | null;
  qlvl: number | null;
  statRows: BaseStatRow[];
}

export interface BaseLine {
  id: string;
  slotCategory: string;
  subCategory: string | null;
  invFile: string | null;
  hdIcon: string | null;
  grades: { normal: BaseGrade | null; exceptional: BaseGrade | null; elite: BaseGrade | null };
}

type RawGrade = (typeof basesFull)[number]['grades'][keyof (typeof basesFull)[number]['grades']];

function localizeGrade(grade: RawGrade, locale: Locale): BaseGrade | null {
  if (!grade) return null;
  return { ...grade, name: grade.name[locale as keyof typeof grade.name] };
}

export function getBaseCategories(): (typeof BASE_CATEGORY_ORDER)[number][] {
  return BASE_CATEGORY_ORDER.filter(slot => basesFull.some(l => l.slotCategory === slot));
}

export function getBaseLinesForCategory(category: string, locale: Locale): BaseLine[] {
  return basesFull
    .filter(l => l.slotCategory === category)
    .map(l => ({
      id: l.id,
      slotCategory: l.slotCategory,
      subCategory: l.subCategory,
      invFile: l.invFile,
      hdIcon: l.hdIcon,
      grades: {
        normal: localizeGrade(l.grades.normal, locale),
        exceptional: localizeGrade(l.grades.exceptional, locale),
        elite: localizeGrade(l.grades.elite, locale),
      },
    }));
}
