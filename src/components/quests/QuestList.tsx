'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { BASE_PATH } from '@/lib/basePath';

type Locale = 'en' | 'zh-TW' | 'zh-CN';
type LocalizedText = Record<Locale, string>;

type Quest = {
  id: number;
  key: string;
  act: number;
  order: number;
  optional: boolean;
  icon: string;
  rewardImage: string | null;
  reward: LocalizedText | null;
  itemImage: string | null;
  name: LocalizedText;
  objectives: LocalizedText[];
};

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

// Shared by RewardImage/ItemImage -- both are optional supplementary quest
// images with identical fallback behavior, just different source fields.
function QuestDetailImage({ src, className }: { src: string | null; className: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${BASE_PATH}/${src}`}
      alt=""
      aria-hidden="true"
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

// The game's own act tab art (extracted from expquesttabs.dc6) has the
// Roman numeral baked into the image itself -- language-neutral, the real
// game shows "I".."V" in every locale, so no separate translated label is
// drawn on top. An aria-label still carries the localized act name for
// screen readers.
function ActTabButton({
  act, isActive, onClick, label,
}: {
  act: (typeof ACTS)[number]; isActive: boolean; onClick: () => void; label: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = `${BASE_PATH}/quests/tabs/act${act}-${isActive ? 'active' : 'inactive'}.png`;
  return (
    <button type="button" onClick={onClick} aria-pressed={isActive} aria-label={label} className="shrink-0">
      {failed ? (
        <span
          className={`block px-4 py-2 rounded-md border text-sm font-semibold ${
            isActive ? 'bg-gold-bright text-black border-gold-bright' : 'bg-panel border-panel-border text-parchment'
          }`}
        >
          {label}
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" onError={() => setFailed(true)} className="h-8 w-auto" />
      )}
    </button>
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
      <div className="flex gap-2 justify-center flex-wrap">
        {ACTS.map(a => (
          <ActTabButton
            key={a}
            act={a}
            isActive={a === act}
            onClick={() => selectAct(a)}
            label={t(`questActLabel_${a}` as never)}
          />
        ))}
      </div>

      {/* Fixed 3-column x 2-row grid, matching the real in-game quest log
          layout -- intentionally not responsive/expanding to more columns,
          since that grid shape (not just "some grid") is the point. */}
      <div
        className="relative grid grid-cols-3 grid-rows-2 gap-3 border border-panel-border rounded-xl p-4 bg-cover bg-center"
        style={{ backgroundImage: `url(${BASE_PATH}/quests/panel-bg.png)` }}
      >
        {actQuests.map(q => (
          <button
            key={q.key}
            type="button"
            onClick={() => setSelectedKey(q.key)}
            aria-pressed={q.key === selectedKey}
            className={`relative flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors ${
              q.key === selectedKey ? 'border-gold-bright bg-black/30' : 'border-transparent hover:bg-black/20'
            }`}
            title={q.name[locale]}
          >
            {q.optional && (
              <span
                aria-label={t('questOptionalIndicatorLabel')}
                data-testid="quest-optional-indicator"
                className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#8080f3]"
              />
            )}
            <QuestIcon icon={q.icon} />
            <span className="text-xs text-parchment-bright text-center leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
              {q.name[locale]}
            </span>
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
          <div className="bg-panel border border-panel-border rounded-lg px-4 py-3 flex flex-col gap-3 text-sm text-parchment">
            {selected.objectives.filter(obj => obj[locale].trim() !== '').length > 0 ? (
              <div className="flex flex-col gap-2">
                {selected.objectives
                  .filter(obj => obj[locale].trim() !== '')
                  .map((obj, i) => (
                    <div key={i}>
                      <span aria-hidden="true">&ndash; </span>
                      <span>{obj[locale]}</span>
                    </div>
                  ))}
              </div>
            ) : (
              <span className="text-xs text-muted">{t('questNoObjectives')}</span>
            )}
            {selected.itemImage && (
              <div className="flex items-center gap-2 pt-1 border-t border-panel-border">
                <QuestDetailImage src={selected.itemImage} className="w-10 h-10 object-contain" />
                <span className="text-xs text-muted">{t('questItemLabel')}</span>
              </div>
            )}
          </div>
          <div className="bg-panel-alt border border-panel-border rounded-lg px-4 py-3 flex items-center gap-3">
            <h3 className="text-sm font-bold text-gold-bright font-cinzel">{t('questRewardsLabel')}</h3>
            {selected.rewardImage && <QuestDetailImage src={selected.rewardImage} className="w-10 h-10 object-contain inline-block" />}
            {selected.reward ? (
              <span className="text-xs text-parchment">{selected.reward[locale]}</span>
            ) : (
              !selected.rewardImage && <span className="text-xs text-muted">{t('questNoReward')}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
