'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import AccountButton from '@/components/grail/AccountButton';
import runewordsFull from '../../../data/runewords-full.json';
import { getAllItemIdsForKind } from '@/lib/grail/catalog';
import { useOwnedItems } from '@/lib/grail/useOwnedItems';

// Third element is the authentic D2/d2r.world rarity-tint color for that section's nav
// label (verified against d2r.world's own computed styles) — omitted where d2r.world
// itself uses the default white/neutral text (Base Items, Cube Recipes).
const GAME_ITEM_LINKS = [
  ['item_base', 'items/base', undefined],
  ['item_magic', 'items/magic', 'text-[#8080f3]'],
  ['item_rare', 'items/rare', 'text-[#eeee75]'],
  ['item_set', 'items/set', 'text-[#22ff55]'],
  ['item_unique', 'items/unique', 'text-[#cbb87f]'],
  ['item_runes', 'items/runes', 'text-[#ee7a03]'],
  ['item_runewords', 'items/runewords', 'text-[#cbb87f]'],
  ['item_cubeRecipes', 'items/cube-recipes', undefined],
  ['item_crafted', 'items/crafted', 'text-[#ee7a03]'],
] as const;

const MISC_LINKS = [
  ['misc_fcrFhrFbr', 'character/fcr-fhr-fbr'],
  ['misc_alvl85', 'monster/alvl85'],
  ['misc_areaLevel', 'monster/area-level'],
  ['misc_levelUp', 'character/level-up'],
  ['misc_maxSockets', 'misc/max-sockets'],
  ['misc_auras', 'character/auras'],
] as const;

const TOOL_LINKS = [
  ['tool_appraiser', ''],
  ['tool_grailTracker', 'grail'],
] as const;

const ALL_UNIQUE_IDS = getAllItemIdsForKind('unique');
const ALL_SET_IDS = getAllItemIdsForKind('set');
const ALL_RUNEWORD_IDS = runewordsFull.map(rw => rw.id);

// Nav-link key -> the full id list used to compute its "X%" collection
// badge (only shown once signed in). Every other GAME_ITEM_LINKS entry has
// no percentage.
const PERCENT_ID_LISTS: Partial<Record<string, string[]>> = {
  item_unique: ALL_UNIQUE_IDS,
  item_set: ALL_SET_IDS,
  item_runewords: ALL_RUNEWORD_IDS,
};

function completionPercent(ids: string[], ownedIds: Set<string>): number {
  if (ids.length === 0) return 0;
  return Math.round((ids.filter(id => ownedIds.has(id)).length / ids.length) * 100);
}

export default function SiteNavDrawer() {
  const t = useTranslations('Nav');
  const tFooter = useTranslations('Footer');
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const { userId, ownedIds } = useOwnedItems();

  function close() {
    setOpen(false);
  }

  function linkHref(path: string) {
    return path ? `/${locale}/${path}` : `/${locale}`;
  }

  return (
    <>
      <div className="flex items-center justify-between border-b border-panel-border-dark px-4 py-3 gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setOpen(true)}
            aria-label={t('openMenu')}
            className="text-parchment hover:text-gold-bright transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>
          <Link
            href={linkHref('')}
            className="text-xs sm:text-sm font-semibold font-cinzel text-parchment-bright hover:text-gold-bright transition-colors whitespace-nowrap"
          >
            D2R Institute
          </Link>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="https://ko-fi.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-panel-border text-muted text-sm hover:border-gold hover:text-gold-bright transition-colors"
          >
            ☕ {tFooter('support')}
          </a>
          <AccountButton />
          <LocaleSwitcher />
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div
            data-testid="nav-drawer-backdrop"
            onClick={close}
            className="absolute inset-0 bg-black/60"
          />
          <nav className="relative w-72 max-w-[80vw] h-full bg-ink-950 border-r border-panel-border-dark overflow-y-auto p-4 flex flex-col gap-6">
            <button
              onClick={close}
              aria-label={t('closeMenu')}
              className="self-end text-muted hover:text-gold-bright transition-colors"
            >
              ✕
            </button>

            <NavGroup title={t('group_gameItems')}>
              {GAME_ITEM_LINKS.map(([key, path, colorClass]) => {
                const idList = PERCENT_ID_LISTS[key];
                const percent = userId && idList ? completionPercent(idList, ownedIds) : undefined;
                return (
                  <NavLink key={key} href={linkHref(path)} onNavigate={close} colorClass={colorClass} percent={percent}>
                    {t(key)}
                  </NavLink>
                );
              })}
            </NavGroup>

            <NavGroup title={t('group_misc')}>
              {MISC_LINKS.map(([key, path]) => (
                <NavLink key={key} href={linkHref(path)} onNavigate={close}>
                  {t(key)}
                </NavLink>
              ))}
            </NavGroup>

            <NavGroup title={t('group_ourTools')}>
              {TOOL_LINKS.map(([key, path]) => (
                <NavLink key={key} href={linkHref(path)} onNavigate={close}>
                  {t(key)}
                </NavLink>
              ))}
            </NavGroup>

            <NavLink href={linkHref('about')} onNavigate={close}>
              {t('aboutUs')}
            </NavLink>
          </nav>
        </div>
      )}
    </>
  );
}

function NavGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted px-3 mb-1">
        {title}
      </h3>
      {children}
    </div>
  );
}

function NavLink({
  href,
  onNavigate,
  children,
  colorClass,
  percent,
}: {
  href: string;
  onNavigate: () => void;
  children: React.ReactNode;
  colorClass?: string;
  percent?: number;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`px-3 py-2 rounded-lg text-sm font-cinzel hover:bg-panel-alt transition-colors flex items-center justify-between gap-2 ${colorClass ?? 'text-parchment hover:text-gold-bright'}`}
    >
      <span>{children}</span>
      {percent !== undefined && (
        <span className="text-xs font-sans font-normal text-muted">{percent}%</span>
      )}
    </Link>
  );
}
