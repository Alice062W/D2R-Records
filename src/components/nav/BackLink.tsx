// src/components/nav/BackLink.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

// Every real page route under `src/app/[locale]/...`, as its path segments
// AFTER the locale prefix (e.g. `/en/items/magic/rings` -> `['items',
// 'magic', 'rings']`). Used to find the nearest ANCESTOR page that actually
// exists when walking "up" from a dynamic detail page -- e.g.
// `items/magic/rings` has no page of its own for `items` alone, so its
// "up" target is `items/magic`, not `items`. Kept in sync manually with
// `src/app/[locale]/**/page.tsx` (no dynamic route-manifest is read at
// runtime here since this is a small, slow-changing client component).
const REAL_PAGE_PATHS = new Set([
  'about', 'builds', 'grail', 'profile', 'quests',
  'character/auras', 'character/fcr-fhr-fbr', 'character/level-up',
  'items/base', 'items/crafted', 'items/cube-recipes', 'items/magic',
  'items/rare', 'items/runes', 'items/runewords', 'items/set',
  'items/set/category', 'items/unique',
  'misc/max-sockets', 'monster/alvl85', 'monster/area-level',
]);

// Renders a "← Back to parent category" link on every page except the
// homepage. Walks up the current path one segment at a time until it finds
// a segment sequence that's a REAL page (see above); falls back to the
// locale homepage if no ancestor page exists (e.g. from a flat page like
// `/character/auras`, whose only real ancestor is home).
export default function BackLink() {
  const pathname = usePathname();
  const t = useTranslations('Nav');
  const segments = pathname.split('/').filter(Boolean);
  const locale = segments[0];
  const rest = segments.slice(1);

  if (!locale || rest.length === 0) return null; // homepage: no back link

  let target = `/${locale}`;
  for (let end = rest.length - 1; end > 0; end--) {
    const candidate = rest.slice(0, end).join('/');
    if (REAL_PAGE_PATHS.has(candidate)) {
      target = `/${locale}/${candidate}`;
      break;
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 pt-4">
      <Link
        href={target}
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-gold-bright transition-colors"
      >
        <span aria-hidden="true">←</span>
        {t('backToParentLabel')}
      </Link>
    </div>
  );
}
