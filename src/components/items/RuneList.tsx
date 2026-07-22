'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type runesJson from '../../../data/runes.json';
import { BASE_PATH } from '@/lib/basePath';

type Rune = (typeof runesJson)[number];
type Locale = 'en' | 'zh-TW' | 'zh-CN';

function RuneIcon({ invFile }: { invFile: string }) {
  const [iconFailed, setIconFailed] = useState(false);
  if (!invFile || iconFailed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${BASE_PATH}/items/inv/${invFile}.png`}
      alt=""
      aria-hidden="true"
      className="w-10 h-10 object-contain shrink-0"
      onError={() => setIconFailed(true)}
    />
  );
}

export default function RuneList({ runes, locale }: { runes: Rune[]; locale: Locale }) {
  const t = useTranslations('Items');

  return (
    <div className="flex flex-col gap-4 w-full">
      {runes.map(rune => (
        <div
          key={rune.id}
          id={rune.id}
          className="bg-panel border border-panel-border rounded-xl p-6 scroll-mt-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RuneIcon invFile={rune.invFile} />
              <h3 className="text-lg font-bold text-[#cbb87f]">{rune.name[locale]}</h3>
            </div>
            <span className="text-xs text-muted">#{rune.number}</span>
          </div>
          <div className="mt-2 text-sm text-parchment">
            {t('runesLevelReqLabel')}: {rune.levelReq}
          </div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">{t('runesWeaponLabel')}</h4>
              <div className="text-[#8080f3] flex flex-col gap-0.5">
                {rune.weaponStats.map(s => <div key={s.key}>{s.label[locale]}: {s.min}</div>)}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">{t('runesArmorHelmLabel')}</h4>
              <div className="text-[#8080f3] flex flex-col gap-0.5">
                {rune.armorHelmStats.map(s => <div key={s.key}>{s.label[locale]}: {s.min}</div>)}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">{t('runesShieldLabel')}</h4>
              <div className="text-[#8080f3] flex flex-col gap-0.5">
                {rune.shieldStats.map(s => <div key={s.key}>{s.label[locale]}: {s.min}</div>)}
              </div>
            </div>
          </div>
          {rune.recipe && (
            <div className="mt-3 text-sm text-muted">
              {t('runesRecipeLabel')}: {rune.recipe.runeName[locale]} x{rune.recipe.count}
              {rune.recipe.gemName ? ` + ${rune.recipe.gemName[locale]}` : ''}
            </div>
          )}
          <div className="mt-2 text-xs text-muted">
            {t('runesDropRateLabel')}: {t(`difficulty_${rune.dropRate.difficulty}` as never)} {rune.dropRate.monster[locale]} {rune.dropRate.percent}%
          </div>
        </div>
      ))}
    </div>
  );
}
