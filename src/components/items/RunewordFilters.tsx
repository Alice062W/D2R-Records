'use client';

import { useTranslations } from 'next-intl';

export const MODE_OPTIONS = ['ladder', 'nonladder'] as const;
export type ModeFilter = (typeof MODE_OPTIONS)[number];

export default function RunewordFilters({
  itemTypes,
  activeType,
  onTypeChange,
  activeSockets,
  onSocketsChange,
  activeMode,
  onModeChange,
}: {
  itemTypes: string[];
  activeType: string | null;
  onTypeChange: (type: string | null) => void;
  activeSockets: number | null;
  onSocketsChange: (sockets: number | null) => void;
  activeMode: ModeFilter | null;
  onModeChange: (mode: ModeFilter | null) => void;
}) {
  const t = useTranslations('Items');
  const tGrail = useTranslations('Grail');
  const socketOptions = [2, 3, 4, 5, 6];

  function pill(active: boolean) {
    return `px-3 py-1.5 rounded-lg text-sm font-cinzel transition-colors ${
      active
        ? 'bg-gold text-ink-950 font-semibold'
        : 'bg-panel border border-panel-border text-parchment hover:bg-panel-alt'
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
            {tGrail(`slot_${type}` as never)}
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
      <div className="flex flex-wrap gap-2">
        <button onClick={() => onModeChange(null)} className={pill(activeMode === null)}>
          {t('runewordsAllModes')}
        </button>
        {MODE_OPTIONS.map(mode => (
          <button key={mode} onClick={() => onModeChange(mode)} className={pill(activeMode === mode)}>
            {t(mode === 'ladder' ? 'runewordsModeLadder' : 'runewordsModeNonLadder')}
          </button>
        ))}
      </div>
    </div>
  );
}
