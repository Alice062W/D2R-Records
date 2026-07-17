'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { SLOT_ORDER, type GrailItem } from '@/lib/grail/catalog';
import type { FindRecord } from '@/lib/grail/findsApi';

export default function GrailCategorySidebar({
  items,
  findsById,
  activeSlot,
  onSelect,
}: {
  items: GrailItem[];
  findsById: Map<string, FindRecord[]>;
  activeSlot: string | null;
  onSelect: (slot: string) => void;
}) {
  const t = useTranslations('Grail');
  const [mobileOpen, setMobileOpen] = useState(false);

  const slots = SLOT_ORDER.filter(slot => items.some(i => i.slotCategory === slot));

  function countsFor(slot: string) {
    const slotItems = items.filter(i => i.slotCategory === slot);
    const found = slotItems.filter(i => (findsById.get(i.id)?.length ?? 0) > 0).length;
    return { found, total: slotItems.length };
  }

  function handleSelect(slot: string) {
    onSelect(slot);
    setMobileOpen(false);
  }

  const list = (
    <nav className="flex flex-col gap-0.5">
      {slots.map(slot => {
        const { found, total } = countsFor(slot);
        const active = slot === activeSlot;
        return (
          <button
            key={slot}
            onClick={() => handleSelect(slot)}
            aria-current={active ? 'true' : undefined}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left transition-colors ${
              active
                ? 'bg-gold text-ink-950 font-semibold'
                : 'text-parchment hover:bg-panel-alt'
            }`}
          >
            <span>{t(`slot_${slot}`)}</span>
            <span className={`text-xs ${active ? 'text-panel-alt' : 'text-muted'}`}>
              {found}/{total}
            </span>
          </button>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop: persistent left column */}
      <div className="hidden md:block w-56 shrink-0">{list}</div>

      {/* Mobile: collapsible dropdown */}
      <div className="md:hidden">
        <button
          onClick={() => setMobileOpen(v => !v)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-panel-border bg-panel text-sm text-parchment-bright"
        >
          <span>{activeSlot ? t(`slot_${activeSlot}`) : t('categoriesLabel')}</span>
          <span className="text-muted">{mobileOpen ? '▲' : '▼'}</span>
        </button>
        {mobileOpen && (
          <div className="mt-1 border border-panel-border rounded-lg bg-panel p-1 max-h-80 overflow-y-auto">
            {list}
          </div>
        )}
      </div>
    </>
  );
}
