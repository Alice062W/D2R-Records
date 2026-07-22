import Link from 'next/link';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import {
  getAllGrailItems,
  getCategoriesForKind,
  getItemsForSetWeaponsCategory,
  localizeGrailItem,
  sortItemsForDisplay,
} from '@/lib/grail/catalog';
import CategoryItemList from '@/components/items/CategoryItemList';
import CollectionSummaryBar from '@/components/items/CollectionSummaryBar';

export function generateStaticParams() {
  return routing.locales.flatMap(locale =>
    getCategoriesForKind('set').map(category => ({ locale, category }))
  );
}

export default async function SetCategoryPage({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}) {
  const { locale, category } = await params;
  setRequestLocale(locale);

  if (!getCategoriesForKind('set').includes(category)) {
    notFound();
  }

  const t = await getTranslations('Items');
  const tGrail = await getTranslations('Grail');
  const loc = locale as 'en' | 'zh-TW' | 'zh-CN';

  const rawItems = category === 'weapons'
    ? getItemsForSetWeaponsCategory()
    : getAllGrailItems().filter(i => i.kind === 'set' && i.slotCategory === category);
  const items = sortItemsForDisplay(rawItems.map(i => localizeGrailItem(i, loc)));

  return (
    <main className="flex flex-col items-center py-10 px-4 gap-6 flex-1 w-full">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-parchment-bright">{t('setPageTitle')}</h1>
        <p className="mt-2 text-sm text-muted max-w-md">{t('setPageSubtitle')}</p>
      </div>
      <div className="w-full max-w-4xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-parchment-bright">{tGrail(`slot_${category}`)}</h2>
          <Link href={`/${locale}/items/set/category`} className="text-sm text-muted hover:text-gold-bright transition-colors">
            {t('backToCategories')}
          </Link>
        </div>
        <CollectionSummaryBar itemIds={items.map(i => i.id)} />
        <CategoryItemList items={items} />
      </div>
    </main>
  );
}
