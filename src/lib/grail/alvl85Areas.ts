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
