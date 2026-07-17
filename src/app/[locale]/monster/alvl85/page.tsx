import { routing } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ALVL85_AREAS } from '@/lib/grail/alvl85Areas';
import Alvl85AreaList from '@/components/items/Alvl85AreaList';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export default async function Alvl85AreasPage({
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
        <h1 className="text-3xl font-bold tracking-tight text-parchment-bright">{t('alvl85PageTitle')}</h1>
        <p className="mt-2 text-sm text-muted max-w-md">{t('alvl85PageSubtitle')}</p>
      </div>
      <div className="w-full max-w-4xl">
        <Alvl85AreaList areas={ALVL85_AREAS} />
      </div>
    </main>
  );
}
