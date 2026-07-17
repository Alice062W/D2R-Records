'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BASE_PATH } from '@/lib/basePath';

function GroupIcon({ invFile }: { invFile: string }) {
  const [iconFailed, setIconFailed] = useState(false);
  if (!invFile || iconFailed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${BASE_PATH}/items/inv/${invFile}.png`}
      alt=""
      aria-hidden="true"
      className="w-10 h-10 object-contain shrink-0"
      onError={() => setIconFailed(true)}
    />
  );
}

export default function SetGroupList({
  groups,
  basePath,
}: {
  groups: { slug: string; name: string; repInvFile: string }[];
  basePath: string;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
      {groups.map(g => (
        <Link
          key={g.slug}
          href={`${basePath}/${g.slug}`}
          className="flex items-center gap-3 px-4 py-4 rounded-xl bg-panel border border-panel-border text-[#22ff55] font-semibold font-cinzel hover:border-gold transition-colors"
        >
          <GroupIcon invFile={g.repInvFile} />
          {g.name}
        </Link>
      ))}
    </div>
  );
}
