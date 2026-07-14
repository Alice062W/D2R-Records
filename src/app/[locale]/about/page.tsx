import { routing } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import ComingSoonPage from '@/components/ComingSoonPage';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Nav');
  return <ComingSoonPage title={t('aboutUs')} />;
}
