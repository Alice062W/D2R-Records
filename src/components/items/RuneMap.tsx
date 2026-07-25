'use client';

import { useState } from 'react';
import type runesJson from '../../../data/runes.json';
import { BASE_PATH } from '@/lib/basePath';

type Rune = (typeof runesJson)[number];
type Locale = 'en' | 'zh-TW' | 'zh-CN';

function MapRuneIcon({ invFile }: { invFile: string }) {
  const [iconFailed, setIconFailed] = useState(false);
  if (!invFile || iconFailed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${BASE_PATH}/items/inv/${invFile}.png`}
      alt=""
      aria-hidden="true"
      className="w-8 h-8 object-contain shrink-0"
      onError={() => setIconFailed(true)}
    />
  );
}

// A clickable grid of all 33 runes (El -> Zod) shown above the full rune
// list — clicking a rune scrolls the page down to its detail card in
// RuneList, which carries a matching `id` for this to target.
export default function RuneMap({ runes, locale }: { runes: Rune[]; locale: Locale }) {
  return (
    <div className="w-full bg-panel border border-panel-border rounded-xl p-4">
      <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-9 gap-2">
        {runes.map(rune => (
          <a
            key={rune.id}
            href={`#${rune.id}`}
            className="flex flex-col items-center gap-1 px-2 py-3 rounded-lg border border-panel-border bg-panel-alt hover:border-gold hover:bg-panel transition-colors text-center"
          >
            <MapRuneIcon invFile={rune.invFile} />
            <span className="text-xs font-semibold text-[#cbb87f]">{rune.name[locale]}</span>
            <span className="text-[10px] text-muted">#{rune.number}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
