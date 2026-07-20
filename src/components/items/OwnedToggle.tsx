'use client';

import { useTranslations } from 'next-intl';

export default function OwnedToggle({ owned, onToggle }: { owned: boolean; onToggle: () => void }) {
  const t = useTranslations('Grail');

  return (
    <button
      type="button"
      role="switch"
      aria-checked={owned}
      aria-label={owned ? t('filterCollected') : t('markOwnedLabel')}
      onClick={onToggle}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold font-cinzel
        transition-all duration-150 select-none hover:scale-105 active:scale-95 shrink-0 ${
        owned
          ? 'bg-green-600/20 border border-green-500 text-green-300 shadow-[0_0_8px_1px_rgba(34,197,94,0.4)]'
          : 'bg-panel-alt border border-dashed border-muted text-muted hover:border-gold hover:text-gold-bright'
      }`}
    >
      {owned ? <>✓ {t('filterCollected')}</> : <>+ {t('markOwnedLabel')}</>}
    </button>
  );
}
