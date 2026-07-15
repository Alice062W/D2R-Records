import { useTranslations } from 'next-intl';
import type craftedItemsJson from '../../../data/crafted-items.json';

type CraftedItem = (typeof craftedItemsJson)[number];
type Locale = 'en' | 'zh-TW' | 'zh-CN';

const FAMILY_ORDER = ['hitPower', 'blood', 'caster', 'safety'] as const;

export default function CraftedItemList({ items, locale }: { items: CraftedItem[]; locale: Locale }) {
  const t = useTranslations('Items');

  return (
    <div className="flex flex-col gap-8 w-full">
      {FAMILY_ORDER.map(family => {
        const familyItems = items.filter(i => i.family === family);
        if (familyItems.length === 0) return null;
        return (
          <div key={family}>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">
              {t(`craftedItemsFamily_${family}`)}
            </h2>
            <div className="flex flex-col gap-3">
              {familyItems.map(item => (
                <div key={item.id} className="bg-zinc-900 border border-zinc-700 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-[#cbb87f]">{item.name[locale]}</h3>
                  <div className="mt-2 text-sm text-zinc-300">
                    {t('craftedItemsInputLabel')}: {item.magicItemInput[locale]}
                  </div>
                  <div className="text-sm text-zinc-300">
                    {t('craftedItemsAdditionalInputsLabel')}: {item.additionalInputs.map(i => i[locale]).join(', ')}
                  </div>
                  {item.fixedProperties.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                        {t('craftedItemsFixedPropertiesLabel')}
                      </h4>
                      <div className="text-sm text-[#8080f3] flex flex-col gap-0.5">
                        {item.fixedProperties.map(f => <div key={f.key}>{f.label[locale]}: {f.value}</div>)}
                      </div>
                    </div>
                  )}
                  {item.variableProperties.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">
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
