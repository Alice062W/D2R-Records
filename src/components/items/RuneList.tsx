'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type runesJson from '../../../data/runes.json';
import { BASE_PATH } from '@/lib/basePath';

type Rune = (typeof runesJson)[number];
type Locale = 'en' | 'zh-TW' | 'zh-CN';
type RuneStatEntry = Rune['weaponStats'][number];

function PropertyLine({ label, variable }: { label: string; variable: boolean }) {
  return (
    <div className={`flex items-start gap-1.5 ${variable ? 'font-bold' : ''}`}>
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
      className="w-10 h-10 object-contain shrink-0"
      onError={() => {
        if (hdIcon && !hdIconFailed) setHdIconFailed(true);
        else setIconFailed(true);
      }}
    />
  );
}

function StatColumn({ label, stats, locale }: { label: string; stats: RuneStatEntry[]; locale: Locale }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">{label}</h4>
      <div className="text-[#8080f3] flex flex-col gap-0.5">
        {stats.map((s, i) => (
          <PropertyLine key={`${s.code}-${i}`} label={s.label[locale]} variable={s.variable} />
        ))}
      </div>
    </div>
  );
}

export default function RuneList({ runes, locale }: { runes: Rune[]; locale: Locale }) {
  const t = useTranslations('Items');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
      {runes.map(rune => (
        <div
          key={rune.id}
          id={rune.id}
          className="bg-panel border border-panel-border rounded-xl p-6 scroll-mt-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RuneIcon hdIcon={rune.hdIcon} invFile={rune.invFile} />
              <h3 className="text-lg font-bold text-[#cbb87f]">{rune.name[locale]}</h3>
            </div>
            <span className="text-2xl font-bold text-[#fff818]">#{rune.number}</span>
          </div>
          <div className="mt-2 text-sm text-parchment">
            {t('runesLevelReqLabel')}: {rune.levelReq}
          </div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <StatColumn label={t('runesWeaponLabel')} stats={rune.weaponStats} locale={locale} />
            <StatColumn label={t('runesArmorHelmLabel')} stats={rune.helmStats} locale={locale} />
            <StatColumn label={t('runesShieldLabel')} stats={rune.shieldStats} locale={locale} />
          </div>
        </div>
      ))}
    </div>
  );
}
