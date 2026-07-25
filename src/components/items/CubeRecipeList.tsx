'use client';

import type cubeRecipesJson from '../../../data/cube-recipes.json';
import ItemIconFrame from './ItemIconFrame';

type Recipe = (typeof cubeRecipesJson)[number];
type Locale = 'en' | 'zh-TW' | 'zh-CN';

function RecipeIcon({ invFile }: { invFile: string }) {
  return <ItemIconFrame invFile={invFile} kind="base" sizeClass="w-6 h-6" className="inline-flex" />;
}

export default function CubeRecipeList({ recipes, locale }: { recipes: Recipe[]; locale: Locale }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-2 w-full">
      {recipes.map(r => (
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
          {r.description[locale].replace(/->/g, '→')}
        </div>
      ))}
    </div>
  );
}
