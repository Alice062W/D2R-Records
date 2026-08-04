'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { GrailItem, GrailPieceBonus } from '@/lib/grail/catalog';
import { BASE_PATH } from '@/lib/basePath';
import { useOwnedItems } from '@/lib/grail/useOwnedItems';
import OwnedToggle from './OwnedToggle';

// Authentic D2 item-rarity text colors (verified against d2r.world's computed styles).
const NAME_COLOR: Record<GrailItem['kind'], string> = {
  unique: 'text-[#cbb87f]',
  set: 'text-[#22ff55]',
};

// A "variable" property is one that can roll to a different value on other
// drops of this same item (e.g. "Enhanced Damage +[60-70]%") -- as opposed
// to a fixed property identical on every copy. Flagged with a dice icon and
// a brighter/bold treatment on top of the section's base color so players
// scanning for reroll-worthy items can spot them at a glance.
function PropertyLine({
  label, variable, colorClass, suffix,
}: { label: string; variable: boolean; colorClass: string; suffix?: string }) {
  return (
    <div className={variable ? `${colorClass} font-bold flex items-center gap-1` : colorClass}>
      {variable && <span aria-hidden="true" title="Variable roll">🎲</span>}
      <span>{label}{suffix && <span className="text-muted font-normal"> {suffix}</span>}</span>
    </div>
  );
}

// Groups a piece-bonus list (already in tooltip display order within each
// tier, see docs/item-display-template.md) into [piecesRequired, entries][]
// while preserving tier order.
function groupByPieces(list: GrailPieceBonus[]): [number, GrailPieceBonus[]][] {
  const order: number[] = [];
  const groups = new Map<number, GrailPieceBonus[]>();
  for (const p of list) {
    if (!groups.has(p.piecesRequired)) {
      groups.set(p.piecesRequired, []);
      order.push(p.piecesRequired);
    }
    groups.get(p.piecesRequired)!.push(p);
  }
  return order.map(n => [n, groups.get(n)!]);
}

export default function ItemStatCard({
  item,
  // The set's shared Full/Partial Set Bonus (setFullBonus/setPiecesBonuses)
  // is identical across every piece of a set. On a set-group page (all
  // pieces of the same set together) that's shown once at the page level,
  // so this defaults to true (shown) only for standalone contexts --
  // category browsing and the single-item detail page -- where no such
  // page-level summary exists to fall back on.
  showSharedSetBonuses = true,
}: { item: GrailItem; showSharedSetBonuses?: boolean }) {
  const t = useTranslations('Grail');
  const [iconFailed, setIconFailed] = useState(false);
  const [hdIconFailed, setHdIconFailed] = useState(false);
  const { userId, ownedIds, toggle, error } = useOwnedItems();

  const itemStatRows: [string, string][] = [
    [t('baseLabel'), item.baseName],
    [t('gradeLabel'), t(`grade_${item.grade}`)],
    ...(item.defense ? [[t('defenseLabel'), `${item.defense.min}–${item.defense.max}`] as [string, string]] : []),
    ...(item.oneHandDamage ? [[t('oneHandDamageLabel'), `${item.oneHandDamage.min}–${item.oneHandDamage.max}`] as [string, string]] : []),
    ...(item.twoHandDamage ? [[t('twoHandDamageLabel'), `${item.twoHandDamage.min}–${item.twoHandDamage.max}`] as [string, string]] : []),
    [t('requiredLevel'), String(item.levelReq)],
    ...(item.requiredStrength != null ? [[t('requiredStrength'), String(item.requiredStrength)] as [string, string]] : []),
    ...(item.requiredDexterity != null ? [[t('requiredDexterity'), String(item.requiredDexterity)] as [string, string]] : []),
    ...(item.weaponSpeed != null ? [[t('weaponSpeedLabel'), String(item.weaponSpeed)] as [string, string]] : []),
    ...(item.durability != null ? [[t('durabilityLabel'), String(item.durability)] as [string, string]] : []),
    ...(item.classRestriction ? [[t('classOnlyLabel'), t(`className_${item.classRestriction}`)] as [string, string]] : []),
  ];

  const owned = userId && ownedIds.has(item.id);

  const hasProperties = item.properties.length > 0;
  const hasItemSetBonus = item.setBonuses.length > 0;
  const hasSharedFullBonus = showSharedSetBonuses && item.setFullBonus.length > 0;
  const hasSharedPartialBonus = showSharedSetBonuses && item.setPiecesBonuses.length > 0;

  return (
    <div className={`border rounded-xl p-6 flex flex-col gap-4 ${owned ? 'bg-green-950/30 border-green-600/50' : 'bg-panel border-panel-border'}`}>
      {/* Group 1: name + owned indicator */}
      <div className="flex items-start justify-between gap-2 pb-4 border-b border-panel-border/60">
        <div>
          <h3 className={`text-lg font-bold ${NAME_COLOR[item.kind]}`}>{item.name}</h3>
          {item.setName && <p className="text-xs text-[#22ff55]">{item.setName}</p>}
        </div>
        {userId && (
          <div className="flex flex-col items-end gap-1 shrink-0">
            <OwnedToggle owned={!!owned} onToggle={() => toggle(item.id, item.kind)} />
            {error && <p className="text-xs text-red-400 max-w-[140px] text-right">{error}</p>}
          </div>
        )}
      </div>

      {/* Group 2: item stats + image */}
      <div className="flex flex-row gap-4 pb-4 border-b border-panel-border/60">
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">{t('itemStats')}</h4>
          <div className="text-sm text-parchment flex flex-col gap-0.5">
            {itemStatRows.map(([label, value]) => (
              <div key={label}>{label}: <span className="text-parchment-bright">{value}</span></div>
            ))}
          </div>
        </div>
        {(item.hdIcon || item.invFile) && !iconFailed && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={
              item.hdIcon && !hdIconFailed
                ? `${BASE_PATH}/items/hd/${item.hdIcon}.png`
                : `${BASE_PATH}/items/inv/${item.invFile}.png`
            }
            alt=""
            aria-hidden="true"
            className="w-20 h-20 object-contain shrink-0"
            onError={() => {
              // First try: HD art missing/broken -> fall back to the classic
              // icon. Second try: classic icon also broken -> hide entirely.
              if (item.hdIcon && !hdIconFailed) setHdIconFailed(true);
              else setIconFailed(true);
            }}
          />
        )}
      </div>

      {/* Group 3: Magic Properties + this item's own Set Item Bonus (and,
          in standalone contexts with no page-level summary to defer to,
          the shared Full/Partial Set Bonus too). */}
      {(hasProperties || hasItemSetBonus || hasSharedFullBonus || hasSharedPartialBonus) && (
        <div className="flex flex-col gap-4">
          {/* Already filtered (no-display-text stats removed) and sorted
              into the real D2R tooltip's display order by the extraction
              pipeline -- render properties exactly as given. */}
          {hasProperties && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">{t('magicProperties')}</h4>
              <div className="text-sm flex flex-col gap-0.5">
                {item.properties.map((p, i) => (
                  <PropertyLine key={`${p.code}-${i}`} label={p.label} variable={p.variable} colorClass="text-[#fff818]" />
                ))}
              </div>
            </div>
          )}

          {/* This item's OWN bonus, which scales with how many pieces of
              the set are equipped (distinct from the shared Partial/Full
              Set Bonus, which is identical across every piece) -- e.g.
              Aldur's Stony Gaze grants +15 Energy at each tier while other
              pieces in the same set grant a different stat. Always shown
              here (not deduplicated to the page level) since it's unique
              per item. */}
          {hasItemSetBonus && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">{t('itemSetBonusLabel')}</h4>
              <div className="text-sm flex flex-col gap-0.5">
                {item.setBonuses.map((p, i) => (
                  <PropertyLine
                    key={`${p.code}-${i}`}
                    label={p.label}
                    variable={p.variable}
                    colorClass="text-[#22ff55]"
                    suffix={t('piecesRequiredInline', { count: p.piecesRequired })}
                  />
                ))}
              </div>
            </div>
          )}

          {hasSharedFullBonus && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">{t('fullSetBonusLabel')}</h4>
              <div className="text-sm flex flex-col gap-0.5">
                {item.setFullBonus.map((p, i) => (
                  <PropertyLine key={`${p.code}-${i}`} label={p.label} variable={p.variable} colorClass="text-[#22ff55]" />
                ))}
              </div>
            </div>
          )}

          {hasSharedPartialBonus && (
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">{t('setBonusesLabel')}</h4>
              {groupByPieces(item.setPiecesBonuses).map(([pieces, entries]) => (
                <div key={pieces}>
                  <p className="text-xs text-muted mb-0.5">{t('piecesRequired', { count: pieces })}</p>
                  <div className="text-sm flex flex-col gap-0.5">
                    {entries.map((p, i) => (
                      <PropertyLine key={`${p.code}-${i}`} label={p.label} variable={p.variable} colorClass="text-[#fff818]" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
