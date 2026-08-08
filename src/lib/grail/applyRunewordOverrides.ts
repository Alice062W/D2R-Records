// src/lib/grail/applyRunewordOverrides.ts
//
// Layers manual corrections (data/runeword-overrides.json) on top of the
// base extracted runeword data (data/runewords.json) -- see that file's
// own `_readme` for why this layer exists: our extracted game-data folder
// is a "Reign of the Warlock" mod snapshot with no patch-version tag, and
// individual runewords have been found to disagree with the live game
// (verified: "Coven" was missing Fire Resist/Vitality and had a wrong
// Magic Find range, confirmed via the user's in-game Chronicle). Rather
// than hand-editing the bulk data file each time, corrections accumulate
// here, keyed by runeword id, and get merged in at read time.

export interface RunewordStat {
  code: string;
  label: Record<'en' | 'zh-TW' | 'zh-CN', string>;
  min: number;
  max: number;
  variable: boolean;
}

export interface RunewordOverride {
  name: string;
  verifiedAt: string;
  source: string;
  addStats?: RunewordStat[];
  replaceStats?: RunewordStat[];
  removeStatCodes?: string[];
}

// Loosely typed on purpose: this operates on whatever shape
// data/runewords.json's entries actually have (with a `stats` array of
// RunewordStat-like objects) without needing to import/couple to that
// module's own inferred type here.
export function applyRunewordOverrides<T extends { id: string; stats: RunewordStat[] }>(
  runewords: T[],
  overridesById: Record<string, RunewordOverride | string[]>
): T[] {
  return runewords.map(rw => {
    const override = overridesById[rw.id];
    if (!override || Array.isArray(override)) return rw; // skips `_readme`, which is a string[]

    let stats = rw.stats;
    if (override.removeStatCodes?.length) {
      const remove = new Set(override.removeStatCodes);
      stats = stats.filter(s => !remove.has(s.code));
    }
    if (override.replaceStats?.length) {
      const replaceByCode = new Map(override.replaceStats.map(s => [s.code, s]));
      stats = stats.map(s => replaceByCode.get(s.code) ?? s);
    }
    if (override.addStats?.length) {
      stats = [...stats, ...override.addStats];
    }
    return stats === rw.stats ? rw : { ...rw, stats };
  });
}
