'use client';

import { useTranslations } from 'next-intl';

export default function RunewordFilters({
  itemTypes,
  activeType,
  onTypeChange,
  activeSockets,
  onSocketsChange,
}: {
  itemTypes: string[];
  activeType: string | null;
  onTypeChange: (type: string | null) => void;
  activeSockets: number | null;
  onSocketsChange: (sockets: number | null) => void;
}) {
  const t = useTranslations('Items');
  const socketOptions = [2, 3, 4, 5, 6];

  function pill(active: boolean) {
    return `px-3 py-1.5 rounded-lg text-sm transition-colors ${
      active
        ? 'bg-amber-500 text-zinc-950 font-semibold'
        : 'bg-zinc-900 border border-zinc-700 text-zinc-300 hover:bg-zinc-800'
    }`;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => onTypeChange(null)} className={pill(activeType === null)}>
          {t('runewordsAllTypes')}
        </button>
        {itemTypes.map(type => (
          <button key={type} onClick={() => onTypeChange(type)} className={pill(activeType === type)}>
            {type}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => onSocketsChange(null)} className={pill(activeSockets === null)}>
          {t('runewordsAllSockets')}
        </button>
        {socketOptions.map(n => (
          <button key={n} onClick={() => onSocketsChange(n)} className={pill(activeSockets === n)}>
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
