import { useTranslations } from 'next-intl';
import type runewordsFullJson from '../../../data/runewords-full.json';

type Runeword = (typeof runewordsFullJson)[number];

export default function RunewordList({ runewords, locale }: { runewords: Runeword[]; locale: 'en' | 'zh-TW' | 'zh-CN' }) {
  const t = useTranslations('Items');

  return (
    <div className="flex flex-col gap-4 w-full">
      {runewords.map(rw => (
        <div key={rw.id} className="bg-zinc-900 border border-zinc-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#cbb87f]">{rw.name[locale]}</h3>
            {rw.ladderOnly && (
              <span className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-400">
                {t('runewordsLadderOnly')}
              </span>
            )}
          </div>
          <div className="mt-2 text-sm text-zinc-300 flex flex-col gap-0.5">
            <div>{t('runewordsRunesLabel')}: {rw.runes.join(' + ')}</div>
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
