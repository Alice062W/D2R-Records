'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { FcrFhrFbrTable as TableData } from '@/lib/grail/fcrFhrFbr';

function frameNumbers(columns: { rows: Record<number, string> }[]): number[] {
  const set = new Set<number>();
  for (const col of columns) {
    for (const frame of Object.keys(col.rows)) set.add(Number(frame));
  }
  return Array.from(set).sort((a, b) => a - b);
}

export default function FcrFhrFbrTable({ tables }: { tables: TableData[] }) {
  const t = useTranslations('Items');
  const [selectedId, setSelectedId] = useState(tables[0].id);
  const table = tables.find(tbl => tbl.id === selectedId) ?? tables[0];

  const hasSubheaders = table.fcr.length > 1 || table.fhr.length > 1 || table.fbr.length > 1;
  const frames = frameNumbers([...table.fcr, ...table.fhr, ...table.fbr]);

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-wrap gap-2">
        {tables.map(tbl => (
          <button
            key={tbl.id}
            type="button"
            aria-current={tbl.id === selectedId ? 'true' : undefined}
            onClick={() => setSelectedId(tbl.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tbl.id === selectedId
                ? 'bg-amber-500/20 text-amber-300'
                : 'bg-zinc-800 text-zinc-300 hover:text-amber-300'
            }`}
          >
            {t(`fcrFhrFbrClass_${tbl.id}`)}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto bg-zinc-900 border border-zinc-700 rounded-xl p-4">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th rowSpan={hasSubheaders ? 2 : 1} className="text-left text-xs uppercase text-zinc-500 pb-2 pr-3">
                {t('fcrFhrFbrFramesLabel')}
              </th>
              <th colSpan={table.fcr.length} className="text-left text-xs uppercase text-zinc-500 pb-2 px-3">
                {t('fcrFhrFbrFcrLabel')}
              </th>
              <th colSpan={table.fhr.length} className="text-left text-xs uppercase text-zinc-500 pb-2 px-3">
                {t('fcrFhrFbrFhrLabel')}
              </th>
              <th colSpan={table.fbr.length} className="text-left text-xs uppercase text-zinc-500 pb-2 px-3">
                {t('fcrFhrFbrFbrLabel')}
              </th>
            </tr>
            {hasSubheaders && (
              <tr>
                {[...table.fcr, ...table.fhr, ...table.fbr].map((col, i) => (
                  <th key={i} className="text-left text-xs text-zinc-500 pb-2 px-3 font-medium">
                    {col.label}
                  </th>
                ))}
              </tr>
            )}
          </thead>
          <tbody className="text-zinc-300">
            {frames.map(frame => (
              <tr key={frame}>
                <td className="py-1 pr-3 text-zinc-100 font-semibold">{frame}</td>
                {[...table.fcr, ...table.fhr, ...table.fbr].map((col, i) => (
                  <td key={i} className="py-1 px-3">{col.rows[frame] ?? ''}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
