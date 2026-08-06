'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type questsJson from '../../../data/quests.json';
import { BASE_PATH } from '@/lib/basePath';

type Quest = (typeof questsJson)[number];
type Locale = 'en' | 'zh-TW' | 'zh-CN';

const ACTS = [1, 2, 3, 4, 5] as const;

function QuestIcon({ icon }: { icon: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${BASE_PATH}/${icon}`}
      alt=""
      aria-hidden="true"
      className="w-16 h-16 object-contain"
      onError={() => setFailed(true)}
    />
  );
}

function RewardImage({ rewardImage }: { rewardImage: string | null }) {
  const [failed, setFailed] = useState(false);
  if (!rewardImage || failed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${BASE_PATH}/${rewardImage}`}
      alt=""
      aria-hidden="true"
      className="w-10 h-10 object-contain inline-block"
      onError={() => setFailed(true)}
    />
  );
}

export default function QuestList({ quests, locale }: { quests: Quest[]; locale: Locale }) {
  const t = useTranslations('Items');

  function questsForAct(a: (typeof ACTS)[number]) {
    return quests.filter(q => q.act === a).sort((x, y) => x.order - y.order);
  }

  const [act, setAct] = useState<(typeof ACTS)[number]>(1);
  const actQuests = questsForAct(act);
  const [selectedKey, setSelectedKey] = useState<string | null>(actQuests[0]?.key ?? null);

  function selectAct(nextAct: (typeof ACTS)[number]) {
    setAct(nextAct);
    const first = questsForAct(nextAct)[0];
    setSelectedKey(first?.key ?? null);
  }

  const selected = quests.find(q => q.key === selectedKey) ?? null;

  return (
    <div className="w-full max-w-3xl flex flex-col gap-4">
      <div className="flex gap-2 justify-center">
        {ACTS.map(a => (
          <button
            key={a}
            type="button"
            onClick={() => selectAct(a)}
            aria-pressed={a === act}
            className={`px-4 py-2 rounded-md border text-sm font-semibold transition-colors ${
              a === act
                ? 'bg-gold-bright text-black border-gold-bright'
                : 'bg-panel border-panel-border text-parchment hover:border-gold-bright'
            }`}
          >
            {t(`questActLabel_${a}` as never)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 bg-panel-alt border border-panel-border rounded-xl p-4">
        {actQuests.map(q => (
          <button
            key={q.key}
            type="button"
            onClick={() => setSelectedKey(q.key)}
            aria-pressed={q.key === selectedKey}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors ${
              q.key === selectedKey ? 'border-gold-bright bg-panel' : 'border-transparent hover:bg-panel'
            }`}
            title={q.name[locale]}
          >
            <QuestIcon icon={q.icon} />
            <span className="text-xs text-parchment text-center leading-tight">{q.name[locale]}</span>
          </button>
        ))}
      </div>

      {selected && (
        <div className="flex flex-col gap-3">
          <div className="bg-panel border border-panel-border rounded-lg px-4 py-2 flex items-center justify-between">
            <h2 className="text-lg font-bold text-parchment-bright font-cinzel">{selected.name[locale]}</h2>
            {selected.optional && (
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-[#8080f3] text-black">
                {t('questOptionalLabel')}
              </span>
            )}
          </div>
          <div className="bg-panel border border-panel-border rounded-lg px-4 py-3 flex flex-col gap-2 text-sm text-parchment">
            {selected.objectives
              .filter(obj => obj[locale].trim() !== '')
              .map((obj, i) => (
                <div key={i}>
                  <span aria-hidden="true">&ndash; </span>
                  <span>{obj[locale]}</span>
                </div>
              ))}
          </div>
          <div className="bg-panel-alt border border-panel-border rounded-lg px-4 py-3 flex items-center gap-3">
            <h3 className="text-sm font-bold text-gold-bright font-cinzel">{t('questRewardsLabel')}</h3>
            {selected.rewardImage ? (
              <RewardImage rewardImage={selected.rewardImage} />
            ) : (
              <span className="text-xs text-muted">{t('questNoReward')}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
