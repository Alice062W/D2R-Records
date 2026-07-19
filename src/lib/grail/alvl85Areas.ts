export type MonsterType = 'animal' | 'demon' | 'undead';
export type Element = 'fire' | 'cold' | 'lightning' | 'poison' | 'magic' | 'physical';

export interface MonsterImmunity {
  element: Element;
  value: number;
  starred: boolean;
}

export interface Alvl85Monster {
  name: { en: string; 'zh-TW': string; 'zh-CN': string };
  type: MonsterType;
  immunities: MonsterImmunity[];
}

export interface Alvl85Area {
  areaName: { en: string; 'zh-TW': string; 'zh-CN': string };
  monsters: Alvl85Monster[];
}

// Hand-transcribed from d2r.world (https://d2r.world/en-US/info/monster/alvl85), this
// session, per this project's established policy for curated/deterministic content with
// no reliable raw-data equivalent (levels.json's per-area monster-list fields were found
// incomplete for several areas during design research — see the design spec). Star (★)
// threshold: Fire/Cold/Lightning >= 117, Poison >= 112 (also copied from d2r.world).
export const ALVL85_AREAS: Alvl85Area[] = [
  { areaName: { en: 'Mausoleum', 'zh-TW': '大陵墓', 'zh-CN': '大陵墓' }, monsters: [
    { name: { en: 'Skeleton', 'zh-TW': '骷髏', 'zh-CN': '骷髅' }, type: 'undead', immunities: [{ element: 'lightning', value: 100, starred: false }] },
    { name: { en: 'Hungry Dead', 'zh-TW': '飢餓死者', 'zh-CN': '饥饿死者' }, type: 'undead', immunities: [{ element: 'lightning', value: 110, starred: false }] },
  ]},
  { areaName: { en: 'Underground Passage Level 2', 'zh-TW': '地底通道第二層', 'zh-CN': '地底通道第二层' }, monsters: [
    { name: { en: 'Carver', 'zh-TW': '刨肉沉淪魔', 'zh-CN': '刨肉沉沦魔' }, type: 'demon', immunities: [{ element: 'fire', value: 110, starred: false }] },
    { name: { en: 'Misshapen', 'zh-TW': '畸形魔汙怪', 'zh-CN': '畸形魔污怪' }, type: 'demon', immunities: [{ element: 'lightning', value: 110, starred: false }] },
    { name: { en: 'Skeleton Archer', 'zh-TW': '骷髏弓箭手', 'zh-CN': '骷髅弓箭手' }, type: 'undead', immunities: [{ element: 'poison', value: 100, starred: false }] },
    { name: { en: 'Vile Hunter', 'zh-TW': '兇邪獵手', 'zh-CN': '凶邪猎手' }, type: 'demon', immunities: [{ element: 'cold', value: 120, starred: true }] },
  ]},
  { areaName: { en: 'Pit Level 1', 'zh-TW': '地穴第一層', 'zh-CN': '地穴第一层' }, monsters: [
    { name: { en: 'Dark Stalker', 'zh-TW': '黑暗潛襲者', 'zh-CN': '黑暗潜袭者' }, type: 'demon', immunities: [{ element: 'cold', value: 130, starred: true }] },
    { name: { en: 'Devilkin', 'zh-TW': '魔妖沉淪魔', 'zh-CN': '魔妖沉沦魔' }, type: 'demon', immunities: [{ element: 'fire', value: 120, starred: true }] },
    { name: { en: 'Bone Warrior', 'zh-TW': '骸骨戰士', 'zh-CN': '骸骨战士' }, type: 'undead', immunities: [{ element: 'cold', value: 110, starred: false }] },
    { name: { en: 'Dark Archer', 'zh-TW': '黑暗弓箭手', 'zh-CN': '黑暗弓箭手' }, type: 'demon', immunities: [{ element: 'lightning', value: 110, starred: false }] },
  ]},
  { areaName: { en: 'Pit Level 2', 'zh-TW': '地穴第二層', 'zh-CN': '地穴第二层' }, monsters: [
    { name: { en: 'Dark Stalker', 'zh-TW': '黑暗潛襲者', 'zh-CN': '黑暗潜袭者' }, type: 'demon', immunities: [{ element: 'cold', value: 130, starred: true }] },
    { name: { en: 'Devilkin', 'zh-TW': '魔妖沉淪魔', 'zh-CN': '魔妖沉沦魔' }, type: 'demon', immunities: [{ element: 'fire', value: 120, starred: true }] },
    { name: { en: 'Bone Warrior', 'zh-TW': '骸骨戰士', 'zh-CN': '骸骨战士' }, type: 'undead', immunities: [{ element: 'cold', value: 110, starred: false }] },
    { name: { en: 'Dark Archer', 'zh-TW': '黑暗弓箭手', 'zh-CN': '黑暗弓箭手' }, type: 'demon', immunities: [{ element: 'lightning', value: 110, starred: false }] },
  ]},
  { areaName: { en: 'Stony Tomb Level 1', 'zh-TW': '古老石墓第一層', 'zh-CN': '古老石墓第一层' }, monsters: [
    { name: { en: 'Horror', 'zh-TW': '恐骨骷髏', 'zh-CN': '恐骨骷髅' }, type: 'undead', immunities: [{ element: 'lightning', value: 120, starred: true }] },
    { name: { en: 'Burning Dead Mage', 'zh-TW': '烈焰骷髏法師', 'zh-CN': '烈焰骷髅法师' }, type: 'undead', immunities: [{ element: 'lightning', value: 110, starred: false }] },
    { name: { en: 'Dung Soldier', 'zh-TW': '蜣螂兵蟲', 'zh-CN': '蜣螂兵虫' }, type: 'animal', immunities: [{ element: 'lightning', value: 100, starred: false }] },
  ]},
  { areaName: { en: 'Stony Tomb Level 2', 'zh-TW': '古老石墓第二層', 'zh-CN': '古老石墓第二层' }, monsters: [
    { name: { en: 'Horror', 'zh-TW': '恐骨骷髏', 'zh-CN': '恐骨骷髅' }, type: 'undead', immunities: [{ element: 'lightning', value: 120, starred: true }] },
    { name: { en: 'Dung Soldier', 'zh-TW': '蜣螂兵蟲', 'zh-CN': '蜣螂兵虫' }, type: 'animal', immunities: [{ element: 'lightning', value: 100, starred: false }] },
    { name: { en: 'Burning Dead Mage', 'zh-TW': '烈焰骷髏法師', 'zh-CN': '烈焰骷髅法师' }, type: 'undead', immunities: [] },
  ]},
  { areaName: { en: 'Maggot Lair Level 3', 'zh-TW': '蛆蟲巢穴第三層', 'zh-CN': '蛆虫巢穴第三层' }, monsters: [
    { name: { en: 'Rock Worm', 'zh-TW': '鑽岩蛆蟲', 'zh-CN': '钻岩蛆虫' }, type: 'animal', immunities: [{ element: 'poison', value: 110, starred: false }] },
    { name: { en: 'Rock Worm Egg', 'zh-TW': '鑽岩蛆蟲之卵', 'zh-CN': '钻岩蛆虫之卵' }, type: 'animal', immunities: [] },
    { name: { en: 'Black Locusts', 'zh-TW': '黑色蝗蟲', 'zh-CN': '黑色蝗虫' }, type: 'animal', immunities: [{ element: 'physical', value: 100, starred: false }] },
    { name: { en: 'Sand Maggot', 'zh-TW': '沙漠蛆蟲', 'zh-CN': '沙漠蛆虫' }, type: 'animal', immunities: [{ element: 'poison', value: 105, starred: false }] },
    { name: { en: 'Sand Maggot Egg', 'zh-TW': '沙漠蛆蟲之卵', 'zh-CN': '沙漠蛆虫之卵' }, type: 'animal', immunities: [] },
    { name: { en: 'Scarab', 'zh-TW': '惡魔甲蟲', 'zh-CN': '恶魔甲虫' }, type: 'animal', immunities: [{ element: 'lightning', value: 110, starred: false }] },
    { name: { en: 'Death Beetle', 'zh-TW': '死亡甲蟲', 'zh-CN': '死亡甲虫' }, type: 'animal', immunities: [{ element: 'lightning', value: 105, starred: false }] },
  ]},
  { areaName: { en: 'Ancient Tunnels', 'zh-TW': '古代通道', 'zh-CN': '古代通道' }, monsters: [
    { name: { en: 'Plague Bearer', 'zh-TW': '瘟疫散布者', 'zh-CN': '瘟疫散布者' }, type: 'undead', immunities: [{ element: 'magic', value: 100, starred: false }] },
    { name: { en: 'Horror Mage', 'zh-TW': '恐骨法師', 'zh-CN': '恐骨法师' }, type: 'undead', immunities: [{ element: 'lightning', value: 115, starred: false }] },
    { name: { en: 'Embalmed', 'zh-TW': '防腐木乃伊', 'zh-CN': '防腐木乃伊' }, type: 'undead', immunities: [{ element: 'poison', value: 105, starred: false }] },
    { name: { en: 'Invader', 'zh-TW': '入侵者', 'zh-CN': '入侵者' }, type: 'animal', immunities: [{ element: 'fire', value: 110, starred: false }] },
  ]},
  { areaName: { en: 'Arachnid Lair', 'zh-TW': '蜘蛛巢穴', 'zh-CN': '蜘蛛巢穴' }, monsters: [
    { name: { en: 'Flame Spider', 'zh-TW': '火焰蜘蛛', 'zh-CN': '火焰蜘蛛' }, type: 'animal', immunities: [{ element: 'fire', value: 115, starred: false }] },
    { name: { en: 'Poison Spinner', 'zh-TW': '劇毒紡織者', 'zh-CN': '剧毒纺织者' }, type: 'animal', immunities: [{ element: 'poison', value: 110, starred: false }] },
    { name: { en: 'Fiend', 'zh-TW': '魔蝠', 'zh-CN': '魔蝠' }, type: 'animal', immunities: [{ element: 'lightning', value: 110, starred: false }] },
    { name: { en: 'Giant Lamprey', 'zh-TW': '吸血巨蟲', 'zh-CN': '吸血巨虫' }, type: 'animal', immunities: [{ element: 'poison', value: 120, starred: true }] },
    { name: { en: 'Giant Lamprey Egg', 'zh-TW': '吸血巨蟲之卵', 'zh-CN': '吸血巨虫之卵' }, type: 'animal', immunities: [] },
  ]},
  { areaName: { en: 'Swampy Pit Level 1', 'zh-TW': '沼澤地穴第一層', 'zh-CN': '沼泽地穴第一层' }, monsters: [
    { name: { en: 'Undead Stygian Doll', 'zh-TW': '不死冥河鬼娃', 'zh-CN': '不死冥河鬼娃' }, type: 'undead', immunities: [{ element: 'poison', value: 120, starred: true }] },
    { name: { en: 'Preserved Dead', 'zh-TW': '長存木乃伊', 'zh-CN': '长存木乃伊' }, type: 'undead', immunities: [{ element: 'poison', value: 105, starred: false }] },
    { name: { en: 'Undead Soul Killer', 'zh-TW': '不死靈魂殺手', 'zh-CN': '不死灵魂杀手' }, type: 'undead', immunities: [{ element: 'poison', value: 115, starred: true }] },
    { name: { en: 'Gloam', 'zh-TW': '薄暮鬼火', 'zh-CN': '薄暮鬼火' }, type: 'undead', immunities: [{ element: 'lightning', value: 100, starred: false }] },
    { name: { en: 'Fiend', 'zh-TW': '魔蝠', 'zh-CN': '魔蝠' }, type: 'animal', immunities: [{ element: 'lightning', value: 110, starred: false }] },
  ]},
  { areaName: { en: 'Swampy Pit Level 2', 'zh-TW': '沼澤地穴第二層', 'zh-CN': '沼泽地穴第二层' }, monsters: [
    { name: { en: 'Undead Stygian Doll', 'zh-TW': '不死冥河鬼娃', 'zh-CN': '不死冥河鬼娃' }, type: 'undead', immunities: [{ element: 'poison', value: 120, starred: true }] },
    { name: { en: 'Undead Soul Killer', 'zh-TW': '不死靈魂殺手', 'zh-CN': '不死灵魂杀手' }, type: 'undead', immunities: [{ element: 'poison', value: 115, starred: true }] },
    { name: { en: 'Gloam', 'zh-TW': '薄暮鬼火', 'zh-CN': '薄暮鬼火' }, type: 'undead', immunities: [{ element: 'lightning', value: 100, starred: false }] },
    { name: { en: 'Drowned Carcass', 'zh-TW': '溺斃死屍', 'zh-CN': '溺毙死尸' }, type: 'undead', immunities: [{ element: 'fire', value: 110, starred: false }] },
    { name: { en: 'Fiend', 'zh-TW': '魔蝠', 'zh-CN': '魔蝠' }, type: 'animal', immunities: [{ element: 'lightning', value: 110, starred: false }] },
  ]},
  { areaName: { en: 'Swampy Pit Level 3', 'zh-TW': '沼澤地穴第三層', 'zh-CN': '沼泽地穴第三层' }, monsters: [
    { name: { en: 'Undead Stygian Doll', 'zh-TW': '不死冥河鬼娃', 'zh-CN': '不死冥河鬼娃' }, type: 'undead', immunities: [{ element: 'poison', value: 120, starred: true }] },
    { name: { en: 'Undead Soul Killer', 'zh-TW': '不死靈魂殺手', 'zh-CN': '不死灵魂杀手' }, type: 'undead', immunities: [{ element: 'poison', value: 115, starred: true }] },
    { name: { en: 'Gloam', 'zh-TW': '薄暮鬼火', 'zh-CN': '薄暮鬼火' }, type: 'undead', immunities: [{ element: 'lightning', value: 100, starred: false }] },
    { name: { en: 'Fiend', 'zh-TW': '魔蝠', 'zh-CN': '魔蝠' }, type: 'animal', immunities: [{ element: 'lightning', value: 110, starred: false }] },
  ]},
  { areaName: { en: 'Sewers Level 1', 'zh-TW': '下水道第一層', 'zh-CN': '下水道第一层' }, monsters: [
    { name: { en: 'Preserved Dead', 'zh-TW': '長存木乃伊', 'zh-CN': '长存木乃伊' }, type: 'undead', immunities: [{ element: 'poison', value: 105, starred: false }] },
    { name: { en: 'Undead Soul Killer', 'zh-TW': '不死靈魂殺手', 'zh-CN': '不死灵魂杀手' }, type: 'undead', immunities: [{ element: 'poison', value: 115, starred: true }] },
    { name: { en: 'Feeder', 'zh-TW': '餵血蚊', 'zh-CN': '喂血蚊' }, type: 'animal', immunities: [{ element: 'poison', value: 110, starred: false }] },
    { name: { en: 'Gloombat', 'zh-TW': '幽暗蝙蝠', 'zh-CN': '幽暗蝙蝠' }, type: 'animal', immunities: [{ element: 'cold', value: 100, starred: false }] },
    { name: { en: 'Horadrim Ancient', 'zh-TW': '赫拉迪姆古屍', 'zh-CN': '赫拉迪姆古尸' }, type: 'undead', immunities: [{ element: 'magic', value: 100, starred: false }] },
    { name: { en: 'Horror', 'zh-TW': '恐骨骷髏', 'zh-CN': '恐骨骷髅' }, type: 'undead', immunities: [{ element: 'lightning', value: 120, starred: true }] },
  ]},
  { areaName: { en: 'Sewers Level 2', 'zh-TW': '下水道第二層', 'zh-CN': '下水道第二层' }, monsters: [
    { name: { en: 'Preserved Dead', 'zh-TW': '長存木乃伊', 'zh-CN': '长存木乃伊' }, type: 'undead', immunities: [{ element: 'poison', value: 105, starred: false }] },
    { name: { en: 'Undead Soul Killer', 'zh-TW': '不死靈魂殺手', 'zh-CN': '不死灵魂杀手' }, type: 'undead', immunities: [{ element: 'poison', value: 115, starred: true }] },
    { name: { en: 'Slime Prince', 'zh-TW': '黏液蛙王', 'zh-CN': '黏液蛙王' }, type: 'animal', immunities: [{ element: 'poison', value: 110, starred: false }] },
    { name: { en: 'Blood Wing', 'zh-TW': '血翅蚊', 'zh-CN': '血翅蚊' }, type: 'animal', immunities: [{ element: 'poison', value: 120, starred: true }] },
    { name: { en: 'Horadrim Ancient', 'zh-TW': '赫拉迪姆古屍', 'zh-CN': '赫拉迪姆古尸' }, type: 'undead', immunities: [{ element: 'magic', value: 100, starred: false }] },
    { name: { en: 'Horror', 'zh-TW': '恐骨骷髏', 'zh-CN': '恐骨骷髅' }, type: 'undead', immunities: [{ element: 'lightning', value: 120, starred: true }] },
  ]},
  { areaName: { en: 'Ruined Temple', 'zh-TW': '荒廢的神殿', 'zh-CN': '荒废的神殿' }, monsters: [
    { name: { en: 'Flesh Hunter', 'zh-TW': '血肉獵人', 'zh-CN': '血肉猎人' }, type: 'demon', immunities: [{ element: 'cold', value: 150, starred: true }] },
    { name: { en: 'Spider Magus', 'zh-TW': '法毒蜘蛛', 'zh-CN': '法毒蜘蛛' }, type: 'animal', immunities: [{ element: 'fire', value: 120, starred: true }] },
    { name: { en: 'Wailing Beast', 'zh-TW': '尖嘯毛怪', 'zh-CN': '尖啸毛怪' }, type: 'animal', immunities: [{ element: 'magic', value: 100, starred: false }] },
    { name: { en: 'Night Lord', 'zh-TW': '暗夜鬼爵', 'zh-CN': '暗夜鬼爵' }, type: 'undead', immunities: [{ element: 'cold', value: 120, starred: true }] },
  ]},
  { areaName: { en: 'Disused Fane', 'zh-TW': '廢棄的寺院', 'zh-CN': '废弃的寺院' }, monsters: [
    { name: { en: 'Flesh Hunter', 'zh-TW': '血肉獵人', 'zh-CN': '血肉猎人' }, type: 'demon', immunities: [{ element: 'cold', value: 150, starred: true }] },
    { name: { en: 'Spider Magus', 'zh-TW': '法毒蜘蛛', 'zh-CN': '法毒蜘蛛' }, type: 'animal', immunities: [{ element: 'fire', value: 120, starred: true }] },
    { name: { en: 'Wailing Beast', 'zh-TW': '尖嘯毛怪', 'zh-CN': '尖啸毛怪' }, type: 'animal', immunities: [{ element: 'magic', value: 100, starred: false }] },
    { name: { en: 'Night Lord', 'zh-TW': '暗夜鬼爵', 'zh-CN': '暗夜鬼爵' }, type: 'undead', immunities: [{ element: 'cold', value: 120, starred: true }] },
  ]},
  { areaName: { en: 'Forgotten Temple', 'zh-TW': '遺忘神殿', 'zh-CN': '遗忘神殿' }, monsters: [
    { name: { en: 'Serpent Magus', 'zh-TW': '蛇魔法師', 'zh-CN': '蛇魔法师' }, type: 'animal', immunities: [{ element: 'cold', value: 120, starred: true }] },
    { name: { en: 'Blood Diver', 'zh-TW': '鮮血俯衝者', 'zh-CN': '鲜血俯冲者' }, type: 'animal', immunities: [{ element: 'fire', value: 105, starred: false }] },
    { name: { en: 'Flesh Archer', 'zh-TW': '血肉弓箭手', 'zh-CN': '血肉弓箭手' }, type: 'demon', immunities: [{ element: 'cold', value: 130, starred: true }] },
    { name: { en: 'Bone Scarab', 'zh-TW': '骸骨甲蟲', 'zh-CN': '骸骨甲虫' }, type: 'animal', immunities: [{ element: 'lightning', value: 120, starred: true }] },
  ]},
  { areaName: { en: 'Forgotten Reliquary', 'zh-TW': '遺忘的聖殿', 'zh-CN': '遗忘的圣殿' }, monsters: [
    { name: { en: 'Flesh Hunter', 'zh-TW': '血肉獵人', 'zh-CN': '血肉猎人' }, type: 'demon', immunities: [{ element: 'cold', value: 150, starred: true }] },
    { name: { en: 'Spider Magus', 'zh-TW': '法毒蜘蛛', 'zh-CN': '法毒蜘蛛' }, type: 'animal', immunities: [{ element: 'fire', value: 120, starred: true }] },
    { name: { en: 'Wailing Beast', 'zh-TW': '尖嘯毛怪', 'zh-CN': '尖啸毛怪' }, type: 'animal', immunities: [{ element: 'magic', value: 100, starred: false }] },
    { name: { en: 'Night Lord', 'zh-TW': '暗夜鬼爵', 'zh-CN': '暗夜鬼爵' }, type: 'undead', immunities: [{ element: 'cold', value: 120, starred: true }] },
  ]},
  { areaName: { en: 'Ruined Fane', 'zh-TW': '荒廢的寺院', 'zh-CN': '荒废的寺院' }, monsters: [
    { name: { en: 'Serpent Magus', 'zh-TW': '蛇魔法師', 'zh-CN': '蛇魔法师' }, type: 'animal', immunities: [{ element: 'cold', value: 120, starred: true }] },
    { name: { en: 'Blood Diver', 'zh-TW': '鮮血俯衝者', 'zh-CN': '鲜血俯冲者' }, type: 'animal', immunities: [{ element: 'fire', value: 105, starred: false }] },
    { name: { en: 'Flesh Archer', 'zh-TW': '血肉弓箭手', 'zh-CN': '血肉弓箭手' }, type: 'demon', immunities: [{ element: 'cold', value: 130, starred: true }] },
    { name: { en: 'Bone Scarab', 'zh-TW': '骸骨甲蟲', 'zh-CN': '骸骨甲虫' }, type: 'animal', immunities: [{ element: 'lightning', value: 120, starred: true }] },
  ]},
  { areaName: { en: 'Disused Reliquary', 'zh-TW': '廢棄的聖殿', 'zh-CN': '废弃的圣殿' }, monsters: [
    { name: { en: 'Serpent Magus', 'zh-TW': '蛇魔法師', 'zh-CN': '蛇魔法师' }, type: 'animal', immunities: [{ element: 'cold', value: 120, starred: true }] },
    { name: { en: 'Blood Diver', 'zh-TW': '鮮血俯衝者', 'zh-CN': '鲜血俯冲者' }, type: 'animal', immunities: [{ element: 'fire', value: 105, starred: false }] },
    { name: { en: 'Flesh Archer', 'zh-TW': '血肉弓箭手', 'zh-CN': '血肉弓箭手' }, type: 'demon', immunities: [{ element: 'cold', value: 130, starred: true }] },
    { name: { en: 'Bone Scarab', 'zh-TW': '骸骨甲蟲', 'zh-CN': '骸骨甲虫' }, type: 'animal', immunities: [{ element: 'lightning', value: 120, starred: true }] },
  ]},
  { areaName: { en: 'River of Flame', 'zh-TW': '火焰之河', 'zh-CN': '火焰之河' }, monsters: [
    { name: { en: 'Strangler', 'zh-TW': '扼殺者', 'zh-CN': '扼杀者' }, type: 'undead', immunities: [{ element: 'lightning', value: 100, starred: false }] },
    { name: { en: 'Maw Fiend', 'zh-TW': '魔口吐屍怪', 'zh-CN': '魔口吐尸怪' }, type: 'demon', immunities: [{ element: 'poison', value: 110, starred: false }] },
    { name: { en: 'Pit Lord', 'zh-TW': '獄淵領主', 'zh-CN': '狱渊领主' }, type: 'demon', immunities: [{ element: 'fire', value: 120, starred: true }] },
    { name: { en: 'Blood Maggot', 'zh-TW': '鮮血蛆蟲', 'zh-CN': '鲜血蛆虫' }, type: 'animal', immunities: [{ element: 'poison', value: 125, starred: true }] },
    { name: { en: 'Blood Maggot Egg', 'zh-TW': '鮮血蛆蟲之卵', 'zh-CN': '鲜血蛆虫之卵' }, type: 'animal', immunities: [] },
    { name: { en: 'Urdar', 'zh-TW': '烏爾達巨怪', 'zh-CN': '乌尔达巨怪' }, type: 'demon', immunities: [] },
    { name: { en: 'Abyss Knight', 'zh-TW': '深淵騎士', 'zh-CN': '深渊骑士' }, type: 'undead', immunities: [{ element: 'lightning', value: 100, starred: false }] },
    { name: { en: 'Grotesque', 'zh-TW': '異魔鬼母', 'zh-CN': '异魔鬼母' }, type: 'demon', immunities: [{ element: 'cold', value: 160, starred: true }] },
    { name: { en: 'Grotesque Wyrm', 'zh-TW': '異魔鬼子', 'zh-CN': '异魔鬼子' }, type: 'demon', immunities: [{ element: 'cold', value: 160, starred: true }] },
  ]},
  { areaName: { en: 'The Chaos Sanctuary', 'zh-TW': '混沌魔殿', 'zh-CN': '混沌魔殿' }, monsters: [
    { name: { en: 'Venom Lord', 'zh-TW': '毒魔領主', 'zh-CN': '毒魔领主' }, type: 'demon', immunities: [{ element: 'fire', value: 130, starred: true }] },
    { name: { en: 'Storm Caster', 'zh-TW': '暴風施術者', 'zh-CN': '暴风施术者' }, type: 'undead', immunities: [{ element: 'lightning', value: 100, starred: false }] },
    { name: { en: 'Oblivion Knight', 'zh-TW': '遺忘騎士', 'zh-CN': '遗忘骑士' }, type: 'undead', immunities: [{ element: 'cold', value: 180, starred: true }] },
    { name: { en: 'Doom Knight', 'zh-TW': '末日騎士', 'zh-CN': '末日骑士' }, type: 'undead', immunities: [{ element: 'fire', value: 110, starred: false }] },
  ]},
  { areaName: { en: 'Abaddon', 'zh-TW': '亞巴頓', 'zh-CN': '亚巴顿' }, monsters: [
    { name: { en: 'Balrog', 'zh-TW': '炎魔', 'zh-CN': '炎魔' }, type: 'demon', immunities: [{ element: 'fire', value: 140, starred: true }] },
    { name: { en: 'Hell Temptress', 'zh-TW': '地獄妖魅', 'zh-CN': '地狱妖魅' }, type: 'demon', immunities: [] },
    { name: { en: 'Blood Lord', 'zh-TW': '血族統領', 'zh-CN': '血族统领' }, type: 'animal', immunities: [{ element: 'physical', value: 100, starred: false }] },
    { name: { en: 'Strangler', 'zh-TW': '扼殺者', 'zh-CN': '扼杀者' }, type: 'undead', immunities: [{ element: 'lightning', value: 100, starred: false }] },
    { name: { en: 'Demon Imp', 'zh-TW': '惡魔小鬼', 'zh-CN': '恶魔小鬼' }, type: 'demon', immunities: [{ element: 'fire', value: 110, starred: false }] },
    { name: { en: 'Dark Shaman', 'zh-TW': '暗黑薩滿', 'zh-CN': '暗黑萨满' }, type: 'demon', immunities: [] },
    { name: { en: 'Dark One', 'zh-TW': '暗黑沉淪魔', 'zh-CN': '暗黑沉沦魔' }, type: 'demon', immunities: [] },
    { name: { en: 'Hell Witch', 'zh-TW': '地獄女妖', 'zh-CN': '地狱女妖' }, type: 'demon', immunities: [{ element: 'cold', value: 145, starred: true }] },
    { name: { en: 'Undead Stygian Doll', 'zh-TW': '不死冥河鬼娃', 'zh-CN': '不死冥河鬼娃' }, type: 'undead', immunities: [{ element: 'poison', value: 105, starred: false }] },
    { name: { en: 'Horror Archer', 'zh-TW': '恐骨弓箭手', 'zh-CN': '恐骨弓箭手' }, type: 'undead', immunities: [{ element: 'poison', value: 140, starred: true }] },
    { name: { en: 'Hell Spawn', 'zh-TW': '地獄爪牙', 'zh-CN': '地狱爪牙' }, type: 'animal', immunities: [{ element: 'fire', value: 110, starred: false }] },
  ]},
  { areaName: { en: 'Pit of Acheron', 'zh-TW': '冥河地穴', 'zh-CN': '冥河地穴' }, monsters: [
    { name: { en: 'Balrog', 'zh-TW': '炎魔', 'zh-CN': '炎魔' }, type: 'demon', immunities: [{ element: 'fire', value: 140, starred: true }] },
    { name: { en: 'Maw Fiend', 'zh-TW': '魔口吐屍怪', 'zh-CN': '魔口吐尸怪' }, type: 'demon', immunities: [{ element: 'poison', value: 110, starred: false }] },
    { name: { en: 'Unraveler', 'zh-TW': '解繃者', 'zh-CN': '解绷者' }, type: 'undead', immunities: [{ element: 'magic', value: 100, starred: false }] },
    { name: { en: 'Hell Temptress', 'zh-TW': '地獄妖魅', 'zh-CN': '地狱妖魅' }, type: 'demon', immunities: [] },
    { name: { en: 'Hell Clan', 'zh-TW': '冥府羊頭人', 'zh-CN': '冥府羊头人' }, type: 'demon', immunities: [{ element: 'cold', value: 155, starred: true }] },
    { name: { en: 'Burning Dead Mage', 'zh-TW': '烈焰骷髏法師', 'zh-CN': '烈焰骷髅法师' }, type: 'undead', immunities: [{ element: 'fire', value: 130, starred: true }, { element: 'poison', value: 110, starred: false }] },
    { name: { en: 'Blood Lord', 'zh-TW': '血族統領', 'zh-CN': '血族统领' }, type: 'animal', immunities: [{ element: 'physical', value: 100, starred: false }] },
    { name: { en: 'Mauler', 'zh-TW': '重擊巨怪', 'zh-CN': '重击巨怪' }, type: 'demon', immunities: [] },
    { name: { en: 'Demon Imp', 'zh-TW': '惡魔小鬼', 'zh-CN': '恶魔小鬼' }, type: 'demon', immunities: [{ element: 'fire', value: 110, starred: false }] },
    { name: { en: 'Salamander', 'zh-TW': '火蜥蛇魔', 'zh-CN': '火蜥蛇魔' }, type: 'animal', immunities: [{ element: 'fire', value: 115, starred: false }] },
  ]},
  { areaName: { en: 'Drifter Cavern', 'zh-TW': '漂泊者洞窟', 'zh-CN': '漂泊者洞窟' }, monsters: [
    { name: { en: 'Succubus', 'zh-TW': '魅魔', 'zh-CN': '魅魔' }, type: 'demon', immunities: [] },
    { name: { en: 'Infidel', 'zh-TW': '異信者', 'zh-CN': '异信者' }, type: 'animal', immunities: [{ element: 'cold', value: 150, starred: true }] },
    { name: { en: 'Moon Lord', 'zh-TW': '月族統領', 'zh-CN': '月族统领' }, type: 'animal', immunities: [{ element: 'fire', value: 140, starred: true }] },
    { name: { en: 'Abominable', 'zh-TW': '厚毛雪怪', 'zh-CN': '厚毛雪怪' }, type: 'animal', immunities: [{ element: 'cold', value: 170, starred: true }] },
    { name: { en: 'Frozen Terror', 'zh-TW': '恐怖冰怪', 'zh-CN': '恐怖冰怪' }, type: 'animal', immunities: [{ element: 'cold', value: 160, starred: true }] },
    { name: { en: 'Afflicted', 'zh-TW': '災劫魔汙怪', 'zh-CN': '灾劫魔污怪' }, type: 'demon', immunities: [{ element: 'lightning', value: 100, starred: false }] },
    { name: { en: 'Night Clan', 'zh-TW': '夜族羊頭人', 'zh-CN': '夜族羊头人' }, type: 'demon', immunities: [{ element: 'cold', value: 135, starred: true }] },
    { name: { en: 'Ghost', 'zh-TW': '鬼魂', 'zh-CN': '鬼魂' }, type: 'undead', immunities: [{ element: 'poison', value: 100, starred: false }, { element: 'physical', value: 100, starred: false }] },
    { name: { en: 'Dark Archer', 'zh-TW': '黑暗弓箭手', 'zh-CN': '黑暗弓箭手' }, type: 'demon', immunities: [{ element: 'cold', value: 140, starred: true }] },
    { name: { en: 'Bone Mage', 'zh-TW': '骸骨法師', 'zh-CN': '骸骨法师' }, type: 'undead', immunities: [{ element: 'cold', value: 160, starred: true }, { element: 'poison', value: 110, starred: false }] },
  ]},
  { areaName: { en: 'Infernal Pit', 'zh-TW': '煉獄地穴', 'zh-CN': '炼狱地穴' }, monsters: [
    { name: { en: 'Balrog', 'zh-TW': '炎魔', 'zh-CN': '炎魔' }, type: 'demon', immunities: [{ element: 'fire', value: 140, starred: true }] },
    { name: { en: 'Unholy Corpse', 'zh-TW': '穢邪屍兵', 'zh-CN': '秽邪尸兵' }, type: 'undead', immunities: [{ element: 'poison', value: 120, starred: true }] },
    { name: { en: 'Blood Boss', 'zh-TW': '血腥統治者', 'zh-CN': '血腥统治者' }, type: 'demon', immunities: [{ element: 'cold', value: 150, starred: true }] },
    { name: { en: 'Fire Boar', 'zh-TW': '火焰僕魔', 'zh-CN': '火焰仆魔' }, type: 'animal', immunities: [{ element: 'fire', value: 110, starred: false }] },
    { name: { en: 'Oblivion Knight', 'zh-TW': '遺忘騎士', 'zh-CN': '遗忘骑士' }, type: 'undead', immunities: [{ element: 'cold', value: 140, starred: true }] },
    { name: { en: 'Doom Knight', 'zh-TW': '末日騎士', 'zh-CN': '末日骑士' }, type: 'undead', immunities: [{ element: 'fire', value: 130, starred: true }] },
    { name: { en: 'Night Lord', 'zh-TW': '夜族統領', 'zh-CN': '夜族统领' }, type: 'animal', immunities: [{ element: 'lightning', value: 100, starred: false }] },
    { name: { en: 'Blood Lord', 'zh-TW': '鮮血鬼爵', 'zh-CN': '鲜血鬼爵' }, type: 'undead', immunities: [{ element: 'cold', value: 125, starred: true }] },
    { name: { en: 'Stygian Doll', 'zh-TW': '冥河鬼娃', 'zh-CN': '冥河鬼娃' }, type: 'demon', immunities: [{ element: 'fire', value: 110, starred: false }] },
    { name: { en: 'Hell Witch', 'zh-TW': '地獄女妖', 'zh-CN': '地狱女妖' }, type: 'demon', immunities: [{ element: 'cold', value: 160, starred: true }] },
    { name: { en: 'Demon Trickster', 'zh-TW': '欺瞞小鬼', 'zh-CN': '欺瞒小鬼' }, type: 'demon', immunities: [{ element: 'fire', value: 115, starred: false }] },
    { name: { en: 'Salamander', 'zh-TW': '火蜥蛇魔', 'zh-CN': '火蜥蛇魔' }, type: 'animal', immunities: [{ element: 'fire', value: 115, starred: false }] },
  ]},
  { areaName: { en: 'Icy Cellar', 'zh-TW': '冰窖', 'zh-CN': '冰窖' }, monsters: [
    { name: { en: 'Undead Stygian Doll', 'zh-TW': '不死冥河鬼娃', 'zh-CN': '不死冥河鬼娃' }, type: 'undead', immunities: [{ element: 'poison', value: 120, starred: true }] },
    { name: { en: 'Gloam', 'zh-TW': '薄暮鬼火', 'zh-CN': '薄暮鬼火' }, type: 'undead', immunities: [{ element: 'lightning', value: 100, starred: false }, { element: 'poison', value: 105, starred: false }] },
    { name: { en: 'Siren', 'zh-TW': '賽蓮女妖', 'zh-CN': '赛莲女妖' }, type: 'demon', immunities: [{ element: 'cold', value: 125, starred: true }] },
    { name: { en: 'Hell Temptress', 'zh-TW': '地獄妖魅', 'zh-CN': '地狱妖魅' }, type: 'demon', immunities: [{ element: 'physical', value: 100, starred: false }] },
    { name: { en: 'Abominable', 'zh-TW': '厚毛雪怪', 'zh-CN': '厚毛雪怪' }, type: 'animal', immunities: [{ element: 'cold', value: 170, starred: true }] },
    { name: { en: 'Frozen Terror', 'zh-TW': '恐怖冰怪', 'zh-CN': '恐怖冰怪' }, type: 'animal', immunities: [{ element: 'cold', value: 160, starred: true }] },
    { name: { en: 'Gloombat', 'zh-TW': '幽暗蝙蝠', 'zh-CN': '幽暗蝙蝠' }, type: 'animal', immunities: [{ element: 'lightning', value: 100, starred: false }] },
    { name: { en: 'Pit Viper', 'zh-TW': '地穴蛇魔', 'zh-CN': '地穴蛇魔' }, type: 'animal', immunities: [{ element: 'cold', value: 145, starred: true }, { element: 'poison', value: 110, starred: false }] },
    { name: { en: 'Ghost', 'zh-TW': '鬼魂', 'zh-CN': '鬼魂' }, type: 'undead', immunities: [{ element: 'poison', value: 100, starred: false }, { element: 'physical', value: 100, starred: false }] },
    { name: { en: 'Hell Lord', 'zh-TW': '冥府統領', 'zh-CN': '冥府统领' }, type: 'animal', immunities: [{ element: 'lightning', value: 100, starred: false }] },
  ]},
  { areaName: { en: 'Worldstone Keep Level 1', 'zh-TW': '世界之石要塞第一層', 'zh-CN': '世界之石要塞第一层' }, monsters: [
    { name: { en: 'Unholy Corpse', 'zh-TW': '穢邪屍兵', 'zh-CN': '秽邪尸兵' }, type: 'undead', immunities: [{ element: 'poison', value: 120, starred: true }] },
    { name: { en: 'Vile Witch', 'zh-TW': '兇邪女妖', 'zh-CN': '凶邪女妖' }, type: 'demon', immunities: [{ element: 'cold', value: 155, starred: true }] },
    { name: { en: 'Invader', 'zh-TW': '入侵者', 'zh-CN': '入侵者' }, type: 'animal', immunities: [{ element: 'cold', value: 160, starred: true }] },
    { name: { en: 'Soul Killer Shaman', 'zh-TW': '靈魂殺手薩滿', 'zh-CN': '灵魂杀手萨满' }, type: 'demon', immunities: [{ element: 'fire', value: 130, starred: true }] },
    { name: { en: 'Soul Killer', 'zh-TW': '靈魂殺手', 'zh-CN': '灵魂杀手' }, type: 'demon', immunities: [{ element: 'fire', value: 115, starred: false }] },
    { name: { en: 'Fetid Defiler', 'zh-TW': '惡臭褻瀆者', 'zh-CN': '恶臭亵渎者' }, type: 'demon', immunities: [{ element: 'poison', value: 110, starred: false }] },
    { name: { en: 'Black Lancer', 'zh-TW': '黑色長槍手', 'zh-CN': '黑色长枪手' }, type: 'demon', immunities: [{ element: 'lightning', value: 100, starred: false }] },
    { name: { en: 'Hierophant', 'zh-TW': '祭司', 'zh-CN': '祭司' }, type: 'animal', immunities: [] },
    { name: { en: 'Zealot', 'zh-TW': '狂熱信徒', 'zh-CN': '狂热信徒' }, type: 'animal', immunities: [{ element: 'lightning', value: 100, starred: false }] },
    { name: { en: 'Death Lord', 'zh-TW': '死族統領', 'zh-CN': '死族统领' }, type: 'animal', immunities: [{ element: 'fire', value: 120, starred: true }] },
    { name: { en: 'Flesh Spawner', 'zh-TW': '血獸鬼母', 'zh-CN': '血兽鬼母' }, type: 'demon', immunities: [{ element: 'cold', value: 145, starred: true }] },
    { name: { en: 'Flesh Beast', 'zh-TW': '血獸鬼子', 'zh-CN': '血兽鬼子' }, type: 'demon', immunities: [{ element: 'cold', value: 145, starred: true }] },
    { name: { en: 'Ghoul Lord', 'zh-TW': '食屍鬼爵', 'zh-CN': '食尸鬼爵' }, type: 'undead', immunities: [{ element: 'cold', value: 130, starred: true }] },
  ]},
  { areaName: { en: 'Worldstone Keep Level 2', 'zh-TW': '世界之石要塞第二層', 'zh-CN': '世界之石要塞第二层' }, monsters: [
    { name: { en: 'Black Soul', 'zh-TW': '黑魂鬼火', 'zh-CN': '黑魂鬼火' }, type: 'undead', immunities: [{ element: 'lightning', value: 100, starred: false }, { element: 'poison', value: 110, starred: false }] },
    { name: { en: 'Greater Hell Spawn', 'zh-TW': '高階地獄爪牙', 'zh-CN': '高阶地狱爪牙' }, type: 'animal', immunities: [{ element: 'cold', value: 135, starred: true }] },
    { name: { en: 'Horadrim Ancient', 'zh-TW': '赫拉迪姆古屍', 'zh-CN': '赫拉迪姆古尸' }, type: 'undead', immunities: [{ element: 'magic', value: 100, starred: false }] },
    { name: { en: 'Fiend', 'zh-TW': '魔蝠', 'zh-CN': '魔蝠' }, type: 'animal', immunities: [{ element: 'lightning', value: 100, starred: false }] },
    { name: { en: 'Steel Scarab', 'zh-TW': '鋼鐵甲蟲', 'zh-CN': '钢铁甲虫' }, type: 'animal', immunities: [{ element: 'lightning', value: 100, starred: false }] },
    { name: { en: 'Soul Killer', 'zh-TW': '靈魂殺手', 'zh-CN': '灵魂杀手' }, type: 'demon', immunities: [{ element: 'fire', value: 115, starred: false }] },
    { name: { en: 'Horror Mage', 'zh-TW': '恐骨法師', 'zh-CN': '恐骨法师' }, type: 'undead', immunities: [] },
    { name: { en: 'Cadaver', 'zh-TW': '活屍木乃伊', 'zh-CN': '活尸木乃伊' }, type: 'undead', immunities: [{ element: 'poison', value: 130, starred: true }] },
    { name: { en: 'Serpent Magus', 'zh-TW': '蛇魔法師', 'zh-CN': '蛇魔法师' }, type: 'animal', immunities: [{ element: 'poison', value: 115, starred: true }] },
    { name: { en: 'Frenzied Ice Spawn', 'zh-TW': '狂怒冰封爪牙', 'zh-CN': '狂怒冰封爪牙' }, type: 'animal', immunities: [{ element: 'cold', value: 150, starred: true }] },
  ]},
  { areaName: { en: 'Worldstone Keep Level 3', 'zh-TW': '世界之石要塞第三層', 'zh-CN': '世界之石要塞第三层' }, monsters: [
    { name: { en: 'Horror Mage', 'zh-TW': '恐骨法師', 'zh-CN': '恐骨法师' }, type: 'undead', immunities: [{ element: 'lightning', value: 130, starred: true }, { element: 'poison', value: 110, starred: false }] },
    { name: { en: 'Hell Temptress', 'zh-TW': '地獄妖魅', 'zh-CN': '地狱妖魅' }, type: 'demon', immunities: [{ element: 'physical', value: 100, starred: false }] },
    { name: { en: 'Blood Boss', 'zh-TW': '血腥統治者', 'zh-CN': '血腥统治者' }, type: 'demon', immunities: [{ element: 'cold', value: 150, starred: true }] },
    { name: { en: 'Fire Boar', 'zh-TW': '火焰僕魔', 'zh-CN': '火焰仆魔' }, type: 'animal', immunities: [{ element: 'fire', value: 110, starred: false }] },
    { name: { en: 'Storm Caster', 'zh-TW': '暴風施術者', 'zh-CN': '暴风施术者' }, type: 'undead', immunities: [{ element: 'lightning', value: 100, starred: false }] },
    { name: { en: 'Demon Sprite', 'zh-TW': '精怪小鬼', 'zh-CN': '精怪小鬼' }, type: 'demon', immunities: [{ element: 'fire', value: 120, starred: true }] },
    { name: { en: 'Oblivion Knight', 'zh-TW': '遺忘騎士', 'zh-CN': '遗忘骑士' }, type: 'undead', immunities: [{ element: 'cold', value: 145, starred: true }] },
    { name: { en: 'Doom Knight', 'zh-TW': '末日騎士', 'zh-CN': '末日骑士' }, type: 'undead', immunities: [{ element: 'fire', value: 140, starred: true }] },
    { name: { en: 'Soul Killer', 'zh-TW': '靈魂殺手', 'zh-CN': '灵魂杀手' }, type: 'demon', immunities: [{ element: 'fire', value: 115, starred: false }] },
    { name: { en: 'Specter', 'zh-TW': '亡靈', 'zh-CN': '亡灵' }, type: 'undead', immunities: [{ element: 'poison', value: 100, starred: false }, { element: 'physical', value: 100, starred: false }] },
    { name: { en: 'Rancid Defiler', 'zh-TW': '腐臭褻瀆者', 'zh-CN': '腐臭亵渎者' }, type: 'demon', immunities: [{ element: 'poison', value: 115, starred: true }] },
    { name: { en: 'Death Lord', 'zh-TW': '死族統領', 'zh-CN': '死族统领' }, type: 'animal', immunities: [{ element: 'fire', value: 120, starred: true }] },
  ]},
  { areaName: { en: 'Throne of Destruction', 'zh-TW': '毀滅王座', 'zh-CN': '毁灭王座' }, monsters: [
    { name: { en: 'Horadrim Ancient', 'zh-TW': '赫拉迪姆古屍', 'zh-CN': '赫拉迪姆古尸' }, type: 'undead', immunities: [{ element: 'magic', value: 100, starred: false }] },
    { name: { en: 'Pit Lord', 'zh-TW': '獄淵領主', 'zh-CN': '狱渊领主' }, type: 'demon', immunities: [{ element: 'fire', value: 145, starred: true }] },
    { name: { en: 'Oblivion Knight', 'zh-TW': '遺忘騎士', 'zh-CN': '遗忘骑士' }, type: 'undead', immunities: [{ element: 'cold', value: 145, starred: true }] },
    { name: { en: 'Doom Knight', 'zh-TW': '末日騎士', 'zh-CN': '末日骑士' }, type: 'undead', immunities: [{ element: 'fire', value: 140, starred: true }] },
    { name: { en: 'Dark Lord', 'zh-TW': '黑暗鬼爵', 'zh-CN': '黑暗鬼爵' }, type: 'undead', immunities: [{ element: 'cold', value: 135, starred: true }] },
    { name: { en: 'Assailant', 'zh-TW': '襲擊者', 'zh-CN': '袭击者' }, type: 'animal', immunities: [{ element: 'fire', value: 130, starred: true }] },
    { name: { en: 'Serpent Magus', 'zh-TW': '蛇魔法師', 'zh-CN': '蛇魔法师' }, type: 'animal', immunities: [{ element: 'poison', value: 115, starred: true }] },
    { name: { en: 'Burning Soul', 'zh-TW': '燃魂鬼火', 'zh-CN': '燃魂鬼火' }, type: 'undead', immunities: [{ element: 'lightning', value: 100, starred: false }, { element: 'poison', value: 115, starred: true }] },
    { name: { en: 'Hell Witch', 'zh-TW': '地獄女妖', 'zh-CN': '地狱女妖' }, type: 'demon', immunities: [{ element: 'cold', value: 160, starred: true }] },
    { name: { en: 'Undead Soul Killer', 'zh-TW': '不死靈魂殺手', 'zh-CN': '不死灵魂杀手' }, type: 'undead', immunities: [{ element: 'poison', value: 110, starred: false }] },
    { name: { en: 'Death Lord', 'zh-TW': '死族統領', 'zh-CN': '死族统领' }, type: 'animal', immunities: [{ element: 'fire', value: 120, starred: true }] },
  ]},
  { areaName: { en: 'The Worldstone Chamber', 'zh-TW': '世界之石大殿', 'zh-CN': '世界之石大殿' }, monsters: [] },
];
