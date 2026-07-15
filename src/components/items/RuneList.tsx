import { useTranslations } from 'next-intl';
import type runesJson from '../../../data/runes.json';

type Rune = (typeof runesJson)[number];
type Locale = 'en' | 'zh-TW' | 'zh-CN';

export default function RuneList({ runes, locale }: { runes: Rune[]; locale: Locale }) {
  const t = useTranslations('Items');

  return (
    <div className="flex flex-col gap-4 w-full">
      {runes.map(rune => (
        <div key={rune.id} className="bg-zinc-900 border border-zinc-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#cbb87f]">{rune.name[locale]}</h3>
            <span className="text-xs text-zinc-500">#{rune.number}</span>
          </div>
          <div className="mt-2 text-sm text-zinc-300">
            {t('runesLevelReqLabel')}: {rune.levelReq}
          </div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">{t('runesWeaponLabel')}</h4>
              <div className="text-[#8080f3] flex flex-col gap-0.5">
                {rune.weaponStats.map(s => <div key={s.key}>{s.label[locale]}: {s.min}</div>)}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">{t('runesArmorHelmLabel')}</h4>
              <div className="text-[#8080f3] flex flex-col gap-0.5">
                {rune.armorHelmStats.map(s => <div key={s.key}>{s.label[locale]}: {s.min}</div>)}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">{t('runesShieldLabel')}</h4>
              <div className="text-[#8080f3] flex flex-col gap-0.5">
                {rune.shieldStats.map(s => <div key={s.key}>{s.label[locale]}: {s.min}</div>)}
              </div>
            </div>
          </div>
          {rune.recipe && (
            <div className="mt-3 text-sm text-zinc-400">
              {t('runesRecipeLabel')}: {rune.recipe.runeName} x{rune.recipe.count}
              {rune.recipe.gemName ? ` + ${rune.recipe.gemName}` : ''}
            </div>
          )}
          <div className="mt-2 text-xs text-zinc-500">
            {t('runesDropRateLabel')}: {rune.dropRate.difficulty.toUpperCase()} {rune.dropRate.monster} {rune.dropRate.percent}%
          </div>
        </div>
      ))}
    </div>
  );
}
