'use client';

import { useTranslations } from 'next-intl';

// A row of name links above the runeword list, mirroring D2R.world's
// "jump to a runeword" shortcut bar (https://d2r.world/.../runewords) --
// clicking a name scrolls the page to that runeword's card (which carries
// a matching `id`, see RunewordList). Takes the SAME filtered list the
// page renders as cards, so narrowing by category/sockets/mode/owned
// updates this list identically -- no separate filtering logic to keep
// in sync.
export default function RunewordShortcuts({
  runewords,
  locale,
}: {
  runewords: { id: string; name: Record<'en' | 'zh-TW' | 'zh-CN', string> }[];
  locale: 'en' | 'zh-TW' | 'zh-CN';
}) {
  const t = useTranslations('Items');

  function scrollToCard(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.replaceState(null, '', `#${id}`);
  }

  if (runewords.length === 0) {
    return <p className="text-sm text-muted">{t('runewordsNoMatchesLabel')}</p>;
  }

  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1.5 bg-panel border border-panel-border rounded-xl p-4">
      <span className="text-sm font-cinzel text-parchment-bright shrink-0">{t('runewordsJumpToLabel')}</span>
      {runewords.map((rw, i) => (
        <span key={rw.id} className="flex items-baseline gap-2">
          <a
            href={`#${rw.id}`}
            onClick={e => scrollToCard(e, rw.id)}
            className="text-sm text-gold hover:text-parchment-bright hover:underline transition-colors"
          >
            {rw.name[locale]}
          </a>
          {i < runewords.length - 1 && <span aria-hidden="true" className="text-muted">·</span>}
        </span>
      ))}
    </div>
  );
}
