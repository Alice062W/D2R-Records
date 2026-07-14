import uniques from '../../../data/uniques.json';
import sets from '../../../data/sets.json';

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
  category: 'weapons' | 'armor' | 'other';
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

const ALL_ITEMS: GrailItem[] = [...(uniques as GrailItem[]), ...(sets as GrailItem[])];

export function getAllGrailItems(): GrailItem[] {
  return ALL_ITEMS;
}
