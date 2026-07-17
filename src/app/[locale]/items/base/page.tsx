import { routing } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getBaseCategories } from '@/lib/grail/basesCatalog';
import CategoryCardGrid from '@/components/items/CategoryCardGrid';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export default async function BaseItemsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Items');
  const categories = getBaseCategories();

  return (
    <main className="flex flex-col items-center py-10 px-4 gap-8 flex-1 w-full">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-parchment-bright">{t('basePageTitle')}</h1>
        <p className="mt-2 text-sm text-muted max-w-md">{t('basePageSubtitle')}</p>
      </div>
      <div className="w-full max-w-4xl">
        <CategoryCardGrid categories={categories} basePath={`/${locale}/items/base`} />
      </div>
    </main>
  );
}
