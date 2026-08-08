'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type runewordsJson from '../../../data/runewords.json';
import { BASE_PATH } from '@/lib/basePath';
import { useOwnedItems } from '@/lib/grail/useOwnedItems';
import OwnedToggle from './OwnedToggle';

type Runeword = (typeof runewordsJson)[number];
type Locale = 'en' | 'zh-TW' | 'zh-CN';

// A "variable" property is one that can roll to a different value on other
// drops (or, for a runeword, other applications of the same runeword) --
// flagged with a dice icon and bold text, same convention as ItemStatCard.
function PropertyLine({ label, variable }: { label: string; variable: boolean }) {
  return (
    <div className={`flex items-start gap-1.5 ${variable ? 'text-[#fff818] font-bold' : 'text-[#fff818]'}`}>
      <span aria-hidden="true" className="text-muted">•</span>
      <span>
        {label}
        {variable && <span aria-hidden="true" title="Variable roll"> 🎲</span>}
      </span>
    </div>
  );
}

function RuneIcon({ hdIcon, invFile }: { hdIcon: string | null; invFile: string | null }) {
  const [iconFailed, setIconFailed] = useState(false);
  const [hdIconFailed, setHdIconFailed] = useState(false);
  if ((!hdIcon && !invFile) || iconFailed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={hdIcon && !hdIconFailed ? `${BASE_PATH}/items/hd/${hdIcon}.png` : `${BASE_PATH}/items/inv/${invFile}.png`}
      alt=""
      aria-hidden="true"
      className="w-6 h-6 object-contain inline-block"
      onError={() => {
        if (hdIcon && !hdIconFailed) setHdIconFailed(true);
        else setIconFailed(true);
      }}
    />
  );
}

export default function RunewordList({ runewords, locale }: { runewords: Runeword[]; locale: Locale }) {
  const t = useTranslations('Items');
  const tGrail = useTranslations('Grail');
  const { userId, ownedIds, toggle, error } = useOwnedItems();

  return (
    <div className="flex flex-col gap-4 w-full">
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {runewords.map(rw => {
        const owned = userId && ownedIds.has(rw.id);
        return (
        <div id={rw.id} key={rw.id} className={`scroll-mt-24 border rounded-xl p-6 ${owned ? 'bg-green-950/30 border-green-600/50' : 'bg-panel border-panel-border'}`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-[#cbb87f]">{rw.name[locale]}</h3>
              {(rw.isLadderOnly || rw.isNonLadderOnly) && (
                <span className="text-xs px-2 py-1 rounded bg-panel-alt text-muted">
                  {t(rw.isNonLadderOnly ? 'runewordsNonLadderOnly' : 'runewordsLadderOnly')}
                </span>
              )}
            </div>
            {userId && <OwnedToggle owned={!!owned} onToggle={() => toggle(rw.id, 'runeword')} />}
          </div>

          <div className="mt-3 flex flex-row gap-4">
            <div className="flex-1 min-w-0 text-sm text-parchment flex flex-col gap-1">
              <div>{t('runewordsSocketsLabel')}: {rw.sockets}</div>
              <div>{t('runewordsBaseTypesLabel')}: {rw.itemTypes.map(type => tGrail(`slot_${type}` as never)).join(', ')}</div>
              {rw.levelReq > 0 && <div>{t('runewordsLevelReqLabel')}: {rw.levelReq}</div>}

              {rw.stats.length > 0 && (
                <div className="mt-3 flex flex-col gap-0.5">
                  {rw.stats.map((stat, i) => (
                    <PropertyLine key={`${stat.code}-${i}`} label={stat.label[locale]} variable={stat.variable} />
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1 shrink-0 self-start">
              <span className="text-xs text-muted">{t('runewordsRunesLabel')}</span>
              {rw.runes.map((rune, i) => (
                <span key={`${rune.code}-${i}`} className="flex items-center gap-1 text-sm text-parchment">
                  <RuneIcon hdIcon={rune.hdIcon} invFile={rune.invFile} />
                  {rune.name[locale]} (#{Number(rune.code.slice(1))})
                </span>
              ))}
            </div>
          </div>
        </div>
        );
      })}
      </div>
    </div>
  );
}
