// Hand-drawn line-art category icons, styled after a reference mobile-app
// "Tools" grid the user shared (simple single-color stroke icons, easy to
// read at a glance) rather than loading an arbitrary specific in-game item
// icon to stand in for an entire category. Deliberately generic/symbolic --
// e.g. every blunt weapon (club/mace/hammer/scepter) shares one "mace" icon
// --  so the set stays small and visually consistent instead of trying to
// pick one "representative" real item per category (which is often an
// arbitrary and sometimes-misleading choice, as it was before this).
import type { SVGProps } from 'react';

export type CategoryIconName =
  | 'sword' | 'axe' | 'mace' | 'polearm' | 'bow' | 'crossbow' | 'javelin'
  | 'staff' | 'shield' | 'helm' | 'armor' | 'belt' | 'boots' | 'gloves'
  | 'ring' | 'amulet' | 'charm' | 'jewel'
  | 'gem' | 'rune' | 'scroll' | 'potion' | 'socket' | 'upgrade' | 'repair'
  | 'dice' | 'cube' | 'sparkleCharm';

const PATHS: Record<CategoryIconName, string> = {
  sword: 'M12 2v13M9 15h6l-1 3h-4l-1-3ZM12 2l-2.2 2.2M12 2l2.2 2.2M9.5 19.5l-2 2M14.5 19.5l2 2',
  axe: 'M15 3c3 0 5 2 5 5-3 0-5-1-6-3l-1-2 2 0ZM13 5 5 21M8 17l3 2',
  mace: 'M9 4h6v5a3 3 0 0 1-3 3 3 3 0 0 1-3-3V4ZM12 12v9M8.5 21h7',
  polearm: 'M12 2v18M8 4h8l-4 4-4-4ZM9 21h6',
  bow: 'M6 3c8 3 8 15 0 18M6 3l14 9L6 21M6 3v18',
  crossbow: 'M3 12h14M3 9l4 3-4 3M17 6v12M13 6v12M9 8v8',
  javelin: 'M3 21 19 5M15 3l4 2-2 4-4-2 2-4ZM4 20l1.5-3.5',
  staff: 'M12 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6ZM12 8v14',
  shield: 'M12 2 4 5v6c0 6 4 9 8 11 4-2 8-5 8-11V5l-8-3Z',
  helm: 'M4 13a8 8 0 0 1 16 0v3H4v-3ZM4 16h16v2H4zM12 5v3',
  armor: 'M7 3h10l1 4-3 2v11H9V9L6 7l1-4Z',
  belt: 'M3 11h5v3H3zM16 11h5v3h-5zM8 11h8v3H8zM10.5 12.5h3v0',
  boots: 'M9 3h4v9l4 3v3H5v-4c0-2 1-3 2-4l2-1V3Z',
  gloves: 'M6 11V6a1.5 1.5 0 0 1 3 0v3M9 9V5a1.5 1.5 0 0 1 3 0v4M12 9V5a1.5 1.5 0 0 1 3 0v4M15 9.5V7a1.5 1.5 0 0 1 3 0v6c0 4-2 7-6 7H9c-3 0-5-2-5-5v-3l3-2',
  ring: 'M12 22a5 5 0 1 1 0-10 5 5 0 0 1 0 10ZM9.5 12 12 2l2.5 10',
  amulet: 'M12 2 6 8l6 6 6-6-6-6ZM12 14v8M9 22h6',
  charm: 'M12 2v3M9 5h6l1.5 3.5L12 15 7.5 8.5 9 5ZM12 15v7',
  jewel: 'M6 9h12l-6 12L6 9ZM3 9l3-5h12l3 5M9 4l-3 5 6 12 6-12-3-5',
  gem: 'M12 3 4 9l8 12 8-12-8-6ZM4 9h16M9 9l3-6 3 6',
  rune: 'M6 3v18M6 3l12 6-12 6M6 15l8 6',
  scroll: 'M6 3h9a3 3 0 0 1 3 3v12a3 3 0 0 0 3 3M6 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h12M9 8h6M9 12h6',
  potion: 'M10 2h4v4l3 5v6a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3v-6l3-5V2ZM8.5 15h7',
  socket: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
  upgrade: 'M12 21V6M6 12l6-6 6 6M5 21h14',
  repair: 'M17 2 8.5 10.5a3.5 3.5 0 1 0 5 5L22 7l-3-3-2.5 2.5-2-2L17 2ZM4 20l3-3',
  dice: 'M4 8 12 4l8 4v8l-8 4-8-4V8ZM4 8l8 4 8-4M12 12v8M8 6.5a1 1 0 1 0 0 .01ZM16 6.5a1 1 0 1 0 0 .01Z',
  cube: 'M12 2 3 7l9 5 9-5-9-5ZM3 7v10l9 5 9-5V7M12 12v10',
  sparkleCharm: 'M12 3v3M9 6h6l1.5 3.5L12 16 7.5 9.5 9 6ZM12 16v6M18 3l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2Z',
};

export default function CategoryIconArt({
  name, className, ...props
}: { name: CategoryIconName; className?: string } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

// Cube-recipe category page (10 categories).
export const CUBE_RECIPE_CATEGORY_ICON: Record<string, CategoryIconName> = {
  gemUpgrade: 'gem',
  runeUpgrade: 'rune',
  quests: 'scroll',
  consumables: 'potion',
  sockets: 'socket',
  itemUpgrade: 'upgrade',
  itemRepair: 'repair',
  magicItemRerolls: 'dice',
  magicItemCreation: 'cube',
  craftedGrandCharm: 'sparkleCharm',
};

// Item-listing category pages (Unique/Set/Rare/Magic/Base, grouped by
// equipment slot/weapon type) -- deliberately reuses one icon across closely
// related subtypes (e.g. every one-handed blunt weapon shares "mace") so the
// icon says "this is a mace-family item" rather than trying to distinguish
// a Mace from a Scepter from a War Hammer at a glance.
export const ITEM_CATEGORY_ICON: Record<string, CategoryIconName> = {
  swords: 'sword',
  daggers: 'sword',
  katars: 'sword',
  assassinKatars: 'sword',
  axes: 'axe',
  throwingAxes: 'axe',
  clubs: 'mace',
  maces: 'mace',
  hammers: 'mace',
  scepters: 'mace',
  polearms: 'polearm',
  spears: 'polearm',
  amazonSpears: 'polearm',
  bows: 'bow',
  amazonBows: 'bow',
  crossbows: 'crossbow',
  javelins: 'javelin',
  amazonJavelins: 'javelin',
  throwings: 'javelin',
  throwingKnives: 'javelin',
  staves: 'staff',
  wands: 'staff',
  grimoires: 'staff',
  orbs: 'staff',
  shields: 'shield',
  paladinShields: 'shield',
  helms: 'helm',
  barbarianHelms: 'helm',
  druidHelms: 'helm',
  circlets: 'helm',
  shrunkenHeads: 'helm',
  armors: 'armor',
  belts: 'belt',
  boots: 'boots',
  gloves: 'gloves',
  rings: 'ring',
  amulets: 'amulet',
  charms: 'charm',
  smallCharms: 'charm',
  largeCharms: 'charm',
  grandCharms: 'charm',
  jewels: 'jewel',
};
