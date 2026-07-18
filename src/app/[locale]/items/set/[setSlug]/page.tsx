import Link from 'next/link';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import setGroups from '../../../../../../data/set-groups.json';
import { getAllGrailItems, localizeGrailItem, slugifySetName } from '@/lib/grail/catalog';
import SetGroupDetail from '@/components/items/SetGroupDetail';

export function generateStaticParams() {
  return routing.locales.flatMap(locale =>
    setGroups.map(g => ({ locale, setSlug: slugifySetName(g.setName.en) }))
  );
}

export default async function SetGroupPage({
  params,
}: {
  params: Promise<{ locale: string; setSlug: string }>;
}) {
  const { locale, setSlug } = await params;
  setRequestLocale(locale);

  const group = setGroups.find(g => slugifySetName(g.setName.en) === setSlug);
  if (!group) notFound();

  const t = await getTranslations('Items');
  const loc = locale as 'en' | 'zh-TW' | 'zh-CN';
  const pieces = getAllGrailItems()
    .filter(i => group.pieceIds.includes(i.id))
    .map(i => localizeGrailItem(i, loc));
  const partialBonuses = group.partialBonuses.map(p => ({
    piecesRequired: p.piecesRequired,
    stats: p.stats.map(s => ({ key: s.key, label: s.label[loc], min: s.min, max: s.max, isSkillRef: s.isSkillRef })),
  }));
  const fullSetBonuses = group.fullSetBonuses.map(s => ({ key: s.key, label: s.label[loc], min: s.min, max: s.max, isSkillRef: s.isSkillRef }));

  return (
    <main className="flex flex-col items-center py-10 px-4 gap-6 flex-1 w-full">
      <div className="w-full max-w-4xl flex flex-col gap-4">
        <div className="flex items-center justify-end">
          <Link href={`/${locale}/items/set`} className="text-sm text-muted hover:text-gold-bright transition-colors">
            {t('backToCategories')}
          </Link>
        </div>
        <SetGroupDetail
          setName={group.setName[loc]}
          pieces={pieces}
          partialBonuses={partialBonuses}
          fullSetBonuses={fullSetBonuses}
        />
      </div>
    </main>
  );
}
