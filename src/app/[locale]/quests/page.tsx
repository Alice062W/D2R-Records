import { routing } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import quests from '../../../../data/quests.json';
import QuestList from '@/components/quests/QuestList';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export default async function QuestsPage({
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
        <h1 className="text-3xl font-bold tracking-tight text-parchment-bright">{t('questsPageTitle')}</h1>
        <p className="mt-2 text-sm text-muted max-w-md">{t('questsPageSubtitle')}</p>
      </div>
      <QuestList quests={quests} locale={locale as 'en' | 'zh-TW' | 'zh-CN'} />
    </main>
  );
}
