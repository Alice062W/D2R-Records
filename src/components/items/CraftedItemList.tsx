'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type craftedItemsJson from '../../../data/crafted-items.json';
import { BASE_PATH } from '@/lib/basePath';
import { signedRange, signedValue } from '@/lib/grail/formatStat';

type CraftedItem = (typeof craftedItemsJson)[number];
type Locale = 'en' | 'zh-TW' | 'zh-CN';
// crafted-items.json's fixedProperties/variableProperties element shapes are
// inferred per-entry from the raw JSON, so an optional field like `composed`
// (present only on "chance to cast" entries) produces a non-uniform union
// across the array instead of a single optional-field type. Widen explicitly
// rather than fighting JSON-module type inference.
type FixedStatEntry = { key: string; label: Record<Locale, string>; value?: number | null; isSkillRef: boolean; composed?: boolean; signed?: boolean };
type VariableStatEntry = { key: string; label: Record<Locale, string>; min: number; max: number; isSkillRef: boolean; signed?: boolean };

const FAMILY_ORDER = ['hitPower', 'blood', 'caster', 'safety'] as const;

function CraftIcon({ invFile, size = 'w-8 h-8' }: { invFile: string | null; size?: string }) {
  const [iconFailed, setIconFailed] = useState(false);
  if (!invFile || iconFailed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${BASE_PATH}/items/inv/${invFile}.png`}
      alt=""
      aria-hidden="true"
      className={`${size} object-contain inline-block shrink-0`}
      onError={() => setIconFailed(true)}
    />
  );
}

export default function CraftedItemList({ items, locale }: { items: CraftedItem[]; locale: Locale }) {
  const t = useTranslations('Items');
  const [activeFamily, setActiveFamily] = useState<(typeof FAMILY_ORDER)[number]>(FAMILY_ORDER[0]);

  function pill(active: boolean) {
    return `px-3 py-1.5 rounded-lg text-sm font-cinzel transition-colors ${
      active
        ? 'bg-gold text-ink-950 font-semibold'
        : 'bg-panel border border-panel-border text-parchment hover:bg-panel-alt'
    }`;
  }

  const familyItems = items.filter(i => i.family === activeFamily);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-wrap gap-2">
        {FAMILY_ORDER.map(family => (
          <button
            key={family}
            onClick={() => setActiveFamily(family)}
            className={pill(activeFamily === family)}
          >
            {t(`craftedItemsFamily_${family}`)}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {familyItems.map(item => (
          <div key={item.id} className="bg-panel border border-panel-border rounded-xl p-6">
            <div className="flex items-center gap-2">
              <CraftIcon invFile={item.magicItemInputIcon} />
              <h3 className="text-lg font-bold text-[#cbb87f]">{item.name[locale]}</h3>
            </div>
            <div className="mt-2 text-sm text-parchment flex items-center gap-2">
              {t('craftedItemsInputLabel')}: <CraftIcon invFile={item.magicItemInputIcon} size="w-5 h-5" /> {item.magicItemInput[locale]}
            </div>
            <div className="text-sm text-parchment flex items-center gap-1 flex-wrap">
              {t('craftedItemsAdditionalInputsLabel')}:
              {item.additionalInputs.map((input, i) => (
                <span key={`${input[locale]}-${i}`} className="flex items-center gap-1">
                  <CraftIcon invFile={item.additionalInputIcons[i]} size="w-5 h-5" />
                  {input[locale]}{i < item.additionalInputs.length - 1 ? ',' : ''}
                </span>
              ))}
            </div>
            {item.fixedProperties.length > 0 && (
              <div className="mt-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                  {t('craftedItemsFixedPropertiesLabel')}
                </h4>
                <div className="text-sm text-[#8080f3] flex flex-col gap-0.5">
                  {(item.fixedProperties as FixedStatEntry[]).map(f => (
                    <div key={f.key}>{f.composed ? f.label[locale] : `${f.label[locale]}: ${f.value == null ? f.value : signedValue(f.value, f.signed)}`}</div>
                  ))}
                </div>
              </div>
            )}
            {item.variableProperties.length > 0 && (
              <div className="mt-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                  {t('craftedItemsVariablePropertiesLabel')}
                </h4>
                <div className="text-sm text-[#8080f3] flex flex-col gap-0.5">
                  {(item.variableProperties as VariableStatEntry[]).map(s => <div key={s.key}>{s.label[locale]}: {signedRange(s.min, s.max, s.signed)}</div>)}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
