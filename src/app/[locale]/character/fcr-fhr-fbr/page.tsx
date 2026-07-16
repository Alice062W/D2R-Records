import { routing } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { FCR_FHR_FBR_TABLES } from '@/lib/grail/fcrFhrFbr';
import FcrFhrFbrTable from '@/components/items/FcrFhrFbrTable';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export default async function FcrFhrFbrPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Items');

  return (
    <main className="flex flex-col items-center py-10 px-4 gap-6 flex-1 w-full">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">{t('fcrFhrFbrPageTitle')}</h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-md">{t('fcrFhrFbrPageSubtitle')}</p>
      </div>
      <div className="w-full max-w-4xl">
        <FcrFhrFbrTable tables={FCR_FHR_FBR_TABLES} />
      </div>
    </main>
  );
}
