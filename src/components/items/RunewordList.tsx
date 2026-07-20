'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type runewordsFullJson from '../../../data/runewords-full.json';
import { BASE_PATH } from '@/lib/basePath';
import { useOwnedItems } from '@/lib/grail/useOwnedItems';

type Runeword = (typeof runewordsFullJson)[number];

function RuneIcon({ invFile }: { invFile: string }) {
  const [iconFailed, setIconFailed] = useState(false);
  if (!invFile || iconFailed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${BASE_PATH}/items/inv/${invFile}.png`}
      alt=""
      aria-hidden="true"
      className="w-6 h-6 object-contain inline-block"
      onError={() => setIconFailed(true)}
    />
  );
}

export default function RunewordList({ runewords, locale }: { runewords: Runeword[]; locale: 'en' | 'zh-TW' | 'zh-CN' }) {
  const t = useTranslations('Items');
  const tGrail = useTranslations('Grail');
  const { userId, ownedIds, toggle, error } = useOwnedItems();

  return (
    <div className="flex flex-col gap-4 w-full">
      {error && <p className="text-sm text-red-400">{error}</p>}
      {runewords.map(rw => (
        <div key={rw.id} className="bg-panel border border-panel-border rounded-xl p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#cbb87f]">{rw.name[locale]}</h3>
            <div className="flex items-center gap-2">
              {rw.ladderOnly && (
                <span className="text-xs px-2 py-1 rounded bg-panel-alt text-muted">
                  {t('runewordsLadderOnly')}
                </span>
              )}
              {userId && (
                <label className="flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={ownedIds.has(rw.id)}
                    onChange={() => toggle(rw.id, 'runeword')}
                    className="w-4 h-4 accent-amber-400"
                    aria-label={tGrail('ownedCheckboxLabel')}
                  />
                </label>
              )}
            </div>
          </div>
          <div className="mt-2 text-sm text-parchment flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span>{t('runewordsRunesLabel')}:</span>
              {rw.runes.map((rune, i) => (
                <span key={`${rune.en}-${i}`} className="flex items-center gap-1">
                  <RuneIcon invFile={rw.runeInvFiles[i]} />
                  {rune[locale]}
                </span>
              ))}
            </div>
            <div>{t('runewordsSocketsLabel')}: {rw.sockets}</div>
            <div>{t('runewordsBaseTypesLabel')}: {rw.itemTypes.map(type => tGrail(`slot_${type}` as never)).join(', ')}</div>
            {rw.levelReq > 0 && <div>{t('runewordsLevelReqLabel')}: {rw.levelReq}</div>}
          </div>
          {(rw.stats.length > 0 || rw.fixedStats.length > 0) && (
            <div className="mt-4">
              <div className="text-sm flex flex-col gap-0.5">
                {rw.stats.map(stat => (
                  <div key={stat.key} className={stat.isSkillRef ? 'text-[#ff4a69]' : 'text-[#fff818]'}>
                    {stat.label[locale]}: {stat.min}–{stat.max} <span aria-hidden="true">🎲</span>
                  </div>
                ))}
                {rw.fixedStats.map(f => (
                  <div key={f.key} className={f.isSkillRef ? 'text-[#ff4a69]' : 'text-[#8080f3]'}>
                    {f.label[locale]}: {f.value}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
