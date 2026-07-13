import { getTranslations, setRequestLocale } from 'next-intl/server';
import AppraiserForm from '@/components/AppraiserForm';
import { routing } from '@/i18n/routing';

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
    <main className="flex flex-col items-center py-10 px-4 gap-8 flex-1">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">
          {t('title')}
        </h1>
        <p className="mt-1 text-amber-400 font-semibold">{t('subtitle')}</p>
        <p className="mt-2 text-sm text-zinc-400 max-w-md">{t('description')}</p>
      </div>

      <AppraiserForm />
    </main>
  );
}
