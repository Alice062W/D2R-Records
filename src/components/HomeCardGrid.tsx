'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { NAV_GROUPS, PERCENT_LINK_KEYS, PERCENT_ID_LISTS, collectionState } from '@/lib/navGroups';
import { useOwnedItems } from '@/lib/grail/useOwnedItems';
import CollectionBadge from './items/CollectionBadge';
import ChronicleRewardCard from './ChronicleRewardCard';

const CHRONICLE_ART: Partial<Record<(typeof PERCENT_LINK_KEYS)[number], { src: string; glowColor: string }>> = {
  item_unique: { src: '/images/chronicle/unique.png', glowColor: 'rgba(168,85,247,0.55)' },
  item_set: { src: '/images/chronicle/set.png', glowColor: 'rgba(250,204,21,0.5)' },
  item_runewords: { src: '/images/chronicle/runewords.png', glowColor: 'rgba(245,158,11,0.55)' },
};

export default function HomeCardGrid() {
  const tNav = useTranslations('Nav');
  const locale = useLocale();
  const { userId, ownedIds } = useOwnedItems();

  return (
    <div className="w-full max-w-4xl flex flex-col gap-8">
      {NAV_GROUPS.map(group => {
        if (group.key === 'group_myChronicle') {
          return (
            <section key={group.key} className="flex flex-col gap-3">
              <h2 className="text-lg font-cinzel text-parchment-bright">{tNav(group.key as never)}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-xl">
                {group.links.map(link => {
                  const idList = PERCENT_ID_LISTS[link.key as (typeof PERCENT_LINK_KEYS)[number]];
                  const tracked = !!(userId && idList);
                  const { owned, total, state } = tracked
                    ? collectionState(idList, ownedIds)
                    : { owned: 0, total: 0, state: 'none' as const };
                  const art = CHRONICLE_ART[link.key as (typeof PERCENT_LINK_KEYS)[number]];
                  if (!art) return null;
                  return (
                    <ChronicleRewardCard
                      key={link.key}
                      href={`/${locale}/${link.path}`}
                      label={tNav(link.key as never)}
                      imageSrc={art.src}
                      glowColor={art.glowColor}
                      tracked={tracked}
                      owned={owned}
                      total={total}
                      state={state}
                    />
                  );
                })}
              </div>
            </section>
          );
        }

        return (
        <section key={group.key} className="flex flex-col gap-3">
          <h2 className="text-lg font-cinzel text-parchment-bright">{tNav(group.key as never)}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {group.links.map(link => {
              const idList = PERCENT_ID_LISTS[link.key as (typeof PERCENT_LINK_KEYS)[number]];
              const tracked = userId && idList;
              const { owned, total, state } = tracked
                ? collectionState(idList, ownedIds)
                : { owned: 0, total: 0, state: 'none' as const };
              return (
                <Link
                  key={link.key}
                  href={`/${locale}/${link.path}`}
                  className={`flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-xl border text-sm font-semibold font-cinzel hover:border-gold hover:text-gold-bright transition-colors ${
                    tracked && state === 'complete'
                      ? 'bg-green-950/30 border-green-600/50 text-parchment-bright'
                      : tracked && state === 'partial'
                        ? 'bg-amber-950/20 border-amber-600/40 text-parchment-bright'
                        : `bg-panel border-panel-border ${link.colorClass ?? 'text-parchment-bright'}`
                  }`}
                >
                  <span className="text-2xl" aria-hidden="true">{link.icon}</span>
                  {tNav(link.key as never)}
                  {tracked && <CollectionBadge owned={owned} total={total} />}
                </Link>
              );
            })}
          </div>
        </section>
        );
      })}
    </div>
  );
}
