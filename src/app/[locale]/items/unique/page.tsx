import { routing } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getCategoriesForKind } from '@/lib/grail/catalog';
import CategoryCardGrid from '@/components/items/CategoryCardGrid';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export default async function UniqueItemsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Items');
  const categories = getCategoriesForKind('unique');

  return (
    <main className="flex flex-col items-center py-10 px-4 gap-8 flex-1 w-full">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-parchment-bright">{t('uniquePageTitle')}</h1>
        <p className="mt-2 text-sm text-muted max-w-md">{t('uniquePageSubtitle')}</p>
      </div>
      <div className="w-full max-w-4xl">
        <CategoryCardGrid categories={categories} basePath={`/${locale}/items/unique`} />
      </div>
    </main>
  );
}
