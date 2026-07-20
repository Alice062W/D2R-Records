'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BASE_PATH } from '@/lib/basePath';
import { useOwnedItems } from '@/lib/grail/useOwnedItems';
import CollectionBadge from './CollectionBadge';

function GroupIcon({ invFile }: { invFile: string }) {
  const [iconFailed, setIconFailed] = useState(false);
  if (!invFile || iconFailed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${BASE_PATH}/items/inv/${invFile}.png`}
      alt=""
      aria-hidden="true"
      className="w-12 h-12 object-contain shrink-0"
      onError={() => setIconFailed(true)}
    />
  );
}

export default function SetGroupList({
  groups,
  basePath,
}: {
  groups: { slug: string; name: string; repInvFile: string; pieceIds: string[] }[];
  basePath: string;
}) {
  const { userId, ownedIds } = useOwnedItems();

  return (
    // Matches CategoryCardGrid's layout (same breakpoints, centered
    // icon-over-label tile) so the two Set browsing modes look consistent.
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 w-full">
      {groups.map(g => {
        const total = g.pieceIds.length;
        const owned = g.pieceIds.filter(id => ownedIds.has(id)).length;
        const complete = userId && total > 0 && owned === total;
        const partial = userId && total > 0 && owned > 0 && owned < total;
        return (
          <Link
            key={g.slug}
            href={`${basePath}/${g.slug}`}
            className={`flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-xl border text-sm text-center text-[#22ff55] font-semibold font-cinzel hover:border-gold transition-colors ${
              complete ? 'bg-green-950/30 border-green-600/50' : partial ? 'bg-amber-950/20 border-amber-600/40' : 'bg-panel border-panel-border'
            }`}
          >
            <GroupIcon invFile={g.repInvFile} />
            {g.name}
            {userId && <CollectionBadge owned={owned} total={total} />}
          </Link>
        );
      })}
    </div>
  );
}
