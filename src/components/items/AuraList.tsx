'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Aura } from '@/lib/grail/auras';
import { BASE_PATH } from '@/lib/basePath';

function AuraImage({ src, alt, size }: { src: string; alt: string; size: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={`${size} object-contain rounded border border-panel-border`}
      onError={() => setFailed(true)}
    />
  );
}

function radiusAtLevel(aura: Aura, level: number) {
  return aura.radiusBase + aura.radiusPerLevel * (level - 1);
}

export default function AuraList({ auras }: { auras: Aura[] }) {
  const t = useTranslations('Items');
  const levels = Array.from({ length: 20 }, (_, i) => i + 1);

  return (
    <div className="flex flex-col gap-4 w-full">
      {auras.map(aura => (
        <div key={aura.id} className="bg-panel border border-panel-border rounded-xl p-6 flex flex-col sm:flex-row gap-4">
          <div className="flex sm:flex-col items-center gap-3 shrink-0">
            <AuraImage src={`${BASE_PATH}/skills/icons/${aura.id}.png`} alt="" size="w-16 h-16" />
            <AuraImage src={`${BASE_PATH}/skills/visuals/${aura.id}.png`} alt="" size="w-24 h-24" />
          </div>
          <div className="flex flex-col gap-2 min-w-0">
            <h3 className="text-lg font-bold text-gold">{t(aura.nameKey)}</h3>
            <p className="text-sm text-parchment">{t(aura.descriptionKey)}</p>
            <div className="text-xs text-muted flex flex-col gap-1 mt-1">
              <span>{t('aurasReqLevelLabel')}: {aura.reqLevel}</span>
              <span>{t('aurasManaCostLabel')}: {aura.manaCost}</span>
            </div>
            <div className="overflow-x-auto mt-1">
              <table className="text-xs">
                <thead>
                  <tr>
                    <th className="text-left pr-3 text-muted font-normal">{t('aurasLevelLabel')}</th>
                    {levels.map(lvl => (
                      <th key={lvl} className="px-2 text-muted font-normal">{lvl}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="pr-3 text-muted">{t('aurasRadiusLabel')}</td>
                    {levels.map(lvl => (
                      <td key={lvl} className="px-2 text-parchment text-center">{radiusAtLevel(aura, lvl)}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
