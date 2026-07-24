import { routing } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import recipes from '../../../../../data/cube-recipes.json';
import CubeRecipeCategoryGrid from '@/components/items/CubeRecipeCategoryGrid';

// Same category order as data/cube-recipes.json's category buckets.
const CATEGORY_ORDER = [
  'gemUpgrade', 'runeUpgrade', 'quests', 'consumables', 'sockets', 'itemUpgrade',
  'itemRepair', 'magicItemRerolls', 'magicItemCreation', 'craftedGrandCharm',
] as const;

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

// No single vendor field designates a "representative" icon per recipe
// category, so derive one from the category's own recipes: the first
// recipe with an output icon (preferred, since it's the recipe's actual
// result), falling back to its first ingredient icon.
function iconFor(categoryRecipes: typeof recipes) {
  for (const r of categoryRecipes) {
    if (r.outputIcon) return r.outputIcon;
    if (r.ingredientIcons.length > 0) return r.ingredientIcons[0];
  }
  return null;
}

export default async function CubeRecipesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Items');

  const categories = CATEGORY_ORDER
    .map(category => {
      const items = recipes.filter(r => r.category === category);
      return { category, count: items.length, icon: iconFor(items) };
    })
    .filter(c => c.count > 0);

  return (
    <main className="flex flex-col items-center py-10 px-4 gap-8 flex-1 w-full">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-parchment-bright">{t('cubeRecipesPageTitle')}</h1>
        <p className="mt-2 text-sm text-muted max-w-md">{t('cubeRecipesPageSubtitle')}</p>
      </div>
      <div className="w-full max-w-4xl">
        <CubeRecipeCategoryGrid categories={categories} basePath={`/${locale}/items/cube-recipes`} />
      </div>
    </main>
  );
}
