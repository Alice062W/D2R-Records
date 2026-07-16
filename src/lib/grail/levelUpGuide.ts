// Hand-transcribed from d2r.world (https://d2r.world/en-US/info/character/levelup),
// this session, per this project's established policy for curated/deterministic
// game-mechanic content with no equivalent raw vendored-data source (same basis as the
// Runes page's hand-transcribed drop rates). Note: Hell Act 3/4 overlap at clvl 83 and
// there is no separate Nightmare Act 5 row — both are d2r.world's own real content, not
// transcription errors, and should not be "corrected" to look more regular.
export interface LevelUpRow {
  clvlMin: number;
  clvlMax: number;
  difficulty: 'normal' | 'nightmare' | 'hell';
  act: number;
}

export const LEVEL_UP_GUIDE: LevelUpRow[] = [
  { clvlMin: 1, clvlMax: 11, difficulty: 'normal', act: 1 },
  { clvlMin: 12, clvlMax: 18, difficulty: 'normal', act: 2 },
  { clvlMin: 19, clvlMax: 23, difficulty: 'normal', act: 3 },
  { clvlMin: 24, clvlMax: 31, difficulty: 'normal', act: 4 },
  { clvlMin: 32, clvlMax: 36, difficulty: 'normal', act: 5 },
  { clvlMin: 37, clvlMax: 43, difficulty: 'nightmare', act: 1 },
  { clvlMin: 44, clvlMax: 48, difficulty: 'nightmare', act: 2 },
  { clvlMin: 49, clvlMax: 52, difficulty: 'nightmare', act: 3 },
  { clvlMin: 53, clvlMax: 62, difficulty: 'nightmare', act: 4 },
  { clvlMin: 63, clvlMax: 73, difficulty: 'hell', act: 1 },
  { clvlMin: 74, clvlMax: 80, difficulty: 'hell', act: 2 },
  { clvlMin: 81, clvlMax: 83, difficulty: 'hell', act: 3 },
  { clvlMin: 83, clvlMax: 94, difficulty: 'hell', act: 4 },
  { clvlMin: 95, clvlMax: 99, difficulty: 'hell', act: 5 },
];
