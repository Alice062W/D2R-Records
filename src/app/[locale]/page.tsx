import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import HomeCardGrid from '@/components/HomeCardGrid';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Home');

  return (
    <main className="flex flex-col items-center py-10 px-4 gap-10 flex-1 w-full">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-parchment-bright">
          {t('title')}
        </h1>
        <p className="mt-1 text-gold font-semibold">{t('subtitle')}</p>
        <p className="mt-2 text-sm text-muted max-w-md">{t('description')}</p>
      </div>

      <HomeCardGrid />
    </main>
  );
}
