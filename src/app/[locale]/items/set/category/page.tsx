import Link from 'next/link';
import { routing } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getCategoriesForKind, getItemIdsByCategory, getAllItemIdsForKind } from '@/lib/grail/catalog';
import CategoryCardGrid from '@/components/items/CategoryCardGrid';
import CollectionSummaryBar from '@/components/items/CollectionSummaryBar';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export default async function SetCategoryLandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Items');
  const categories = getCategoriesForKind('set');
  const itemIdsByCategory = getItemIdsByCategory('set');

  return (
    <main className="flex flex-col items-center py-10 px-4 gap-8 flex-1 w-full">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-parchment-bright">{t('setPageTitle')}</h1>
        <p className="mt-2 text-sm text-muted max-w-md">{t('setPageSubtitle')}</p>
      </div>
      <div className="w-full max-w-4xl flex flex-col gap-4">
        <CollectionSummaryBar itemIds={getAllItemIdsForKind('set')} />
        <div className="flex justify-end">
          <Link href={`/${locale}/items/set`} className="text-sm text-muted hover:text-gold-bright transition-colors">
            {t('browseByName')}
          </Link>
        </div>
        <CategoryCardGrid categories={categories} basePath={`/${locale}/items/set/category`} itemIdsByCategory={itemIdsByCategory} />
      </div>
    </main>
  );
}
