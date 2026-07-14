import Link from 'next/link';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import {
  getAllGrailItems,
  getCategoriesForKind,
  localizeGrailItem,
  sortItemsForDisplay,
} from '@/lib/grail/catalog';
import CategoryItemList from '@/components/items/CategoryItemList';

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

  if (!getCategoriesForKind('set').includes(category as ReturnType<typeof getCategoriesForKind>[number])) {
    notFound();
  }

  const t = await getTranslations('Items');
  const tGrail = await getTranslations('Grail');

  const items = sortItemsForDisplay(
    getAllGrailItems()
      .filter(i => i.kind === 'set' && i.slotCategory === category)
      .map(i => localizeGrailItem(i, locale as 'en' | 'zh-TW' | 'zh-CN'))
  );

  return (
    <main className="flex flex-col items-center py-10 px-4 gap-6 flex-1 w-full">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">{t('setPageTitle')}</h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-md">{t('setPageSubtitle')}</p>
      </div>
      <div className="w-full max-w-4xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-100">{tGrail(`slot_${category}`)}</h2>
          <Link href={`/${locale}/items/set`} className="text-sm text-zinc-400 hover:text-amber-300 transition-colors">
            {t('backToCategories')}
          </Link>
        </div>
        <CategoryItemList items={items} />
      </div>
    </main>
  );
}
