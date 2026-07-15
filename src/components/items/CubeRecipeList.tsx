import { useTranslations } from 'next-intl';
import type cubeRecipesJson from '../../../data/cube-recipes.json';

type Recipe = (typeof cubeRecipesJson)[number];
type Locale = 'en' | 'zh-TW' | 'zh-CN';

const CATEGORY_ORDER = [
  'runeGemUpgrade', 'quests', 'consumables', 'sockets', 'itemUpgrade',
  'itemRepair', 'magicItemRerolls', 'magicItemCreation', 'craftedGrandCharm',
] as const;

export default function CubeRecipeList({ recipes, locale }: { recipes: Recipe[]; locale: Locale }) {
  const t = useTranslations('Items');

  return (
    <div className="flex flex-col gap-8 w-full">
      {CATEGORY_ORDER.map(category => {
        const items = recipes.filter(r => r.category === category);
        if (items.length === 0) return null;
        return (
          <div key={category}>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">
              {t(`cubeRecipesCategory_${category}`)}
            </h2>
            <div className="flex flex-col gap-2">
              {items.map(r => (
                <div key={r.id} className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-zinc-300">
                  {r.description[locale]}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
