'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';

const GAME_ITEM_LINKS = [
  ['item_base', 'items/base'],
  ['item_magic', 'items/magic'],
  ['item_rare', 'items/rare'],
  ['item_set', 'items/set'],
  ['item_unique', 'items/unique'],
  ['item_runes', 'items/runes'],
  ['item_runewords', 'items/runewords'],
  ['item_cubeRecipes', 'items/cube-recipes'],
  ['item_crafted', 'items/crafted'],
] as const;

const MISC_LINKS = [
  ['misc_fcrFhrFbr', 'character/fcr-fhr-fbr'],
  ['misc_alvl85', 'monster/alvl85'],
  ['misc_areaLevel', 'monster/area-level'],
  ['misc_levelUp', 'character/level-up'],
  ['misc_maxSockets', 'misc/max-sockets'],
] as const;

const TOOL_LINKS = [
  ['tool_appraiser', ''],
  ['tool_grailTracker', 'grail'],
] as const;

export default function SiteNavDrawer() {
  const t = useTranslations('Nav');
  const locale = useLocale();
  const [open, setOpen] = useState(false);

  function close() {
    setOpen(false);
  }

  function linkHref(path: string) {
    return path ? `/${locale}/${path}` : `/${locale}`;
  }

  return (
    <>
      <div className="flex items-center border-b border-zinc-800 px-4 py-3 gap-3">
        <button
          onClick={() => setOpen(true)}
          aria-label={t('openMenu')}
          className="text-zinc-300 hover:text-amber-300 transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-zinc-200">D2R Institute</span>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div
            data-testid="nav-drawer-backdrop"
            onClick={close}
            className="absolute inset-0 bg-black/60"
          />
          <nav className="relative w-72 max-w-[80vw] h-full bg-zinc-950 border-r border-zinc-800 overflow-y-auto p-4 flex flex-col gap-6">
            <button
              onClick={close}
              aria-label={t('closeMenu')}
              className="self-end text-zinc-400 hover:text-amber-300 transition-colors"
            >
              ✕
            </button>

            <NavGroup title={t('group_gameItems')}>
              {GAME_ITEM_LINKS.map(([key, path]) => (
                <NavLink key={key} href={linkHref(path)} onNavigate={close}>
                  {t(key)}
                </NavLink>
              ))}
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
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 px-3 mb-1">
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
}: {
  href: string;
  onNavigate: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800 hover:text-amber-300 transition-colors"
    >
      {children}
    </Link>
  );
}
