import { routing } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import CubeRecipeList from '@/components/items/CubeRecipeList';
import recipes from '../../../../../data/cube-recipes.json';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export default async function CubeRecipesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Items');

  return (
    <main className="flex flex-col items-center py-10 px-4 gap-8 flex-1 w-full">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">{t('cubeRecipesPageTitle')}</h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-md">{t('cubeRecipesPageSubtitle')}</p>
      </div>
      <div className="w-full max-w-4xl">
        <CubeRecipeList recipes={recipes} locale={locale as 'en' | 'zh-TW' | 'zh-CN'} />
      </div>
    </main>
  );
}
