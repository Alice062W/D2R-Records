'use client';

import { useState } from 'react';
import { BASE_PATH } from '@/lib/basePath';

// Rarity-tinted radial-gradient plates behind item icons, matching the
// look of popular D2R companion apps (light source upper-left, fading to
// a darker rarity-tinted edge) instead of a flat/transparent background.
export type ItemIconKind = 'base' | 'magic' | 'rare' | 'set' | 'unique' | 'rune' | 'crafted' | 'runeword';

const FRAME_GRADIENT: Record<ItemIconKind, string> = {
  base: 'radial-gradient(circle at 32% 24%, #f4f1e8 0%, #cac4b0 45%, #837c68 100%)',
  magic: 'radial-gradient(circle at 32% 24%, #c3caff 0%, #5c65c7 45%, #262a5e 100%)',
  rare: 'radial-gradient(circle at 32% 24%, #fff8c2 0%, #d6bd4a 45%, #5f4f16 100%)',
  set: 'radial-gradient(circle at 32% 24%, #bdf5c9 0%, #3f9d52 45%, #163d1e 100%)',
  unique: 'radial-gradient(circle at 32% 24%, #ecdcb2 0%, #a3813f 45%, #40300f 100%)',
  runeword: 'radial-gradient(circle at 32% 24%, #ecdcb2 0%, #a3813f 45%, #40300f 100%)',
  rune: 'radial-gradient(circle at 32% 24%, #ffdba3 0%, #d4791f 45%, #5c2e0a 100%)',
  crafted: 'radial-gradient(circle at 32% 24%, #ffdba3 0%, #d4791f 45%, #5c2e0a 100%)',
};

export default function ItemIconFrame({
  invFile,
  kind,
  sizeClass = 'w-12 h-12',
  className = '',
}: {
  invFile: string | null | undefined;
  kind: ItemIconKind;
  sizeClass?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!invFile || failed) return null;

  return (
    <div
      className={`relative rounded-md overflow-hidden shrink-0 ring-1 ring-black/40 ${sizeClass} ${className}`}
      style={{ backgroundImage: FRAME_GRADIENT[kind] }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${BASE_PATH}/items/inv/${invFile}.png`}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-contain p-0.5"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
