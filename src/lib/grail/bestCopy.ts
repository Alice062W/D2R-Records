export interface FindLike {
  statValues: Record<string, number>;
}

/**
 * Compares two finds by a priority-ordered list of stat keys. Negative means
 * `a` ranks better, positive means `b` ranks better, 0 means tied on every
 * listed stat. A find missing a given stat ranks below one that has it.
 */
export function compareFinds(a: FindLike, b: FindLike, statPriority: string[]): number {
  for (const stat of statPriority) {
    const aHas = stat in a.statValues;
    const bHas = stat in b.statValues;
    if (aHas && !bHas) return -1;
    if (!aHas && bHas) return 1;
    if (!aHas && !bHas) continue;
    const diff = b.statValues[stat] - a.statValues[stat];
    if (diff !== 0) return diff > 0 ? 1 : -1;
  }
  return 0;
}

export function bestFind<T extends FindLike>(finds: T[], statPriority: string[]): T | null {
  if (finds.length === 0) return null;
  return sortFindsByRank(finds, statPriority)[0];
}

export function sortFindsByRank<T extends FindLike>(finds: T[], statPriority: string[]): T[] {
  return [...finds].sort((a, b) => compareFinds(a, b, statPriority));
}
