export interface Aura {
  id: string;
  nameKey: string;
  descriptionKey: string;
  reqLevel: number;
  radiusBase: number;
  radiusPerLevel: number;
  manaCost: number;
}

// Numeric fields (reqLevel/radiusBase/radiusPerLevel/manaCost) copied directly from
// vendor/d2data/json/skills.json's reqlevel/Param1/Param2/minmana fields for each of
// the 20 skills carrying the literal "aura": 1 flag — the definitive marker for which
// Paladin skills are auras (not a guess). Exact per-level numeric effect values are
// deliberately excluded — see the design spec's non-goals.
export const AURAS: Aura[] = [
  { id: 'might', nameKey: 'aura_might', descriptionKey: 'aura_might_desc', reqLevel: 1, radiusBase: 16, radiusPerLevel: 2, manaCost: 1 },
  { id: 'prayer', nameKey: 'aura_prayer', descriptionKey: 'aura_prayer_desc', reqLevel: 1, radiusBase: 16, radiusPerLevel: 2, manaCost: 1 },
  { id: 'resist_fire', nameKey: 'aura_resistFire', descriptionKey: 'aura_resistFire_desc', reqLevel: 1, radiusBase: 16, radiusPerLevel: 2, manaCost: 0 },
  { id: 'holy_fire', nameKey: 'aura_holyFire', descriptionKey: 'aura_holyFire_desc', reqLevel: 6, radiusBase: 6, radiusPerLevel: 1, manaCost: 0 },
  { id: 'thorns', nameKey: 'aura_thorns', descriptionKey: 'aura_thorns_desc', reqLevel: 6, radiusBase: 16, radiusPerLevel: 2, manaCost: 0 },
  { id: 'defiance', nameKey: 'aura_defiance', descriptionKey: 'aura_defiance_desc', reqLevel: 6, radiusBase: 16, radiusPerLevel: 2, manaCost: 0 },
  { id: 'resist_cold', nameKey: 'aura_resistCold', descriptionKey: 'aura_resistCold_desc', reqLevel: 6, radiusBase: 16, radiusPerLevel: 2, manaCost: 0 },
  { id: 'blessed_aim', nameKey: 'aura_blessedAim', descriptionKey: 'aura_blessedAim_desc', reqLevel: 12, radiusBase: 16, radiusPerLevel: 2, manaCost: 0 },
  { id: 'cleansing', nameKey: 'aura_cleansing', descriptionKey: 'aura_cleansing_desc', reqLevel: 12, radiusBase: 16, radiusPerLevel: 2, manaCost: 0 },
  { id: 'resist_lightning', nameKey: 'aura_resistLightning', descriptionKey: 'aura_resistLightning_desc', reqLevel: 12, radiusBase: 16, radiusPerLevel: 2, manaCost: 0 },
  { id: 'concentration', nameKey: 'aura_concentration', descriptionKey: 'aura_concentration_desc', reqLevel: 18, radiusBase: 16, radiusPerLevel: 2, manaCost: 0 },
  { id: 'holy_freeze', nameKey: 'aura_holyFreeze', descriptionKey: 'aura_holyFreeze_desc', reqLevel: 18, radiusBase: 6, radiusPerLevel: 1, manaCost: 0 },
  { id: 'vigor', nameKey: 'aura_vigor', descriptionKey: 'aura_vigor_desc', reqLevel: 18, radiusBase: 16, radiusPerLevel: 3, manaCost: 0 },
  { id: 'holy_shock', nameKey: 'aura_holyShock', descriptionKey: 'aura_holyShock_desc', reqLevel: 24, radiusBase: 6, radiusPerLevel: 1, manaCost: 0 },
  { id: 'sanctuary', nameKey: 'aura_sanctuary', descriptionKey: 'aura_sanctuary_desc', reqLevel: 24, radiusBase: 5, radiusPerLevel: 1, manaCost: 1 },
  { id: 'meditation', nameKey: 'aura_meditation', descriptionKey: 'aura_meditation_desc', reqLevel: 24, radiusBase: 16, radiusPerLevel: 2, manaCost: 0 },
  { id: 'fanaticism', nameKey: 'aura_fanaticism', descriptionKey: 'aura_fanaticism_desc', reqLevel: 30, radiusBase: 11, radiusPerLevel: 1, manaCost: 0 },
  { id: 'conviction', nameKey: 'aura_conviction', descriptionKey: 'aura_conviction_desc', reqLevel: 30, radiusBase: 20, radiusPerLevel: 0, manaCost: 0 },
  { id: 'redemption', nameKey: 'aura_redemption', descriptionKey: 'aura_redemption_desc', reqLevel: 30, radiusBase: 16, radiusPerLevel: 0, manaCost: 0 },
  { id: 'salvation', nameKey: 'aura_salvation', descriptionKey: 'aura_salvation_desc', reqLevel: 30, radiusBase: 16, radiusPerLevel: 2, manaCost: 0 },
];
