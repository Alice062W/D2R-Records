'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type cubeRecipesJson from '../../../data/cube-recipes.json';
import { BASE_PATH } from '@/lib/basePath';

type Recipe = (typeof cubeRecipesJson)[number];
type Locale = 'en' | 'zh-TW' | 'zh-CN';

const CATEGORY_ORDER = [
  'runeGemUpgrade', 'quests', 'consumables', 'sockets', 'itemUpgrade',
  'itemRepair', 'magicItemRerolls', 'magicItemCreation', 'craftedGrandCharm',
] as const;

function RecipeIcon({ invFile }: { invFile: string }) {
  const [iconFailed, setIconFailed] = useState(false);
  if (!invFile || iconFailed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${BASE_PATH}/items/inv/${invFile}.png`}
      alt=""
      aria-hidden="true"
      className="w-6 h-6 object-contain inline-block"
      onError={() => setIconFailed(true)}
    />
  );
}

export default function CubeRecipeList({ recipes, locale }: { recipes: Recipe[]; locale: Locale }) {
  const t = useTranslations('Items');

  return (
    <div className="flex flex-col gap-8 w-full">
      {CATEGORY_ORDER.map(category => {
        const items = recipes.filter(r => r.category === category);
        if (items.length === 0) return null;
        return (
          <div key={category}>
            <h2 className="text-xl font-semibold text-parchment-bright mb-3">
              {t(`cubeRecipesCategory_${category}`)}
            </h2>
            <div className="flex flex-col gap-2">
              {items.map(r => (
                <div key={r.id} className="bg-panel border border-panel-border rounded-lg px-4 py-2 text-sm text-parchment">
                  {(r.ingredientIcons.length > 0 || r.outputIcon) && (
                    <div className="flex items-center gap-1 mb-1">
                      {r.ingredientIcons.map((icon, i) => <RecipeIcon key={`${icon}-${i}`} invFile={icon} />)}
                      {r.outputIcon && (
                        <>
                          <span className="text-muted mx-1">&rarr;</span>
                          <RecipeIcon invFile={r.outputIcon} />
                        </>
                      )}
                    </div>
                  )}
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
