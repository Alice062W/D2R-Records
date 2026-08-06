'use client';

import { useState } from 'react';
import { BASE_PATH } from '@/lib/basePath';

export default function CategoryRecipeIcon({ invFile, hdIcon }: { invFile: string | null; hdIcon?: string | null }) {
  const [iconFailed, setIconFailed] = useState(false);
  const [hdIconFailed, setHdIconFailed] = useState(false);
  if ((!invFile && !hdIcon) || iconFailed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={hdIcon && !hdIconFailed ? `${BASE_PATH}/items/hd/${hdIcon}.png` : `${BASE_PATH}/items/inv/${invFile}.png`}
      alt=""
      aria-hidden="true"
      className="w-12 h-12 object-contain shrink-0"
      onError={() => {
        if (hdIcon && !hdIconFailed) setHdIconFailed(true);
        else setIconFailed(true);
      }}
    />
  );
}
