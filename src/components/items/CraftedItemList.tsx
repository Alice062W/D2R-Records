'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type craftedItemsJson from '../../../data/crafted-items.json';
import { BASE_PATH } from '@/lib/basePath';

type CraftedItem = (typeof craftedItemsJson)[number];
type Locale = 'en' | 'zh-TW' | 'zh-CN';

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

  return (
    <div className="flex flex-col gap-8 w-full">
      {FAMILY_ORDER.map(family => {
        const familyItems = items.filter(i => i.family === family);
        if (familyItems.length === 0) return null;
        return (
          <div key={family}>
            <h2 className="text-xl font-semibold text-parchment-bright mb-3">
              {t(`craftedItemsFamily_${family}`)}
            </h2>
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
                        {item.fixedProperties.map(f => <div key={f.key}>{f.label[locale]}: {f.value}</div>)}
                      </div>
                    </div>
                  )}
                  {item.variableProperties.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                        {t('craftedItemsVariablePropertiesLabel')}
                      </h4>
                      <div className="text-sm text-[#8080f3] flex flex-col gap-0.5">
                        {item.variableProperties.map(s => <div key={s.key}>{s.label[locale]}: {s.min}–{s.max}</div>)}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
