import { routing } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import MaxSocketsTable from '@/components/items/MaxSocketsTable';
import maxSockets from '../../../../../data/max-sockets.json';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export default async function MaxSocketsPage({
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
        <h1 className="text-3xl font-bold tracking-tight text-parchment-bright">{t('maxSocketsPageTitle')}</h1>
        <p className="mt-2 text-sm text-muted max-w-md">{t('maxSocketsPageSubtitle')}</p>
      </div>
      <div className="w-full max-w-2xl">
        <MaxSocketsTable rows={maxSockets} />
      </div>
    </main>
  );
}
