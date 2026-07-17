import { routing } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import CraftedItemList from '@/components/items/CraftedItemList';
import craftedItems from '../../../../../data/crafted-items.json';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export default async function CraftedItemsPage({
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
        <h1 className="text-3xl font-bold tracking-tight text-parchment-bright">{t('craftedItemsPageTitle')}</h1>
        <p className="mt-2 text-sm text-muted max-w-md">{t('craftedItemsPageSubtitle')}</p>
      </div>
      <div className="w-full max-w-4xl">
        <CraftedItemList items={craftedItems} locale={locale as 'en' | 'zh-TW' | 'zh-CN'} />
      </div>
    </main>
  );
}
