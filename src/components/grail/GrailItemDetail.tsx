// src/components/grail/GrailItemDetail.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { GrailItem } from '@/lib/grail/catalog';
import type { FindRecord } from '@/lib/grail/findsApi';
import { sortFindsByRank } from '@/lib/grail/bestCopy';
import { BASE_PATH } from '@/lib/basePath';

// Authentic D2 item-rarity text colors (verified against d2r.world's computed styles).
const NAME_COLOR: Record<GrailItem['kind'], string> = {
  unique: 'text-[#cbb87f]',
  set: 'text-[#22ff55]',
};

export default function GrailItemDetail({
  item,
  finds,
}: {
  item: GrailItem;
  finds: FindRecord[];
}) {
  const t = useTranslations('Grail');
  const sorted = sortFindsByRank(finds, item.statPriority);
  const [iconFailed, setIconFailed] = useState(false);
  const [hdIconFailed, setHdIconFailed] = useState(false);

  const itemStatRows: [string, string][] = [
    [t('baseLabel'), item.baseName],
    [t('gradeLabel'), t(`grade_${item.grade}`)],
    ...(item.defense ? [[t('defenseLabel'), `${item.defense.min}–${item.defense.max}`] as [string, string]] : []),
    [t('requiredLevel'), String(item.levelReq)],
    ...(item.requiredStrength != null ? [[t('requiredStrength'), String(item.requiredStrength)] as [string, string]] : []),
    ...(item.durability != null ? [[t('durabilityLabel'), String(item.durability)] as [string, string]] : []),
  ];

  // Only variable-roll properties can be recorded per-find; fixed properties
  // and set bonuses are identical on every copy of the item, nothing to log.
  const variableProps = item.properties.filter(p => p.variable);

  return (
    <div className="bg-panel border border-panel-border rounded-xl p-6">
      <div className="mb-1 flex items-start gap-3">
        {(item.hdIcon || item.invFile) && !iconFailed && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={
              item.hdIcon && !hdIconFailed
                ? `${BASE_PATH}/items/hd/${item.hdIcon}.png`
                : `${BASE_PATH}/items/inv/${item.invFile}.png`
            }
            alt=""
            aria-hidden="true"
            className="w-20 h-20 object-contain shrink-0"
            onError={() => {
              if (item.hdIcon && !hdIconFailed) setHdIconFailed(true);
              else setIconFailed(true);
            }}
          />
        )}
        <div>
          <h3 className={`text-lg font-bold ${NAME_COLOR[item.kind]}`}>{item.name}</h3>
          <p className="text-xs text-muted">{item.baseName}</p>
          {item.setName && <p className="text-xs text-[#22ff55]">{item.setName}</p>}
        </div>
      </div>

      <div className="mt-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">{t('itemStats')}</h4>
        <div className="text-sm text-parchment flex flex-col gap-0.5">
          {itemStatRows.map(([label, value]) => (
            <div key={label}>{label}: <span className="text-parchment-bright">{value}</span></div>
          ))}
        </div>
      </div>

      {item.properties.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">{t('magicProperties')}</h4>
          <div className="text-sm flex flex-col gap-0.5">
            {item.properties.map((p, i) => (
              <div key={`${p.code}-${i}`} className="text-[#fff818]">{p.label}</div>
            ))}
          </div>
        </div>
      )}

      {item.setFullBonus.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">{t('setBonusesLabel')}</h4>
          <div className="text-sm flex flex-col gap-0.5">
            {item.setFullBonus.map((p, i) => (
              <div key={`${p.code}-${i}`} className="text-[#22ff55]">{p.label}</div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">{t('yourCopies')}</h4>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-dark italic">{t('notFoundYet')}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {sorted.map((find, i) => (
              <div key={find.id} className="border border-panel-border rounded-lg p-3 bg-panel-alt/50">
                <div className="flex justify-between text-xs text-muted mb-2">
                  <span>{i === 0 ? t('bestCopy') : t('copyNumber', { number: i + 1 })}</span>
                  <span>{find.foundAt}{find.ethereal ? ` · ${t('ethereal')}` : ''}</span>
                </div>
                {variableProps.length > 0 ? (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    {variableProps.map(p => (
                      <div key={p.code} className="text-parchment">
                        {p.label}: <span className="font-semibold">{find.statValues[p.code] ?? '—'}</span>
                        <span className="text-muted-dark text-xs"> ({p.min}–{p.max})</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-dark italic">{t('noVariableStats')}</p>
                )}
                {(find.foundAct || find.foundArea) && (
                  <p className="text-xs text-muted mt-2">
                    {[find.foundAct, find.foundArea].filter(Boolean).join(' · ')}
                  </p>
                )}
                {find.notes && <p className="text-xs text-muted mt-1 italic">{find.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
