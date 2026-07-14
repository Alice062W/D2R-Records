'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { SLOT_ORDER, type GrailItem } from '@/lib/grail/catalog';

export default function ItemCategoryGrid({
  items,
  activeSlot,
  onSelect,
}: {
  items: GrailItem[];
  activeSlot: string | null;
  onSelect: (slot: string) => void;
}) {
  const t = useTranslations('Grail');
  const [mobileOpen, setMobileOpen] = useState(false);

  const slots = SLOT_ORDER.filter(slot => items.some(i => i.slotCategory === slot));

  function handleSelect(slot: string) {
    onSelect(slot);
    setMobileOpen(false);
  }

  const list = (
    <nav className="flex flex-col gap-0.5">
      {slots.map(slot => {
        const active = slot === activeSlot;
        return (
          <button
            key={slot}
            onClick={() => handleSelect(slot)}
            aria-current={active ? 'true' : undefined}
            className={`px-3 py-2 rounded-lg text-sm text-left transition-colors ${
              active
                ? 'bg-amber-500 text-zinc-950 font-semibold'
                : 'text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            {t(`slot_${slot}`)}
          </button>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop: persistent left column */}
      <div className="hidden md:block w-56 shrink-0" data-testid="item-category-desktop-list">
        {list}
      </div>

      {/* Mobile: collapsible dropdown */}
      <div className="md:hidden">
        <button
          onClick={() => setMobileOpen(v => !v)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-sm text-zinc-200"
        >
          <span>{activeSlot ? t(`slot_${activeSlot}`) : t('categoriesLabel')}</span>
          <span className="text-zinc-500">{mobileOpen ? '▲' : '▼'}</span>
        </button>
        {mobileOpen && (
          <div className="mt-1 border border-zinc-700 rounded-lg bg-zinc-900 p-1 max-h-80 overflow-y-auto">
            {list}
          </div>
        )}
      </div>
    </>
  );
}
