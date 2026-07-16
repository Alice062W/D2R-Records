import Link from 'next/link';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getBaseCategories, getBaseLinesForCategory } from '@/lib/grail/basesCatalog';
import BaseCategoryList from '@/components/items/BaseCategoryList';

export function generateStaticParams() {
  return routing.locales.flatMap(locale =>
    getBaseCategories().map(category => ({ locale, category }))
  );
}

export default async function BaseCategoryPage({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}) {
  const { locale, category } = await params;
  setRequestLocale(locale);

  if (!getBaseCategories().includes(category as ReturnType<typeof getBaseCategories>[number])) {
    notFound();
  }

  const t = await getTranslations('Items');
  const tGrail = await getTranslations('Grail');
  const lines = getBaseLinesForCategory(category, locale as 'en' | 'zh-TW' | 'zh-CN');

  return (
    <main className="flex flex-col items-center py-10 px-4 gap-6 flex-1 w-full">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">{t('basePageTitle')}</h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-md">{t('basePageSubtitle')}</p>
      </div>
      <div className="w-full max-w-4xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-100">{tGrail(`slot_${category}`)}</h2>
          <Link href={`/${locale}/items/base`} className="text-sm text-zinc-400 hover:text-amber-300 transition-colors">
            {t('backToCategories')}
          </Link>
        </div>
        <BaseCategoryList lines={lines} />
      </div>
    </main>
  );
}
