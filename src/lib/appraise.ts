import runewordsData from '../../data/runewords.json';
import basesData from '../../data/bases.json';

export type Tier = 1 | 2 | 3 | 4;

export interface AppraiseInput {
  baseCode: string;   // item code from bases.json, e.g. "uui"
  sockets: number;    // number of sockets the item has
  ethereal: boolean;
  ilvl: number;       // item level (area level when found)
}

export interface MatchedRuneword {
  name: string;
  nameTW: string;
  nameCN: string;
  runes: string[];
  level: number;
  tier: Tier;
  ladderOnly: boolean;
  d2rOnly: boolean;
}

export interface AppraiseResult {
  verdict: 'keep' | 'dump';
  tier: Tier;
  tierLabel: string;
  matchedRunewords: MatchedRuneword[];
  ethNote: string | null;
  socketNote: string | null;
}

const TIER_LABELS: Record<Tier, string> = {
  1: 'Keep — High Value',
  2: 'Keep — Tradeable',
  3: 'Situational',
  4: 'Dump',
};

// Runewords whose eth base is desirable (mercenary use)
const ETH_MERC_RUNEWORDS = new Set([
  'Fortitude', 'Treachery', 'Insight', 'Infinity', 'Doom', 'Pride',
  'Obedience', 'Lawbringer', 'Lore', 'Smoke',
]);

export function appraise(input: AppraiseInput): AppraiseResult {
  const base = basesData.find(b => b.code === input.baseCode);
  if (!base) {
    return {
      verdict: 'dump',
      tier: 4,
      tierLabel: TIER_LABELS[4],
      matchedRunewords: [],
      ethNote: null,
      socketNote: 'Unknown item base.',
    };
  }

  // Find runewords that match this base's itemTypes AND socket count
  const matched = runewordsData.filter(rw =>
    rw.sockets === input.sockets &&
    rw.itemTypes.some(t => base.itemTypes.includes(t))
  ) as MatchedRuneword[];

  // Determine best tier from matched runewords
  const bestTier: Tier = matched.length === 0
    ? 4
    : (Math.min(...matched.map(r => r.tier)) as Tier);

  const verdict = bestTier <= 3 ? 'keep' : 'dump';

  // Eth note
  let ethNote: string | null = null;
  if (input.ethereal) {
    const ethMercMatches = matched.filter(rw => ETH_MERC_RUNEWORDS.has(rw.name));
    if (!base.ethEligible) {
      ethNote = 'This base cannot be ethereal — check item data.';
    } else if (ethMercMatches.length > 0) {
      ethNote = 'Eth is great for mercenary use (cannot be used by character).';
    } else if (matched.length > 0) {
      ethNote = 'Eth reduces defense/damage; non-eth preferred for character runewords.';
    }
  }

  // Socket note: warn if ilvl may be too low for natural max sockets
  let socketNote: string | null = null;
  if (input.ilvl > 0 && input.ilvl < base.minIlvlMaxSock && input.sockets === base.maxSockets) {
    socketNote = `ilvl ${input.ilvl} may be too low to naturally roll ${base.maxSockets} sockets on this base (needs ilvl ${base.minIlvlMaxSock}+). Larzuk can still add max sockets at ilvl 40+.`;
  }

  return {
    verdict,
    tier: bestTier,
    tierLabel: TIER_LABELS[bestTier],
    matchedRunewords: matched.sort((a, b) => a.tier - b.tier),
    ethNote,
    socketNote,
  };
}

export function getBase(code: string) {
  return basesData.find(b => b.code === code) ?? null;
}

export function getAllBases() {
  return basesData;
}

export function getAllRunewords() {
  return runewordsData;
}
