// src/lib/grail/affixCatalog.ts
import magicAffixesFull from '../../../data/magic-affixes.json';
import type { Locale } from './catalog';
import { formatAffixStatText, formatAffixStatMaxText } from './formatAffixTemplate';
import { signedValue } from './formatStat';

export type AffixKind = 'magic' | 'rare';

export interface AffixStat {
  key: string;
  label: string;
  template: string | null;
  composedText?: string;
  min: number;
  max: number;
  isSkillRef: boolean;
  signed?: boolean;
}

export interface Affix {
  name: string;
  alvl: number;
  group: number;
  stats: AffixStat[];
  itemTypes: string[];
}

export interface AffixGroup {
  headerAffix: Affix;
  headerText: string;
  affixes: Affix[];
}

// Charms (small/large/grand) can never be Rare quality in D2 -- they only
// exist as Normal (no affixes), Magic, or Unique. Verified directly:
// itemtypes.json's "scha"/"mcha"/"lcha" rows have no `Rare` flag at all
// (every other equippable item type does, e.g. `helm.Rare === 1`). Each
// affix's own `rareEligible` flag (from magicprefix.json/magicsuffix.json's
// `rare` column) is per-AFFIX, not per-(affix, item type) -- an affix that
// legitimately rolls on rings AND charms stays `rareEligible: true`
// overall (correct for rings), which without this exclusion also produced
// bogus rare-charm category pages. Filtered at the category level for both
// functions below since that's the only place itemType granularity exists.
const RARE_INCAPABLE_CATEGORIES = new Set(['smallCharms', 'largeCharms', 'grandCharms']);

export function getAffixCategories(kind: AffixKind): string[] {
  const relevant = kind === 'rare' ? magicAffixesFull.filter(a => a.rareEligible) : magicAffixesFull;
  const categories = new Set<string>();
  for (const a of relevant) for (const t of a.itemTypes) {
    if (kind === 'rare' && RARE_INCAPABLE_CATEGORIES.has(t)) continue;
    categories.add(t);
  }
  return Array.from(categories).sort();
}

export function getAffixesForCategory(
  kind: AffixKind,
  category: string,
  locale: Locale
): { prefixes: Affix[]; suffixes: Affix[] } {
  const relevant = magicAffixesFull.filter(
    a => a.itemTypes.includes(category) && (kind === 'magic' || a.rareEligible)
  );
  const toAffix = (a: (typeof magicAffixesFull)[number]): Affix => ({
    name: a.name[locale],
    alvl: a.alvl,
    group: a.group,
    itemTypes: a.itemTypes,
    stats: a.stats.map(s => ({
      key: s.key,
      label: s.label[locale],
      // English-only fallback templates (e.g. dmg%/indestruct) only have
      // an `en` key -- fall back to that rather than losing the template
      // entirely for zh-TW/zh-CN readers.
      template: (s.template as Record<string, string> | null)?.[locale]
        ?? (s.template as Record<string, string> | null)?.en
        ?? null,
      composedText: (s.composedText as Record<string, string> | undefined)?.[locale]
        ?? (s.composedText as Record<string, string> | undefined)?.en,
      min: s.min,
      max: s.max,
      isSkillRef: s.isSkillRef,
      signed: (s as { signed?: boolean }).signed,
    })),
  });
  return {
    prefixes: relevant.filter(a => a.kind === 'prefix').map(toAffix),
    suffixes: relevant.filter(a => a.kind === 'suffix').map(toAffix),
  };
}

// Buckets a flat affix list by their shared `group` (mutual-exclusivity)
// field -- affixes sharing a group id can never both roll on the same
// item. Every affix belongs to some group (verified: none are 0 in the
// data), including singleton groups of 1.
//
// headerText computation (verified against 2 real cases): if every
// stat across every member is a simple (non-skill-referencing) stat,
// list each DISTINCT stat key's best (highest min/max) value across the
// whole group -- fixes both "of the Sun" (2 real, comparable stats, only
// the first was shown) and heterogeneous groups like the 3-element
// absorb family (fire/cold/lightning, same alvl, arbitrarily picking one
// as "the" representative made no sense since they're not comparable).
// If ANY member has a skill-referencing stat, use a general title (just
// the highest-alvl affix's own name, no computed value) -- "best value"
// is meaningless for a group of e.g. 213 different granted skills.
export function groupAffixesByExclusivity(affixes: Affix[], randomSkillLabel = 'Random Magic Skill'): AffixGroup[] {
  const byGroup = new Map<number, Affix[]>();
  for (const a of affixes) {
    const list = byGroup.get(a.group);
    if (list) list.push(a);
    else byGroup.set(a.group, [a]);
  }
  const groups: AffixGroup[] = [];
  for (const members of byGroup.values()) {
    const sorted = [...members].sort((a, b) => b.alvl - a.alvl);
    const headerAffix = sorted[0];
    const hasSkillRef = members.some(a => a.stats.some(s => s.isSkillRef));
    const headerText = hasSkillRef ? headerAffix.name : bestPropertiesHeaderText(members, headerAffix, randomSkillLabel);
    groups.push({ headerAffix, headerText, affixes: sorted });
  }
  return groups.sort((a, b) => b.headerAffix.alvl - a.headerAffix.alvl);
}

// For a group of simple (non-skill-ref) affixes: the header shows the
// HEADER AFFIX's (highest-alvl member's) own name paired with its own
// stat value(s), each rendered as a single max number (not a range) --
// e.g. "of the Titan" (str 16-20) becomes "of the Titan — +20 to
// Strength". Earlier revisions tried substituting a DIFFERENT member's
// value when it was numerically bigger (e.g. showing "of Atlas"'s +30
// under "of the Titan"'s name), but that produces a name/number pairing
// that doesn't correspond to any real affix -- the header is meant to
// represent the header affix itself, at its own best roll, not a
// synthesized composite. This also resolves "of the Sun" for free: that
// affix's own stats are exactly light radius + percent Attack Rating (it
// doesn't carry the OTHER members' flat Attack Rating at all), so no
// separate flat/percent merging logic is needed -- using the header
// affix's own stats naturally already picks the percent variant.
//
// Distinct-key count across the WHOLE group still gates a cap: beyond 3
// distinct properties, listing them all produces an unreadable wall of
// text (verified: group 125's skill-tab-bonus affixes have 24-29
// distinct stat-key variants, one per skill tab, and group 101's
// defense-family group mixes flat ac, ac%, ac/lvl, and ac%/lvl -- 4
// non-comparable units). In that case, fall back to the single most
// extreme-magnitude (affix, stat) pair across the ENTIRE group (not
// necessarily the header affix's own stat, since the header affix isn't
// always the one carrying the group's most extreme number -- verified:
// group 101's highest-alvl member is "Ivory" alvl 64, a flat +64
// Defense, but "Godly" alvl 45/50's ac% stat reaches +200%, the number
// that actually represents the group's ceiling) -- e.g. group 101
// becomes "Godly — +200% Enhanced Defense" rather than "Ivory — +64
// Defense" (technically-highest-alvl but not the group's real max).
function bestPropertiesHeaderText(members: Affix[], headerAffix: Affix, randomSkillLabel: string): string {
  const distinctKeys = new Set(members.flatMap(a => a.stats.map(s => s.key)));
  if (distinctKeys.size === 0) return headerAffix.name;
  if (distinctKeys.size > 3) {
    let best: { stat: AffixStat; owner: Affix } | null = null;
    for (const affix of members) {
      for (const stat of affix.stats) {
        if (!best || Math.abs(stat.max) > Math.abs(best.stat.max)) best = { stat, owner: affix };
      }
    }
    // "skilltab:N" keys where N differs across members (e.g. a category
    // like gloves that can roll ANY class's skill-tab bonus) represent
    // completely different skills, not tiers of one property -- showing
    // one specific member's name+skill (e.g. "Athletic — +3 to Passive
    // and Magic Skills", just the tab this particular member happened to
    // sort first among ties) misleadingly implies that's "the" group
    // property, when really any member's own (different) skill is
    // equally likely. Use a generic "+N Random Magic Skill" title instead
    // -- keeps the real max number, drops the specific (arbitrary) skill
    // name. Only when heterogeneous: a group of skilltab affixes that all
    // share the SAME tab (e.g. one class's own 3 tiers) still isn't hit,
    // since that only has 1 distinct key and takes the branch below.
    const allSkillTabs = [...distinctKeys].every(k => k.startsWith('skilltab:'));
    if (allSkillTabs && distinctKeys.size > 1) {
      // Always a positive bonus (every skilltab template is "%+d to ...") --
      // force the sign rather than relying on the stat's own `signed` flag,
      // which isn't guaranteed to be set for this code.
      return `${signedValue(best!.stat.max, true)} ${randomSkillLabel}`;
    }
    // Show ALL of the winning affix's own stats, not just the one that won
    // the magnitude comparison -- verified bug: "Grandmaster's" (att
    // 251-300, dmg% 151-200%) won on its `att` stat alone (this group has
    // 5 distinct keys: att, dmg%, dmg/lvl, att/lvl, att%/lvl -- over the
    // cap), so the header showed only "+300 to Attack Rating", silently
    // dropping "+200% Enhanced Damage" even though that's also
    // Grandmaster's own, real stat.
    const ownTexts = best!.owner.stats.map(stat => formatAffixStatMaxText(stat));
    return `${best!.owner.name} — ${ownTexts.join(', ')}`;
  }
  const propertyTexts = headerAffix.stats.map(stat => formatAffixStatMaxText(stat));
  return `${headerAffix.name} — ${propertyTexts.join(', ')}`;
}
