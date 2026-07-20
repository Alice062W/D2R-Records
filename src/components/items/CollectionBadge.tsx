'use client';

import { useTranslations } from 'next-intl';

export default function CollectionBadge({ owned, total }: { owned: number; total: number }) {
  const t = useTranslations('Grail');
  if (total === 0) return null;
  const complete = owned === total;

  if (complete) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-cinzel
          bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500 text-ink-950
          shadow-[0_0_12px_2px_rgba(251,191,36,0.55)] border border-amber-200"
      >
        🏆 {t('collectionComplete')}
      </span>
    );
  }

  const percent = Math.round((owned / total) * 100);
  const started = owned > 0;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
        started
          ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
          : 'bg-panel-alt border-panel-border text-muted'
      }`}
    >
      {owned}/{total} ({percent}%)
    </span>
  );
}
