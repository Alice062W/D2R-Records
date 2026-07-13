'use client';

import type { GrailItem } from '@/lib/grail/catalog';
import type { FindRecord } from '@/lib/grail/findsApi';
import { sortFindsByRank } from '@/lib/grail/bestCopy';

export default function GrailItemDetail({
  item,
  finds,
  onClose,
}: {
  item: GrailItem;
  finds: FindRecord[];
  onClose: () => void;
}) {
  const sorted = sortFindsByRank(finds, item.statPriority);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-zinc-100">{item.name}</h3>
            {item.setName && <p className="text-xs text-amber-400">{item.setName}</p>}
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">✕</button>
        </div>

        {item.fixedStats.length > 0 && (
          <div className="mb-4 text-xs text-zinc-400 flex flex-col gap-0.5">
            {item.fixedStats.map(f => (
              <div key={f.key}>{f.label}: {f.value}</div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {sorted.map((find, i) => (
            <div key={find.id} className="border border-zinc-700 rounded-lg p-3 bg-zinc-800/50">
              <div className="flex justify-between text-xs text-zinc-500 mb-2">
                <span>{i === 0 ? 'Best copy' : `Copy #${i + 1}`}</span>
                <span>{find.foundAt}{find.ethereal ? ' · Ethereal' : ''}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                {item.stats.map(stat => (
                  <div key={stat.key} className="text-zinc-300">
                    {stat.label}: <span className="font-semibold">{find.statValues[stat.key] ?? '—'}</span>
                    <span className="text-zinc-600 text-xs"> ({stat.min}-{stat.max})</span>
                  </div>
                ))}
              </div>
              {(find.foundAct || find.foundArea) && (
                <p className="text-xs text-zinc-500 mt-2">
                  {[find.foundAct, find.foundArea].filter(Boolean).join(' · ')}
                </p>
              )}
              {find.notes && <p className="text-xs text-zinc-500 mt-1 italic">{find.notes}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
