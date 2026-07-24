import Link from 'next/link';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import recipes from '../../../../../../data/cube-recipes.json';
import CubeRecipeList from '@/components/items/CubeRecipeList';

const CATEGORY_ORDER = [
  'runeGemUpgrade', 'quests', 'consumables', 'sockets', 'itemUpgrade',
  'itemRepair', 'magicItemRerolls', 'magicItemCreation', 'craftedGrandCharm',
] as const;

export function generateStaticParams() {
  return routing.locales.flatMap(locale => CATEGORY_ORDER.map(category => ({ locale, category })));
}

export default async function CubeRecipeCategoryPage({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}) {
  const { locale, category } = await params;
  setRequestLocale(locale);

  if (!CATEGORY_ORDER.includes(category as (typeof CATEGORY_ORDER)[number])) {
    notFound();
  }

  const t = await getTranslations('Items');
  const items = recipes.filter(r => r.category === category);

  return (
    <main className="flex flex-col items-center py-10 px-4 gap-6 flex-1 w-full">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-parchment-bright">{t('cubeRecipesPageTitle')}</h1>
        <p className="mt-2 text-sm text-muted max-w-md">{t('cubeRecipesPageSubtitle')}</p>
      </div>
      <div className="w-full max-w-4xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-parchment-bright">{t(`cubeRecipesCategory_${category}` as never)}</h2>
          <Link href={`/${locale}/items/cube-recipes`} className="text-sm text-muted hover:text-gold-bright transition-colors">
            {t('backToCategories')}
          </Link>
        </div>
        <CubeRecipeList recipes={items} locale={locale as 'en' | 'zh-TW' | 'zh-CN'} />
      </div>
    </main>
  );
}
