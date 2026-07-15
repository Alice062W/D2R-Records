import Link from 'next/link';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getAffixCategories, getAffixesForCategory } from '@/lib/grail/affixCatalog';
import AffixTable from '@/components/items/AffixTable';

export function generateStaticParams() {
  return routing.locales.flatMap(locale =>
    getAffixCategories('magic').map(category => ({ locale, category }))
  );
}

export default async function MagicCategoryPage({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}) {
  const { locale, category } = await params;
  setRequestLocale(locale);

  if (!getAffixCategories('magic').includes(category)) notFound();

  const t = await getTranslations('Items');
  const tGrail = await getTranslations('Grail');
  const tAffix = await getTranslations('AffixCategories');
  const grailKey = `slot_${category}`;
  const categoryLabel = tGrail.has(grailKey) ? tGrail(grailKey) : tAffix(category);
  const { prefixes, suffixes } = getAffixesForCategory(
    'magic',
    category,
    locale as 'en' | 'zh-TW' | 'zh-CN'
  );

  return (
    <main className="flex flex-col items-center py-10 px-4 gap-6 flex-1 w-full">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">{t('magicPageTitle')}</h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-md">{t('magicPageSubtitle')}</p>
      </div>
      <div className="w-full max-w-4xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-100">{categoryLabel}</h2>
          <Link
            href={`/${locale}/items/magic`}
            className="text-sm text-zinc-400 hover:text-amber-300 transition-colors"
          >
            {t('backToCategories')}
          </Link>
        </div>
        <AffixTable prefixes={prefixes} suffixes={suffixes} />
      </div>
    </main>
  );
}
