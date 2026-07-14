'use client';

import { useTranslations } from 'next-intl';
import type { GrailItem } from '@/lib/grail/catalog';
import type { FindRecord } from '@/lib/grail/findsApi';
import { sortFindsByRank } from '@/lib/grail/bestCopy';

const NAME_COLOR: Record<GrailItem['kind'], string> = {
  unique: 'text-amber-300',
  set: 'text-green-400',
};

export default function GrailItemDetail({
  item,
  finds,
  onClose,
}: {
  item: GrailItem;
  finds: FindRecord[];
  onClose: () => void;
}) {
  const t = useTranslations('Grail');
  const sorted = sortFindsByRank(finds, item.statPriority);

  const itemStatRows: [string, string][] = [
    [t('baseLabel'), item.baseName],
    [t('gradeLabel'), t(`grade_${item.grade}`)],
    ...(item.defense ? [[t('defenseLabel'), `${item.defense.min}–${item.defense.max}`] as [string, string]] : []),
    [t('requiredLevel'), String(item.levelReq)],
    ...(item.requiredStrength != null ? [[t('requiredStrength'), String(item.requiredStrength)] as [string, string]] : []),
    ...(item.durability != null ? [[t('durabilityLabel'), String(item.durability)] as [string, string]] : []),
  ];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-1">
          <div>
            <h3 className={`text-lg font-bold ${NAME_COLOR[item.kind]}`}>{item.name}</h3>
            <p className="text-xs text-zinc-400">{item.baseName}</p>
            {item.setName && <p className="text-xs text-green-500">{item.setName}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="text-zinc-500 hover:text-zinc-300">✕</button>
        </div>

        <div className="mt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">{t('itemStats')}</h4>
          <div className="text-sm text-zinc-300 flex flex-col gap-0.5">
            {itemStatRows.map(([label, value]) => (
              <div key={label}>{label}: <span className="text-zinc-100">{value}</span></div>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">{t('magicProperties')}</h4>
          <div className="text-sm text-blue-400 flex flex-col gap-0.5">
            {item.stats.map(stat => (
              <div key={stat.key}>{stat.label}: {stat.min}–{stat.max}</div>
            ))}
            {item.fixedStats.map(f => (
              <div key={f.key}>{f.label}: {f.value}</div>
            ))}
          </div>
        </div>

        {item.setBonuses.length > 0 && (
          <div className="mt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">{t('setBonusesLabel')}</h4>
            <div className="text-sm text-green-500 flex flex-col gap-0.5">
              {item.setBonuses.map((b, i) => (
                <div key={`${b.key}-${i}`}>{b.label}: {b.min === b.max ? b.min : `${b.min}–${b.max}`}</div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">{t('yourCopies')}</h4>
          {sorted.length === 0 ? (
            <p className="text-sm text-zinc-600 italic">{t('notFoundYet')}</p>
          ) : (
            <div className="flex flex-col gap-3">
              {sorted.map((find, i) => (
                <div key={find.id} className="border border-zinc-700 rounded-lg p-3 bg-zinc-800/50">
                  <div className="flex justify-between text-xs text-zinc-500 mb-2">
                    <span>{i === 0 ? t('bestCopy') : t('copyNumber', { number: i + 1 })}</span>
                    <span>{find.foundAt}{find.ethereal ? ` · ${t('ethereal')}` : ''}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    {item.stats.map(stat => (
                      <div key={stat.key} className="text-zinc-300">
                        {stat.label}: <span className="font-semibold">{find.statValues[stat.key] ?? '—'}</span>
                        <span className="text-zinc-600 text-xs"> ({stat.min}–{stat.max})</span>
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
          )}
        </div>
      </div>
    </div>
  );
}
