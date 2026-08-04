'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Aura } from '@/lib/grail/auras';
import { BASE_PATH } from '@/lib/basePath';

function MapAuraIcon({ id }: { id: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${BASE_PATH}/skills/icons/${id}.png`}
      alt=""
      aria-hidden="true"
      className="w-8 h-8 object-contain shrink-0 rounded border border-panel-border"
      onError={() => setFailed(true)}
    />
  );
}

// A clickable grid of all 20 Paladin auras shown above the full aura list —
// clicking an aura scrolls the page down to its detail card in AuraList,
// which carries a matching `id` for this to target.
export default function AuraMap({ auras }: { auras: Aura[] }) {
  const t = useTranslations('Items');

  return (
    <div className="w-full bg-panel border border-panel-border rounded-xl p-4">
      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2">
        {auras.map(aura => (
          <a
            key={aura.id}
            href={`#${aura.id}`}
            className="flex flex-col items-center gap-1 px-2 py-3 rounded-lg border border-panel-border bg-panel-alt hover:border-gold hover:bg-panel transition-colors text-center"
          >
            <MapAuraIcon id={aura.id} />
            <span className="text-xs font-semibold text-[#cbb87f]">{t(aura.nameKey)}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
