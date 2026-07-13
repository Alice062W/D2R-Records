// Not exhaustive — covers commonly-referenced farming/quest areas per act.
// Extend as needed; this is reference data for the log-find form's dropdowns only.
export const ACTS = ['Act I', 'Act II', 'Act III', 'Act IV', 'Act V'] as const;
export type Act = (typeof ACTS)[number];

export const AREAS_BY_ACT: Record<Act, string[]> = {
  'Act I': [
    'Blood Moor', 'Cold Plains', 'Stony Field', 'Dark Wood', 'Black Marsh',
    'The Forgotten Tower', 'Tristram', 'Cathedral', 'Catacombs', "Countess' Tower",
    'Other / Unknown',
  ],
  'Act II': [
    'Rocky Waste', 'Dry Hills', 'Far Oasis', 'Lost City', 'Valley of Snakes',
    'Claw Viper Temple', 'Arcane Sanctuary', "Tal Rasha's Tombs", "Duriel's Lair",
    'Other / Unknown',
  ],
  'Act III': [
    'Spider Forest', 'Great Marsh', 'Flayer Jungle', 'Kurast Bazaar', 'Travincal',
    'Durance of Hate', 'Other / Unknown',
  ],
  'Act IV': [
    'Outer Steppes', 'Plains of Despair', 'City of the Damned', 'River of Flame',
    "Diablo's Lair", 'Other / Unknown',
  ],
  'Act V': [
    'Bloody Foothills', 'Frigid Highlands', 'Arreat Plateau', "Nihlathak's Temple",
    'Crystalline Passage', 'Frozen Tundra', "Ancients' Way", 'Worldstone Keep',
    'Throne of Destruction', 'Other / Unknown',
  ],
};
