import { routing } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import RuneList from '@/components/items/RuneList';
import runes from '../../../../../data/runes.json';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export default async function RunesPage({
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
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">{t('runesPageTitle')}</h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-md">{t('runesPageSubtitle')}</p>
      </div>
      <div className="w-full max-w-4xl">
        <RuneList runes={runes} locale={locale as 'en' | 'zh-TW' | 'zh-CN'} />
      </div>
    </main>
  );
}
