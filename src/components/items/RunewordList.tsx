'use client';

import { useTranslations } from 'next-intl';
import type runewordsFullJson from '../../../data/runewords-full.json';
import { useOwnedItems } from '@/lib/grail/useOwnedItems';
import { signedRange, signedValue } from '@/lib/grail/formatStat';
import OwnedToggle from './OwnedToggle';
import ItemIconFrame from './ItemIconFrame';

type Runeword = (typeof runewordsFullJson)[number];

export default function RunewordList({ runewords, locale }: { runewords: Runeword[]; locale: 'en' | 'zh-TW' | 'zh-CN' }) {
  const t = useTranslations('Items');
  const tGrail = useTranslations('Grail');
  const { userId, ownedIds, toggle, error } = useOwnedItems();

  return (
    <div className="flex flex-col gap-4 w-full">
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
      {runewords.map(rw => {
        const owned = userId && ownedIds.has(rw.id);
        return (
        <div key={rw.id} className={`border rounded-xl p-6 ${owned ? 'bg-green-950/30 border-green-600/50' : 'bg-panel border-panel-border'}`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-[#cbb87f]">{rw.name[locale]}</h3>
              {rw.ladderOnly && (
                <span className="text-xs px-2 py-1 rounded bg-panel-alt text-muted">
                  {t('runewordsLadderOnly')}
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

              {(rw.stats.length > 0 || rw.fixedStats.length > 0) && (
                <div className="mt-3 flex flex-col gap-0.5">
                  {rw.stats.map(stat => (
                    <div key={stat.key} className={stat.isSkillRef ? 'text-[#ff4a69]' : 'text-[#fff818]'}>
                      {stat.label[locale]}: {signedRange(stat.min, stat.max, stat.signed)} <span aria-hidden="true">🎲</span>
                    </div>
                  ))}
                  {rw.fixedStats.map(f => (
                    <div key={f.key} className={f.isSkillRef ? 'text-[#ff4a69]' : 'text-[#8080f3]'}>
                      {f.composed ? f.label[locale] : `${f.label[locale]}: ${f.value == null ? f.value : signedValue(f.value, f.signed)}`}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1 shrink-0 self-start">
              <span className="text-xs text-muted">{t('runewordsRunesLabel')}</span>
              {rw.runes.map((rune, i) => (
                <span key={`${rune.en}-${i}`} className="flex items-center gap-1.5 text-sm text-parchment">
                  <ItemIconFrame invFile={rw.runeInvFiles[i]} kind="rune" sizeClass="w-6 h-6" />
                  {rune[locale]}
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
