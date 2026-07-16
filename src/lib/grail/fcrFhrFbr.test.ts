import { describe, it, expect } from 'vitest';
import { FCR_FHR_FBR_TABLES } from './fcrFhrFbr';

describe('FCR_FHR_FBR_TABLES', () => {
  it('has exactly 10 class/form entries, matching d2r.world', () => {
    expect(FCR_FHR_FBR_TABLES.length).toBe(10);
    expect(FCR_FHR_FBR_TABLES.map(t => t.id).sort()).toEqual([
      'amazon', 'assassin', 'barbarian', 'druid-bear', 'druid-human', 'druid-wolf',
      'necromancer', 'necromancer-vampire', 'paladin', 'sorceress',
    ]);
  });

  it('Sorceress FCR has an "other spells" and a "Lightning / Chain Lightning" sub-column with correct values', () => {
    const sor = FCR_FHR_FBR_TABLES.find(t => t.id === 'sorceress')!;
    const other = sor.fcr.find(c => c.label === 'other spells')!;
    const lightning = sor.fcr.find(c => c.label === 'Lightning / Chain Lightning')!;
    expect(other.rows[11]).toBe('20%');
    expect(lightning.rows[11]).toBe('194%');
    expect(other.rows[3]).toBeUndefined();
  });

  it('Amazon FBR sub-columns match d2r.world exactly', () => {
    const ama = FCR_FHR_FBR_TABLES.find(t => t.id === 'amazon')!;
    const oneHand = ama.fbr.find(c => c.label === '1H swinging weapon')!;
    const other = ama.fbr.find(c => c.label === 'Other weapons')!;
    expect(oneHand.rows[5]).toBe('480%');
    expect(other.rows[1]).toBe('600%');
    expect(oneHand.rows[1]).toBeUndefined();
  });

  it('Paladin FBR sub-columns (Normal vs Holy Shield) match d2r.world exactly', () => {
    const pal = FCR_FHR_FBR_TABLES.find(t => t.id === 'paladin')!;
    const normal = pal.fbr.find(c => c.label === 'Normal')!;
    const holyShield = pal.fbr.find(c => c.label === 'Holy Shield')!;
    expect(normal.rows[1]).toBe('600%');
    expect(holyShield.rows[1]).toBe('86%');
    expect(holyShield.rows[2]).toBe('0%');
  });

  it('single-column stats (e.g. Assassin FCR) use one column with an empty label', () => {
    const asn = FCR_FHR_FBR_TABLES.find(t => t.id === 'assassin')!;
    expect(asn.fcr.length).toBe(1);
    expect(asn.fcr[0].label).toBe('');
    expect(asn.fcr[0].rows[9]).toBe('174%');
    expect(asn.fcr[0].rows[16]).toBe('0%');
  });
});
