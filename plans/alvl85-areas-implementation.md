# Alvl85 Areas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Alvl85 Areas Misc page (currently an unbuilt placeholder): for every
Level 85 area, list every monster present, its type (Animal/Demon/Undead), and its
elemental immunities — matching d2r.world exactly.

**Architecture:** A single hand-transcribed static TypeScript data file (the full
area→monster→type→immunity table doesn't reliably derive from vendored data — confirmed
during design research that `levels.json`'s monster-list fields are incomplete for
several areas) plus a simple grouped-list page, following the same pattern already
established for the Level Up guide.

**Tech Stack:** Next.js/React, Tailwind CSS 4, Vitest.

## Global Constraints

- The data is hand-transcribed from d2r.world exactly as published there (including the
  "Night Lord" monster appearing as Undead in three Act 3 areas and as Animal in Act 5's
  Infernal Pit — both are real, distinct d2r.world rows, not an inconsistency to
  reconcile) — source cited in a code comment.
- Sub-monster/egg variants (shown indented with `└` on d2r.world) are flat, undifferentiated
  rows in this data — no nesting relationship is modeled.
- No change to `data/area-levels.json` or the Area Level page.

---

### Task 1: Alvl85 Areas data + page

**Files:**
- Create: `src/lib/grail/alvl85Areas.ts`, `src/lib/grail/alvl85Areas.test.ts`
- Create: `src/components/items/Alvl85AreaList.tsx`, `src/components/items/Alvl85AreaList.test.tsx`
- Modify: `src/app/[locale]/monster/alvl85/page.tsx` (currently `ComingSoonPage`)
- Modify: `messages/en.json`, `messages/zh-TW.json`, `messages/zh-CN.json`

**Interfaces:**
- Produces: `ALVL85_AREAS: Alvl85Area[]`, exported from `src/lib/grail/alvl85Areas.ts`,
  where:
  ```ts
  export type MonsterType = 'animal' | 'demon' | 'undead';
  export type Element = 'fire' | 'cold' | 'lightning' | 'poison' | 'magic' | 'physical';
  export interface MonsterImmunity { element: Element; value: number; starred: boolean; }
  export interface Alvl85Monster { name: string; type: MonsterType; immunities: MonsterImmunity[]; }
  export interface Alvl85Area { areaName: string; monsters: Alvl85Monster[]; }
  ```

- [ ] **Step 1: Add message keys**

Add to `messages/en.json`'s `Items` namespace:
```json
    "alvl85PageTitle": "Level 85 Areas' Monsters",
    "alvl85PageSubtitle": "Monster type and elemental immunity in every Level 85 area, in Diablo II: Resurrected.",
    "alvl85StarNote": "★: Fire / Cold / Lightning ≥ 117, Poison ≥ 112",
    "alvl85MonsterLabel": "Monster",
    "alvl85TypeLabel": "Type",
    "alvl85ImmunityLabel": "Immunity",
    "alvl85Type_animal": "Animal",
    "alvl85Type_demon": "Demon",
    "alvl85Type_undead": "Undead",
    "alvl85Element_fire": "Fi",
    "alvl85Element_cold": "Co",
    "alvl85Element_lightning": "Li",
    "alvl85Element_poison": "Po",
    "alvl85Element_magic": "Ma",
    "alvl85Element_physical": "Ph"
```

Add hand-authored zh-TW:
```json
    "alvl85PageTitle": "85 等區域怪物",
    "alvl85PageSubtitle": "瀏覽暗黑破壞神2：獄火重生中每個 85 等區域的怪物種類與元素免疫。",
    "alvl85StarNote": "★：火焰 / 冷凍 / 閃電 ≥ 117，毒素 ≥ 112",
    "alvl85MonsterLabel": "怪物",
    "alvl85TypeLabel": "種類",
    "alvl85ImmunityLabel": "免疫",
    "alvl85Type_animal": "動物",
    "alvl85Type_demon": "惡魔",
    "alvl85Type_undead": "不死系",
    "alvl85Element_fire": "火",
    "alvl85Element_cold": "冷",
    "alvl85Element_lightning": "電",
    "alvl85Element_poison": "毒",
    "alvl85Element_magic": "魔",
    "alvl85Element_physical": "物"
```

Run `node scripts/translate-nav-items-ui-zh-cn.mjs` to derive zh-CN.

- [ ] **Step 2: Write the failing data test**

Create `src/lib/grail/alvl85Areas.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { ALVL85_AREAS } from './alvl85Areas';

describe('ALVL85_AREAS', () => {
  it('has exactly 32 area entries, matching d2r.world', () => {
    expect(ALVL85_AREAS.length).toBe(32);
  });

  it("resolves the two distinct 'Night Lord' monsters correctly (Undead in Ruined Temple, Animal in Infernal Pit)", () => {
    const ruinedTemple = ALVL85_AREAS.find(a => a.areaName === 'Ruined Temple')!;
    const nightLordUndead = ruinedTemple.monsters.find(m => m.name === 'Night Lord')!;
    expect(nightLordUndead.type).toBe('undead');
    expect(nightLordUndead.immunities).toEqual([{ element: 'cold', value: 120, starred: true }]);

    const infernalPit = ALVL85_AREAS.find(a => a.areaName === 'Infernal Pit')!;
    const nightLordAnimal = infernalPit.monsters.find(m => m.name === 'Night Lord')!;
    expect(nightLordAnimal.type).toBe('animal');
    expect(nightLordAnimal.immunities).toEqual([{ element: 'lightning', value: 100, starred: false }]);
  });

  it('includes The Worldstone Chamber with no monsters (d2r.world shows no monster list for it)', () => {
    const chamber = ALVL85_AREAS.find(a => a.areaName === 'The Worldstone Chamber')!;
    expect(chamber).toBeDefined();
    expect(chamber.monsters).toEqual([]);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/lib/grail/alvl85Areas.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 4: Implement `alvl85Areas.ts`**

Create `src/lib/grail/alvl85Areas.ts` with the complete data below (hand-transcribed
from `https://d2r.world/en-US/info/monster/alvl85`, this session — the star threshold
note, ★ markers, and every monster/type/immunity value are copied exactly as shown
there; sub-monster/egg variants are included as flat rows, not nested):

```ts
export type MonsterType = 'animal' | 'demon' | 'undead';
export type Element = 'fire' | 'cold' | 'lightning' | 'poison' | 'magic' | 'physical';

export interface MonsterImmunity {
  element: Element;
  value: number;
  starred: boolean;
}

export interface Alvl85Monster {
  name: string;
  type: MonsterType;
  immunities: MonsterImmunity[];
}

export interface Alvl85Area {
  areaName: string;
  monsters: Alvl85Monster[];
}

// Hand-transcribed from d2r.world (https://d2r.world/en-US/info/monster/alvl85), this
// session, per this project's established policy for curated/deterministic content with
// no reliable raw-data equivalent (levels.json's per-area monster-list fields were found
// incomplete for several areas during design research — see the design spec). Star (★)
// threshold: Fire/Cold/Lightning >= 117, Poison >= 112 (also copied from d2r.world).
export const ALVL85_AREAS: Alvl85Area[] = [
  { areaName: 'Mausoleum', monsters: [
    { name: 'Skeleton', type: 'undead', immunities: [{ element: 'lightning', value: 100, starred: false }] },
    { name: 'Hungry Dead', type: 'undead', immunities: [{ element: 'lightning', value: 110, starred: false }] },
  ]},
  { areaName: 'Underground Passage Level 2', monsters: [
    { name: 'Carver', type: 'demon', immunities: [{ element: 'fire', value: 110, starred: false }] },
    { name: 'Misshapen', type: 'demon', immunities: [{ element: 'lightning', value: 110, starred: false }] },
    { name: 'Skeleton Archer', type: 'undead', immunities: [{ element: 'poison', value: 100, starred: false }] },
    { name: 'Vile Hunter', type: 'demon', immunities: [{ element: 'cold', value: 120, starred: true }] },
  ]},
  { areaName: 'Pit Level 1', monsters: [
    { name: 'Dark Stalker', type: 'demon', immunities: [{ element: 'cold', value: 130, starred: true }] },
    { name: 'Devilkin', type: 'demon', immunities: [{ element: 'fire', value: 120, starred: true }] },
    { name: 'Bone Warrior', type: 'undead', immunities: [{ element: 'cold', value: 110, starred: false }] },
    { name: 'Dark Archer', type: 'demon', immunities: [{ element: 'lightning', value: 110, starred: false }] },
  ]},
  { areaName: 'Pit Level 2', monsters: [
    { name: 'Dark Stalker', type: 'demon', immunities: [{ element: 'cold', value: 130, starred: true }] },
    { name: 'Devilkin', type: 'demon', immunities: [{ element: 'fire', value: 120, starred: true }] },
    { name: 'Bone Warrior', type: 'undead', immunities: [{ element: 'cold', value: 110, starred: false }] },
    { name: 'Dark Archer', type: 'demon', immunities: [{ element: 'lightning', value: 110, starred: false }] },
  ]},
  { areaName: 'Stony Tomb Level 1', monsters: [
    { name: 'Horror', type: 'undead', immunities: [{ element: 'lightning', value: 120, starred: true }] },
    { name: 'Burning Dead Mage', type: 'undead', immunities: [{ element: 'lightning', value: 110, starred: false }] },
    { name: 'Dung Soldier', type: 'animal', immunities: [{ element: 'lightning', value: 100, starred: false }] },
  ]},
  { areaName: 'Stony Tomb Level 2', monsters: [
    { name: 'Horror', type: 'undead', immunities: [{ element: 'lightning', value: 120, starred: true }] },
    { name: 'Dung Soldier', type: 'animal', immunities: [{ element: 'lightning', value: 100, starred: false }] },
    { name: 'Burning Dead Mage', type: 'undead', immunities: [] },
  ]},
  { areaName: 'Maggot Lair Level 3', monsters: [
    { name: 'Rock Worm', type: 'animal', immunities: [{ element: 'poison', value: 110, starred: false }] },
    { name: 'Rock Worm Egg', type: 'animal', immunities: [] },
    { name: 'Black Locusts', type: 'animal', immunities: [{ element: 'physical', value: 100, starred: false }] },
    { name: 'Sand Maggot', type: 'animal', immunities: [{ element: 'poison', value: 105, starred: false }] },
    { name: 'Sand Maggot Egg', type: 'animal', immunities: [] },
    { name: 'Scarab', type: 'animal', immunities: [{ element: 'lightning', value: 110, starred: false }] },
    { name: 'Death Beetle', type: 'animal', immunities: [{ element: 'lightning', value: 105, starred: false }] },
  ]},
  { areaName: 'Ancient Tunnels', monsters: [
    { name: 'Plague Bearer', type: 'undead', immunities: [{ element: 'magic', value: 100, starred: false }] },
    { name: 'Horror Mage', type: 'undead', immunities: [{ element: 'lightning', value: 115, starred: false }] },
    { name: 'Embalmed', type: 'undead', immunities: [{ element: 'poison', value: 105, starred: false }] },
    { name: 'Invader', type: 'animal', immunities: [{ element: 'fire', value: 110, starred: false }] },
  ]},
  { areaName: 'Arachnid Lair', monsters: [
    { name: 'Flame Spider', type: 'animal', immunities: [{ element: 'fire', value: 115, starred: false }] },
    { name: 'Poison Spinner', type: 'animal', immunities: [{ element: 'poison', value: 110, starred: false }] },
    { name: 'Fiend', type: 'animal', immunities: [{ element: 'lightning', value: 110, starred: false }] },
    { name: 'Giant Lamprey', type: 'animal', immunities: [{ element: 'poison', value: 120, starred: true }] },
    { name: 'Giant Lamprey Egg', type: 'animal', immunities: [] },
  ]},
  { areaName: 'Swampy Pit Level 1', monsters: [
    { name: 'Undead Stygian Doll', type: 'undead', immunities: [{ element: 'poison', value: 120, starred: true }] },
    { name: 'Preserved Dead', type: 'undead', immunities: [{ element: 'poison', value: 105, starred: false }] },
    { name: 'Undead Soul Killer', type: 'undead', immunities: [{ element: 'poison', value: 115, starred: true }] },
    { name: 'Gloam', type: 'undead', immunities: [{ element: 'lightning', value: 100, starred: false }] },
    { name: 'Fiend', type: 'animal', immunities: [{ element: 'lightning', value: 110, starred: false }] },
  ]},
  { areaName: 'Swampy Pit Level 2', monsters: [
    { name: 'Undead Stygian Doll', type: 'undead', immunities: [{ element: 'poison', value: 120, starred: true }] },
    { name: 'Undead Soul Killer', type: 'undead', immunities: [{ element: 'poison', value: 115, starred: true }] },
    { name: 'Gloam', type: 'undead', immunities: [{ element: 'lightning', value: 100, starred: false }] },
    { name: 'Drowned Carcass', type: 'undead', immunities: [{ element: 'fire', value: 110, starred: false }] },
    { name: 'Fiend', type: 'animal', immunities: [{ element: 'lightning', value: 110, starred: false }] },
  ]},
  { areaName: 'Swampy Pit Level 3', monsters: [
    { name: 'Undead Stygian Doll', type: 'undead', immunities: [{ element: 'poison', value: 120, starred: true }] },
    { name: 'Undead Soul Killer', type: 'undead', immunities: [{ element: 'poison', value: 115, starred: true }] },
    { name: 'Gloam', type: 'undead', immunities: [{ element: 'lightning', value: 100, starred: false }] },
    { name: 'Fiend', type: 'animal', immunities: [{ element: 'lightning', value: 110, starred: false }] },
  ]},
  { areaName: 'Sewers Level 1', monsters: [
    { name: 'Preserved Dead', type: 'undead', immunities: [{ element: 'poison', value: 105, starred: false }] },
    { name: 'Undead Soul Killer', type: 'undead', immunities: [{ element: 'poison', value: 115, starred: true }] },
    { name: 'Feeder', type: 'animal', immunities: [{ element: 'poison', value: 110, starred: false }] },
    { name: 'Gloombat', type: 'animal', immunities: [{ element: 'cold', value: 100, starred: false }] },
    { name: 'Horadrim Ancient', type: 'undead', immunities: [{ element: 'magic', value: 100, starred: false }] },
    { name: 'Horror', type: 'undead', immunities: [{ element: 'lightning', value: 120, starred: true }] },
  ]},
  { areaName: 'Sewers Level 2', monsters: [
    { name: 'Preserved Dead', type: 'undead', immunities: [{ element: 'poison', value: 105, starred: false }] },
    { name: 'Undead Soul Killer', type: 'undead', immunities: [{ element: 'poison', value: 115, starred: true }] },
    { name: 'Slime Prince', type: 'animal', immunities: [{ element: 'poison', value: 110, starred: false }] },
    { name: 'Blood Wing', type: 'animal', immunities: [{ element: 'poison', value: 120, starred: true }] },
    { name: 'Horadrim Ancient', type: 'undead', immunities: [{ element: 'magic', value: 100, starred: false }] },
    { name: 'Horror', type: 'undead', immunities: [{ element: 'lightning', value: 120, starred: true }] },
  ]},
  { areaName: 'Ruined Temple', monsters: [
    { name: 'Flesh Hunter', type: 'demon', immunities: [{ element: 'cold', value: 150, starred: true }] },
    { name: 'Spider Magus', type: 'animal', immunities: [{ element: 'fire', value: 120, starred: true }] },
    { name: 'Wailing Beast', type: 'animal', immunities: [{ element: 'magic', value: 100, starred: false }] },
    { name: 'Night Lord', type: 'undead', immunities: [{ element: 'cold', value: 120, starred: true }] },
  ]},
  { areaName: 'Disused Fane', monsters: [
    { name: 'Flesh Hunter', type: 'demon', immunities: [{ element: 'cold', value: 150, starred: true }] },
    { name: 'Spider Magus', type: 'animal', immunities: [{ element: 'fire', value: 120, starred: true }] },
    { name: 'Wailing Beast', type: 'animal', immunities: [{ element: 'magic', value: 100, starred: false }] },
    { name: 'Night Lord', type: 'undead', immunities: [{ element: 'cold', value: 120, starred: true }] },
  ]},
  { areaName: 'Forgotten Temple', monsters: [
    { name: 'Serpent Magus', type: 'animal', immunities: [{ element: 'cold', value: 120, starred: true }] },
    { name: 'Blood Diver', type: 'animal', immunities: [{ element: 'fire', value: 105, starred: false }] },
    { name: 'Flesh Archer', type: 'demon', immunities: [{ element: 'cold', value: 130, starred: true }] },
    { name: 'Bone Scarab', type: 'animal', immunities: [{ element: 'lightning', value: 120, starred: true }] },
  ]},
  { areaName: 'Forgotten Reliquary', monsters: [
    { name: 'Flesh Hunter', type: 'demon', immunities: [{ element: 'cold', value: 150, starred: true }] },
    { name: 'Spider Magus', type: 'animal', immunities: [{ element: 'fire', value: 120, starred: true }] },
    { name: 'Wailing Beast', type: 'animal', immunities: [{ element: 'magic', value: 100, starred: false }] },
    { name: 'Night Lord', type: 'undead', immunities: [{ element: 'cold', value: 120, starred: true }] },
  ]},
  { areaName: 'Ruined Fane', monsters: [
    { name: 'Serpent Magus', type: 'animal', immunities: [{ element: 'cold', value: 120, starred: true }] },
    { name: 'Blood Diver', type: 'animal', immunities: [{ element: 'fire', value: 105, starred: false }] },
    { name: 'Flesh Archer', type: 'demon', immunities: [{ element: 'cold', value: 130, starred: true }] },
    { name: 'Bone Scarab', type: 'animal', immunities: [{ element: 'lightning', value: 120, starred: true }] },
  ]},
  { areaName: 'Disused Reliquary', monsters: [
    { name: 'Serpent Magus', type: 'animal', immunities: [{ element: 'cold', value: 120, starred: true }] },
    { name: 'Blood Diver', type: 'animal', immunities: [{ element: 'fire', value: 105, starred: false }] },
    { name: 'Flesh Archer', type: 'demon', immunities: [{ element: 'cold', value: 130, starred: true }] },
    { name: 'Bone Scarab', type: 'animal', immunities: [{ element: 'lightning', value: 120, starred: true }] },
  ]},
  { areaName: 'River of Flame', monsters: [
    { name: 'Strangler', type: 'undead', immunities: [{ element: 'lightning', value: 100, starred: false }] },
    { name: 'Maw Fiend', type: 'demon', immunities: [{ element: 'poison', value: 110, starred: false }] },
    { name: 'Pit Lord', type: 'demon', immunities: [{ element: 'fire', value: 120, starred: true }] },
    { name: 'Blood Maggot', type: 'animal', immunities: [{ element: 'poison', value: 125, starred: true }] },
    { name: 'Blood Maggot Egg', type: 'animal', immunities: [] },
    { name: 'Urdar', type: 'demon', immunities: [] },
    { name: 'Abyss Knight', type: 'undead', immunities: [{ element: 'lightning', value: 100, starred: false }] },
    { name: 'Grotesque', type: 'demon', immunities: [{ element: 'cold', value: 160, starred: true }] },
    { name: 'Grotesque Wyrm', type: 'demon', immunities: [{ element: 'cold', value: 160, starred: true }] },
  ]},
  { areaName: 'The Chaos Sanctuary', monsters: [
    { name: 'Venom Lord', type: 'demon', immunities: [{ element: 'fire', value: 130, starred: true }] },
    { name: 'Storm Caster', type: 'undead', immunities: [{ element: 'lightning', value: 100, starred: false }] },
    { name: 'Oblivion Knight', type: 'undead', immunities: [{ element: 'cold', value: 180, starred: true }] },
    { name: 'Doom Knight', type: 'undead', immunities: [{ element: 'fire', value: 110, starred: false }] },
  ]},
  { areaName: 'Abaddon', monsters: [
    { name: 'Balrog', type: 'demon', immunities: [{ element: 'fire', value: 140, starred: true }] },
    { name: 'Hell Temptress', type: 'demon', immunities: [] },
    { name: 'Blood Lord', type: 'animal', immunities: [{ element: 'physical', value: 100, starred: false }] },
    { name: 'Strangler', type: 'undead', immunities: [{ element: 'lightning', value: 100, starred: false }] },
    { name: 'Demon Imp', type: 'demon', immunities: [{ element: 'fire', value: 110, starred: false }] },
    { name: 'Dark Shaman', type: 'demon', immunities: [] },
    { name: 'Dark One', type: 'demon', immunities: [] },
    { name: 'Hell Witch', type: 'demon', immunities: [{ element: 'cold', value: 145, starred: true }] },
    { name: 'Undead Stygian Doll', type: 'undead', immunities: [{ element: 'poison', value: 105, starred: false }] },
    { name: 'Horror Archer', type: 'undead', immunities: [{ element: 'poison', value: 140, starred: true }] },
    { name: 'Hell Spawn', type: 'animal', immunities: [{ element: 'fire', value: 110, starred: false }] },
  ]},
  { areaName: 'Pit of Acheron', monsters: [
    { name: 'Balrog', type: 'demon', immunities: [{ element: 'fire', value: 140, starred: true }] },
    { name: 'Maw Fiend', type: 'demon', immunities: [{ element: 'poison', value: 110, starred: false }] },
    { name: 'Unraveler', type: 'undead', immunities: [{ element: 'magic', value: 100, starred: false }] },
    { name: 'Hell Temptress', type: 'demon', immunities: [] },
    { name: 'Hell Clan', type: 'demon', immunities: [{ element: 'cold', value: 155, starred: true }] },
    { name: 'Burning Dead Mage', type: 'undead', immunities: [{ element: 'fire', value: 130, starred: true }, { element: 'poison', value: 110, starred: false }] },
    { name: 'Blood Lord', type: 'animal', immunities: [{ element: 'physical', value: 100, starred: false }] },
    { name: 'Mauler', type: 'demon', immunities: [] },
    { name: 'Demon Imp', type: 'demon', immunities: [{ element: 'fire', value: 110, starred: false }] },
    { name: 'Salamander', type: 'animal', immunities: [{ element: 'fire', value: 115, starred: false }] },
  ]},
  { areaName: 'Drifter Cavern', monsters: [
    { name: 'Succubus', type: 'demon', immunities: [] },
    { name: 'Infidel', type: 'animal', immunities: [{ element: 'cold', value: 150, starred: true }] },
    { name: 'Moon Lord', type: 'animal', immunities: [{ element: 'fire', value: 140, starred: true }] },
    { name: 'Abominable', type: 'animal', immunities: [{ element: 'cold', value: 170, starred: true }] },
    { name: 'Frozen Terror', type: 'animal', immunities: [{ element: 'cold', value: 160, starred: true }] },
    { name: 'Afflicted', type: 'demon', immunities: [{ element: 'lightning', value: 100, starred: false }] },
    { name: 'Night Clan', type: 'demon', immunities: [{ element: 'cold', value: 135, starred: true }] },
    { name: 'Ghost', type: 'undead', immunities: [{ element: 'poison', value: 100, starred: false }, { element: 'physical', value: 100, starred: false }] },
    { name: 'Dark Archer', type: 'demon', immunities: [{ element: 'cold', value: 140, starred: true }] },
    { name: 'Bone Mage', type: 'undead', immunities: [{ element: 'cold', value: 160, starred: true }, { element: 'poison', value: 110, starred: false }] },
  ]},
  { areaName: 'Infernal Pit', monsters: [
    { name: 'Balrog', type: 'demon', immunities: [{ element: 'fire', value: 140, starred: true }] },
    { name: 'Unholy Corpse', type: 'undead', immunities: [{ element: 'poison', value: 120, starred: true }] },
    { name: 'Blood Boss', type: 'demon', immunities: [{ element: 'cold', value: 150, starred: true }] },
    { name: 'Fire Boar', type: 'animal', immunities: [{ element: 'fire', value: 110, starred: false }] },
    { name: 'Oblivion Knight', type: 'undead', immunities: [{ element: 'cold', value: 140, starred: true }] },
    { name: 'Doom Knight', type: 'undead', immunities: [{ element: 'fire', value: 130, starred: true }] },
    { name: 'Night Lord', type: 'animal', immunities: [{ element: 'lightning', value: 100, starred: false }] },
    { name: 'Blood Lord', type: 'undead', immunities: [{ element: 'cold', value: 125, starred: true }] },
    { name: 'Stygian Doll', type: 'demon', immunities: [{ element: 'fire', value: 110, starred: false }] },
    { name: 'Hell Witch', type: 'demon', immunities: [{ element: 'cold', value: 160, starred: true }] },
    { name: 'Demon Trickster', type: 'demon', immunities: [{ element: 'fire', value: 115, starred: false }] },
    { name: 'Salamander', type: 'animal', immunities: [{ element: 'fire', value: 115, starred: false }] },
  ]},
  { areaName: 'Icy Cellar', monsters: [
    { name: 'Undead Stygian Doll', type: 'undead', immunities: [{ element: 'poison', value: 120, starred: true }] },
    { name: 'Gloam', type: 'undead', immunities: [{ element: 'lightning', value: 100, starred: false }, { element: 'poison', value: 105, starred: false }] },
    { name: 'Siren', type: 'demon', immunities: [{ element: 'cold', value: 125, starred: true }] },
    { name: 'Hell Temptress', type: 'demon', immunities: [{ element: 'physical', value: 100, starred: false }] },
    { name: 'Abominable', type: 'animal', immunities: [{ element: 'cold', value: 170, starred: true }] },
    { name: 'Frozen Terror', type: 'animal', immunities: [{ element: 'cold', value: 160, starred: true }] },
    { name: 'Gloombat', type: 'animal', immunities: [{ element: 'lightning', value: 100, starred: false }] },
    { name: 'Pit Viper', type: 'animal', immunities: [{ element: 'cold', value: 145, starred: true }, { element: 'poison', value: 110, starred: false }] },
    { name: 'Ghost', type: 'undead', immunities: [{ element: 'poison', value: 100, starred: false }, { element: 'physical', value: 100, starred: false }] },
    { name: 'Hell Lord', type: 'animal', immunities: [{ element: 'lightning', value: 100, starred: false }] },
  ]},
  { areaName: 'Worldstone Keep Level 1', monsters: [
    { name: 'Unholy Corpse', type: 'undead', immunities: [{ element: 'poison', value: 120, starred: true }] },
    { name: 'Vile Witch', type: 'demon', immunities: [{ element: 'cold', value: 155, starred: true }] },
    { name: 'Invader', type: 'animal', immunities: [{ element: 'cold', value: 160, starred: true }] },
    { name: 'Soul Killer Shaman', type: 'demon', immunities: [{ element: 'fire', value: 130, starred: true }] },
    { name: 'Soul Killer', type: 'demon', immunities: [{ element: 'fire', value: 115, starred: false }] },
    { name: 'Fetid Defiler', type: 'demon', immunities: [{ element: 'poison', value: 110, starred: false }] },
    { name: 'Black Lancer', type: 'demon', immunities: [{ element: 'lightning', value: 100, starred: false }] },
    { name: 'Hierophant', type: 'animal', immunities: [] },
    { name: 'Zealot', type: 'animal', immunities: [{ element: 'lightning', value: 100, starred: false }] },
    { name: 'Death Lord', type: 'animal', immunities: [{ element: 'fire', value: 120, starred: true }] },
    { name: 'Flesh Spawner', type: 'demon', immunities: [{ element: 'cold', value: 145, starred: true }] },
    { name: 'Flesh Beast', type: 'demon', immunities: [{ element: 'cold', value: 145, starred: true }] },
    { name: 'Ghoul Lord', type: 'undead', immunities: [{ element: 'cold', value: 130, starred: true }] },
  ]},
  { areaName: 'Worldstone Keep Level 2', monsters: [
    { name: 'Black Soul', type: 'undead', immunities: [{ element: 'lightning', value: 100, starred: false }, { element: 'poison', value: 110, starred: false }] },
    { name: 'Greater Hell Spawn', type: 'animal', immunities: [{ element: 'cold', value: 135, starred: true }] },
    { name: 'Horadrim Ancient', type: 'undead', immunities: [{ element: 'magic', value: 100, starred: false }] },
    { name: 'Fiend', type: 'animal', immunities: [{ element: 'lightning', value: 100, starred: false }] },
    { name: 'Steel Scarab', type: 'animal', immunities: [{ element: 'lightning', value: 100, starred: false }] },
    { name: 'Soul Killer', type: 'demon', immunities: [{ element: 'fire', value: 115, starred: false }] },
    { name: 'Horror Mage', type: 'undead', immunities: [] },
    { name: 'Cadaver', type: 'undead', immunities: [{ element: 'poison', value: 130, starred: true }] },
    { name: 'Serpent Magus', type: 'animal', immunities: [{ element: 'poison', value: 115, starred: true }] },
    { name: 'Frenzied Ice Spawn', type: 'animal', immunities: [{ element: 'cold', value: 150, starred: true }] },
  ]},
  { areaName: 'Worldstone Keep Level 3', monsters: [
    { name: 'Horror Mage', type: 'undead', immunities: [{ element: 'lightning', value: 130, starred: true }, { element: 'poison', value: 110, starred: false }] },
    { name: 'Hell Temptress', type: 'demon', immunities: [{ element: 'physical', value: 100, starred: false }] },
    { name: 'Blood Boss', type: 'demon', immunities: [{ element: 'cold', value: 150, starred: true }] },
    { name: 'Fire Boar', type: 'animal', immunities: [{ element: 'fire', value: 110, starred: false }] },
    { name: 'Storm Caster', type: 'undead', immunities: [{ element: 'lightning', value: 100, starred: false }] },
    { name: 'Demon Sprite', type: 'demon', immunities: [{ element: 'fire', value: 120, starred: true }] },
    { name: 'Oblivion Knight', type: 'undead', immunities: [{ element: 'cold', value: 145, starred: true }] },
    { name: 'Doom Knight', type: 'undead', immunities: [{ element: 'fire', value: 140, starred: true }] },
    { name: 'Soul Killer', type: 'demon', immunities: [{ element: 'fire', value: 115, starred: false }] },
    { name: 'Specter', type: 'undead', immunities: [{ element: 'poison', value: 100, starred: false }, { element: 'physical', value: 100, starred: false }] },
    { name: 'Rancid Defiler', type: 'demon', immunities: [{ element: 'poison', value: 115, starred: true }] },
    { name: 'Death Lord', type: 'animal', immunities: [{ element: 'fire', value: 120, starred: true }] },
  ]},
  { areaName: 'Throne of Destruction', monsters: [
    { name: 'Horadrim Ancient', type: 'undead', immunities: [{ element: 'magic', value: 100, starred: false }] },
    { name: 'Pit Lord', type: 'demon', immunities: [{ element: 'fire', value: 145, starred: true }] },
    { name: 'Oblivion Knight', type: 'undead', immunities: [{ element: 'cold', value: 145, starred: true }] },
    { name: 'Doom Knight', type: 'undead', immunities: [{ element: 'fire', value: 140, starred: true }] },
    { name: 'Dark Lord', type: 'undead', immunities: [{ element: 'cold', value: 135, starred: true }] },
    { name: 'Assailant', type: 'animal', immunities: [{ element: 'fire', value: 130, starred: true }] },
    { name: 'Serpent Magus', type: 'animal', immunities: [{ element: 'poison', value: 115, starred: true }] },
    { name: 'Burning Soul', type: 'undead', immunities: [{ element: 'lightning', value: 100, starred: false }, { element: 'poison', value: 115, starred: true }] },
    { name: 'Hell Witch', type: 'demon', immunities: [{ element: 'cold', value: 160, starred: true }] },
    { name: 'Undead Soul Killer', type: 'undead', immunities: [{ element: 'poison', value: 110, starred: false }] },
    { name: 'Death Lord', type: 'animal', immunities: [{ element: 'fire', value: 120, starred: true }] },
  ]},
  { areaName: 'The Worldstone Chamber', monsters: [] },
];
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/lib/grail/alvl85Areas.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Write the failing component test**

Create `src/components/items/Alvl85AreaList.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import Alvl85AreaList from './Alvl85AreaList';
import messages from '../../../messages/en.json';
import type { Alvl85Area } from '@/lib/grail/alvl85Areas';

describe('Alvl85AreaList', () => {
  it('renders area name, monster name/type, and starred immunity', () => {
    const areas: Alvl85Area[] = [{
      areaName: 'Ruined Temple',
      monsters: [{ name: 'Night Lord', type: 'undead', immunities: [{ element: 'cold', value: 120, starred: true }] }],
    }];
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <Alvl85AreaList areas={areas} />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('Ruined Temple')).toBeInTheDocument();
    expect(screen.getByText('Night Lord')).toBeInTheDocument();
    expect(screen.getByText('Undead')).toBeInTheDocument();
    expect(screen.getByText(/Co 120/)).toBeInTheDocument();
    expect(screen.getByText(/★/)).toBeInTheDocument();
  });

  it('renders a monster with no immunities without error', () => {
    const areas: Alvl85Area[] = [{
      areaName: 'The Worldstone Chamber',
      monsters: [],
    }];
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <Alvl85AreaList areas={areas} />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('The Worldstone Chamber')).toBeInTheDocument();
  });
});
```

- [ ] **Step 7: Run test to verify it fails**

Run: `npx vitest run src/components/items/Alvl85AreaList.test.tsx`
Expected: FAIL — module doesn't exist.

- [ ] **Step 8: Implement `Alvl85AreaList`**

Create `src/components/items/Alvl85AreaList.tsx`:

```tsx
import { useTranslations } from 'next-intl';
import type { Alvl85Area } from '@/lib/grail/alvl85Areas';

export default function Alvl85AreaList({ areas }: { areas: Alvl85Area[] }) {
  const t = useTranslations('Items');

  return (
    <div className="flex flex-col gap-6 w-full">
      <p className="text-xs text-zinc-500">{t('alvl85StarNote')}</p>
      {areas.map(area => (
        <div key={area.areaName} className="bg-zinc-900 border border-zinc-700 rounded-xl p-6">
          <h3 className="text-lg font-bold text-zinc-100 mb-3">{area.areaName}</h3>
          {area.monsters.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left text-xs uppercase text-zinc-500 pb-2">{t('alvl85MonsterLabel')}</th>
                  <th className="text-left text-xs uppercase text-zinc-500 pb-2 px-3">{t('alvl85TypeLabel')}</th>
                  <th className="text-left text-xs uppercase text-zinc-500 pb-2 px-3">{t('alvl85ImmunityLabel')}</th>
                </tr>
              </thead>
              <tbody className="text-zinc-300">
                {area.monsters.map((monster, i) => (
                  <tr key={`${monster.name}-${i}`}>
                    <td className="py-1 text-zinc-100 font-semibold">{monster.name}</td>
                    <td className="py-1 px-3">{t(`alvl85Type_${monster.type}`)}</td>
                    <td className="py-1 px-3">
                      {monster.immunities.map(imm => (
                        <span key={imm.element} className="mr-3">
                          {t(`alvl85Element_${imm.element}`)} {imm.value}{imm.starred ? ' ★' : ''}
                        </span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 9: Run tests to verify they pass**

Run: `npx vitest run src/components/items/Alvl85AreaList.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 10: Wire the page**

Modify `src/app/[locale]/monster/alvl85/page.tsx`:

```tsx
import { routing } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ALVL85_AREAS } from '@/lib/grail/alvl85Areas';
import Alvl85AreaList from '@/components/items/Alvl85AreaList';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export default async function Alvl85AreasPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Items');

  return (
    <main className="flex flex-col items-center py-10 px-4 gap-6 flex-1 w-full">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">{t('alvl85PageTitle')}</h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-md">{t('alvl85PageSubtitle')}</p>
      </div>
      <div className="w-full max-w-4xl">
        <Alvl85AreaList areas={ALVL85_AREAS} />
      </div>
    </main>
  );
}
```

- [ ] **Step 11: Run full verification and commit**

Run: `npx tsc --noEmit && npm run lint && npm test && npm run build`
Expected: all clean. Confirm `out/en/monster/alvl85/index.html` (and zh-TW/zh-CN
equivalents) exist with real content.

```bash
git add messages/en.json messages/zh-TW.json messages/zh-CN.json src/lib/grail/alvl85Areas.ts src/lib/grail/alvl85Areas.test.ts src/components/items/Alvl85AreaList.tsx src/components/items/Alvl85AreaList.test.tsx "src/app/[locale]/monster/alvl85/page.tsx"
git commit -m "Add Alvl85 Areas page"
```

---

### Task 2: Full verification + d2r.world spot-check

**Files:**
- Create: `docs/superpowers/specs/2026-07-16-alvl85-areas-verification.md`

- [ ] **Step 1: Build and run full automated verification**

```bash
npx tsc --noEmit && npm run lint && npm test && npm run build
```
Expected: all clean.

- [ ] **Step 2: Manual + d2r.world spot-check**

Serve the static export locally. Navigate to `/en/monster/alvl85`. Confirm at least 6
areas' monster/type/immunity lists match d2r.world's real content exactly (including the
★ marker), and confirm the "Night Lord" case renders correctly in both places (Undead in
Ruined Temple, Animal in Infernal Pit). Check in zh-TW and zh-CN locales too. Check at
both desktop and mobile widths via `resize_window`.

- [ ] **Step 3: Write the verification doc and commit**

Follow the format of prior verification docs in this project. Commit it.
