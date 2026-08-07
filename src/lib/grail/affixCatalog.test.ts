import { describe, it, expect } from 'vitest';
import { getAffixCategories, getAffixesForCategory, groupAffixesByExclusivity } from './affixCatalog';

describe('affixCatalog', () => {
  it('magic categories include the real granular item-type slugs found in the data', () => {
    const categories = getAffixCategories('magic');
    expect(categories).toContain('helms');
    expect(categories).toContain('rings');
  });

  it('rare categories are a subset of (or equal to) magic categories for the same itype set', () => {
    const magicCats = getAffixCategories('magic');
    const rareCats = getAffixCategories('rare');
    for (const cat of rareCats) expect(magicCats).toContain(cat);
  });

  it('getAffixesForCategory returns prefixes and suffixes for rings', () => {
    const { prefixes, suffixes } = getAffixesForCategory('magic', 'rings', 'en');
    expect(prefixes.some(p => p.name === 'Fortuitous')).toBe(true);
    expect(suffixes.length).toBeGreaterThan(0);
  });

  it('rare-kind filtering excludes non-rare-eligible affixes', () => {
    const { prefixes: magicPrefixes } = getAffixesForCategory('magic', 'rings', 'en');
    const { prefixes: rarePrefixes } = getAffixesForCategory('rare', 'rings', 'en');
    expect(rarePrefixes.length).toBeLessThanOrEqual(magicPrefixes.length);
  });

  it('getAffixesForCategory returns the full stats array and group, not a flattened single stat', () => {
    const { prefixes } = getAffixesForCategory('magic', 'rings', 'en');
    const rugged = prefixes.find(p => p.name === 'Rugged');
    expect(rugged).toBeDefined();
    expect(typeof rugged!.group).toBe('number');
    expect(Array.isArray(rugged!.stats)).toBe(true);
    expect(rugged!.stats.length).toBeGreaterThan(0);
    expect(rugged!.stats[0]).toHaveProperty('template');
    expect(rugged!.stats[0]).toHaveProperty('label');
  });

  it('groupAffixesByExclusivity buckets affixes sharing a group id together', () => {
    const { suffixes } = getAffixesForCategory('magic', 'rings', 'en');
    const health = suffixes.find(s => s.name === 'of Health');
    const protection = suffixes.find(s => s.name === 'of Protection');
    expect(health).toBeDefined();
    expect(protection).toBeDefined();
    expect(health!.group).toBe(protection!.group);

    const groups = groupAffixesByExclusivity(suffixes);
    const sharedGroup = groups.find(g => g.affixes.some(a => a.name === 'of Health'));
    expect(sharedGroup).toBeDefined();
    expect(sharedGroup!.affixes.map(a => a.name)).toEqual(expect.arrayContaining(['of Health', 'of Protection']));
  });

  it('groupAffixesByExclusivity uses the highest-alvl member as the group header', () => {
    const { suffixes } = getAffixesForCategory('magic', 'rings', 'en');
    const groups = groupAffixesByExclusivity(suffixes);
    const sharedGroup = groups.find(g => g.affixes.some(a => a.name === 'of Health'))!;
    // "of Protection" (alvl 18) outranks "of Health" (alvl 7).
    expect(sharedGroup.headerAffix.name).toBe('of Protection');
    expect(sharedGroup.headerText).toContain('of Protection');
  });

  it('groupAffixesByExclusivity sorts groups by their header alvl descending', () => {
    const { suffixes } = getAffixesForCategory('magic', 'rings', 'en');
    const groups = groupAffixesByExclusivity(suffixes);
    for (let i = 1; i < groups.length; i++) {
      expect(groups[i - 1].headerAffix.alvl).toBeGreaterThanOrEqual(groups[i].headerAffix.alvl);
    }
  });

  it('groupAffixesByExclusivity lists every distinct property at its best value when all members are simple stats', () => {
    const { suffixes } = getAffixesForCategory('magic', 'rings', 'en');
    const groups = groupAffixesByExclusivity(suffixes);
    const sunGroup = groups.find(g => g.affixes.some(a => a.name === 'of the Sun'))!;
    expect(sunGroup).toBeDefined();
    // "of the Sun" has 2 real stats (Light Radius, Attack Rating%) -- both
    // should appear in the header text, not just the first.
    expect(sunGroup.headerText).toContain('Light Radius');
    expect(sunGroup.headerText).toMatch(/Attack Rating/i);
  });

  it('groupAffixesByExclusivity uses a general title (name only) for groups containing a skill-referencing stat', () => {
    const { suffixes } = getAffixesForCategory('magic', 'rings', 'en');
    const groups = groupAffixesByExclusivity(suffixes);
    const chainLightningAffix = suffixes.find(s => s.stats.some(st => st.isSkillRef));
    expect(chainLightningAffix).toBeDefined();
    const skillGroup = groups.find(g => g.affixes.some(a => a.name === chainLightningAffix!.name))!;
    expect(skillGroup).toBeDefined();
    // General title -- just the header affix's own name, no appended value.
    expect(skillGroup.headerText).toBe(skillGroup.headerAffix.name);
  });

  it('groupAffixesByExclusivity picks the most extreme (not least-negative) value for negative-is-better stats', () => {
    // "ease" group (Requirements% reduction): "of Simplicity" (alvl 25, -30%,
    // the strongest roll), "of Ease" (alvl 15, -20%), "of Freedom" (alvl 1,
    // -15%, the weakest). Naive `max > existing.max` picks -15% (wrong --
    // the weakest roll) and wrongly attaches it to "of Simplicity"'s name.
    const { suffixes } = getAffixesForCategory('magic', 'armors', 'en');
    const groups = groupAffixesByExclusivity(suffixes);
    const easeGroup = groups.find(g => g.affixes.some(a => a.name === 'of Simplicity'))!;
    expect(easeGroup).toBeDefined();
    expect(easeGroup.headerAffix.name).toBe('of Simplicity');
    expect(easeGroup.headerText).toContain('-30');
    expect(easeGroup.headerText).not.toContain('-15');
  });

  it('groupAffixesByExclusivity uses a generic "random skill" title for a group spanning different skill tabs', () => {
    // Grand Charm skill-tab-bonus group: dozens of prefixes, one per skill
    // tab (skilltab:0..23+), none of which are isSkillRef -- would otherwise
    // produce an unreadably long comma-joined header. Since every member's
    // skill tab is DIFFERENT (not tiers of the same tab), no single
    // member's own skill is "the" representative one -- falls back to a
    // generic "+N <label>" title (max value, caller-supplied generic
    // label) rather than naming one arbitrary member's specific skill.
    const { prefixes } = getAffixesForCategory('magic', 'grandCharms', 'en');
    const groups = groupAffixesByExclusivity(prefixes, 'Random Magic Skill');
    const skillTabGroup = groups.find(g => g.affixes.length > 10)!;
    expect(skillTabGroup).toBeDefined();
    expect(skillTabGroup.headerText).toContain('Random Magic Skill');
    expect(skillTabGroup.headerText).not.toContain(skillTabGroup.headerAffix.name);
  });
});
