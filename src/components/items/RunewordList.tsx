'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type runewordsFullJson from '../../../data/runewords-full.json';
import { BASE_PATH } from '@/lib/basePath';

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

  return (
    <div className="flex flex-col gap-4 w-full">
      {runewords.map(rw => (
        <div key={rw.id} className="bg-panel border border-panel-border rounded-xl p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#cbb87f]">{rw.name[locale]}</h3>
            {rw.ladderOnly && (
              <span className="text-xs px-2 py-1 rounded bg-panel-alt text-muted">
                {t('runewordsLadderOnly')}
              </span>
            )}
          </div>
          <div className="mt-2 text-sm text-parchment flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span>{t('runewordsRunesLabel')}:</span>
              {rw.runes.map((rune, i) => (
                <span key={`${rune}-${i}`} className="flex items-center gap-1">
                  <RuneIcon invFile={rw.runeInvFiles[i]} />
                  {rune}
                </span>
              ))}
            </div>
            <div>{t('runewordsSocketsLabel')}: {rw.sockets}</div>
            <div>{t('runewordsBaseTypesLabel')}: {rw.itemTypes.join(', ')}</div>
            {rw.levelReq > 0 && <div>{t('runewordsLevelReqLabel')}: {rw.levelReq}</div>}
          </div>
          {(rw.stats.length > 0 || rw.fixedStats.length > 0) && (
            <div className="mt-4">
              <div className="text-sm text-[#8080f3] flex flex-col gap-0.5">
                {rw.stats.map(stat => (
                  <div key={stat.key}>{stat.label[locale]}: {stat.min}–{stat.max}</div>
                ))}
                {rw.fixedStats.map(f => (
                  <div key={f.key}>{f.label[locale]}: {f.value}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
