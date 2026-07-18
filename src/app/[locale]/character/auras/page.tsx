import { routing } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AURAS } from '@/lib/grail/auras';
import AuraList from '@/components/items/AuraList';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export default async function AurasPage({
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
        <h1 className="text-3xl font-bold tracking-tight text-parchment-bright">{t('aurasPageTitle')}</h1>
        <p className="mt-2 text-sm text-muted max-w-md">{t('aurasPageSubtitle')}</p>
      </div>
      <div className="w-full max-w-3xl">
        <AuraList auras={AURAS} />
      </div>
    </main>
  );
}
