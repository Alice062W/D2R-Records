import { routing } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import setGroups from '../../../../../data/set-groups.json';
import { slugifySetName } from '@/lib/grail/catalog';
import SetGroupList from '@/components/items/SetGroupList';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export default async function SetItemsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Items');
  const groups = setGroups.map(g => ({ slug: slugifySetName(g.setName.en), name: g.setName[locale as 'en' | 'zh-TW' | 'zh-CN'], repInvFile: g.repInvFile }));

  return (
    <main className="flex flex-col items-center py-10 px-4 gap-8 flex-1 w-full">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-parchment-bright">{t('setGroupsPageTitle')}</h1>
        <p className="mt-2 text-sm text-muted max-w-md">{t('setGroupsPageSubtitle')}</p>
      </div>
      <div className="w-full max-w-4xl flex flex-col gap-4">
        <div className="flex justify-end">
          <Link href={`/${locale}/items/set/category`} className="text-sm text-muted hover:text-gold-bright transition-colors">
            {t('browseByCategory')}
          </Link>
        </div>
        <SetGroupList groups={groups} basePath={`/${locale}/items/set`} />
      </div>
    </main>
  );
}
