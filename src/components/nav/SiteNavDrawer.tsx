'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';

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
      <div className="flex items-center border-b border-panel-border-dark px-4 py-3 gap-3">
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
          className="text-sm font-semibold font-cinzel text-parchment-bright hover:text-gold-bright transition-colors"
        >
          D2R Institute
        </Link>
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
              {GAME_ITEM_LINKS.map(([key, path, colorClass]) => (
                <NavLink key={key} href={linkHref(path)} onNavigate={close} colorClass={colorClass}>
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
}: {
  href: string;
  onNavigate: () => void;
  children: React.ReactNode;
  colorClass?: string;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`px-3 py-2 rounded-lg text-sm font-cinzel hover:bg-panel-alt transition-colors ${colorClass ?? 'text-parchment hover:text-gold-bright'}`}
    >
      {children}
    </Link>
  );
}
