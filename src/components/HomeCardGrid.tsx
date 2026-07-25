'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { NAV_GROUPS, PERCENT_LINK_KEYS, PERCENT_ID_LISTS, completionPercent } from '@/lib/navGroups';
import { useOwnedItems } from '@/lib/grail/useOwnedItems';

export default function HomeCardGrid() {
  const tNav = useTranslations('Nav');
  const locale = useLocale();
  const { userId, ownedIds } = useOwnedItems();

  return (
    <div className="w-full max-w-4xl flex flex-col gap-8">
      {NAV_GROUPS.map(group => (
        <section key={group.key} className="flex flex-col gap-3">
          <h2 className="text-lg font-cinzel text-parchment-bright">{tNav(group.key as never)}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {group.links.map(link => {
              const idList = PERCENT_ID_LISTS[link.key as (typeof PERCENT_LINK_KEYS)[number]];
              const percent = userId && idList ? completionPercent(idList, ownedIds) : undefined;
              return (
                <Link
                  key={link.key}
                  href={`/${locale}/${link.path}`}
                  className={`relative flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-xl border text-sm font-semibold font-cinzel hover:border-gold hover:text-gold-bright transition-colors bg-panel border-panel-border ${link.colorClass ?? 'text-parchment-bright'}`}
                >
                  {percent !== undefined && (
                    <span className="absolute top-2 right-2 text-xs font-sans font-normal text-muted">{percent}%</span>
                  )}
                  <span className="text-2xl" aria-hidden="true">{link.icon}</span>
                  {tNav(link.key as never)}
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
