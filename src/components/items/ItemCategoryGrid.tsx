'use client';

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

  const slots = SLOT_ORDER.filter(slot => items.some(i => i.slotCategory === slot));

  return (
    <nav className="flex flex-col gap-0.5">
      {slots.map(slot => {
        const active = slot === activeSlot;
        return (
          <button
            key={slot}
            onClick={() => onSelect(slot)}
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
}
