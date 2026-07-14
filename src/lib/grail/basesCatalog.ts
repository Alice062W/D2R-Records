import basesFull from '../../../data/bases-full.json';
import { SLOT_ORDER, type Locale } from './catalog';

export interface BaseGrade {
  name: string;
  oneHandDamage: { min: number; max: number } | null;
  twoHandDamage: { min: number; max: number } | null;
  levelReq: number | null;
  requiredStrength: number | null;
  requiredDexterity: number | null;
  durability: number | null;
  sockets: number | null;
  qlvl: number | null;
}

export interface BaseLine {
  id: string;
  slotCategory: string;
  grades: { normal: BaseGrade | null; exceptional: BaseGrade | null; elite: BaseGrade | null };
}

type RawGrade = (typeof basesFull)[number]['grades'][keyof (typeof basesFull)[number]['grades']];

function localizeGrade(grade: RawGrade, locale: Locale): BaseGrade | null {
  if (!grade) return null;
  return { ...grade, name: grade.name[locale] };
}

export function getBaseCategories(): (typeof SLOT_ORDER)[number][] {
  return SLOT_ORDER.filter(slot => basesFull.some(l => l.slotCategory === slot));
}

export function getBaseLinesForCategory(category: string, locale: Locale): BaseLine[] {
  return basesFull
    .filter(l => l.slotCategory === category)
    .map(l => ({
      id: l.id,
      slotCategory: l.slotCategory,
      grades: {
        normal: localizeGrade(l.grades.normal, locale),
        exceptional: localizeGrade(l.grades.exceptional, locale),
        elite: localizeGrade(l.grades.elite, locale),
      },
    }));
}
