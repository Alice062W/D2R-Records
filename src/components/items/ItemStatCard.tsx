import { useTranslations } from 'next-intl';
import type { GrailItem } from '@/lib/grail/catalog';

const NAME_COLOR: Record<GrailItem['kind'], string> = {
  unique: 'text-amber-300',
  set: 'text-green-400',
};

export default function ItemStatCard({ item }: { item: GrailItem }) {
  const t = useTranslations('Grail');

  const itemStatRows: [string, string][] = [
    [t('baseLabel'), item.baseName],
    [t('gradeLabel'), t(`grade_${item.grade}`)],
    ...(item.defense ? [[t('defenseLabel'), `${item.defense.min}–${item.defense.max}`] as [string, string]] : []),
    [t('requiredLevel'), String(item.levelReq)],
    ...(item.requiredStrength != null ? [[t('requiredStrength'), String(item.requiredStrength)] as [string, string]] : []),
    ...(item.durability != null ? [[t('durabilityLabel'), String(item.durability)] as [string, string]] : []),
  ];

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6">
      <div className="mb-1">
        <h3 className={`text-lg font-bold ${NAME_COLOR[item.kind]}`}>{item.name}</h3>
        {item.setName && <p className="text-xs text-green-500">{item.setName}</p>}
      </div>

      <div className="mt-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">{t('itemStats')}</h4>
        <div className="text-sm text-zinc-300 flex flex-col gap-0.5">
          {itemStatRows.map(([label, value]) => (
            <div key={label}>{label}: <span className="text-zinc-100">{value}</span></div>
          ))}
        </div>
      </div>

      {(item.stats.length > 0 || item.fixedStats.length > 0) && (
        <div className="mt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">{t('magicProperties')}</h4>
          <div className="text-sm text-blue-400 flex flex-col gap-0.5">
            {item.stats.map(stat => (
              <div key={stat.key}>{stat.label}: {stat.min}–{stat.max}</div>
            ))}
            {item.fixedStats.map(f => (
              <div key={f.key}>{f.label}: {f.value}</div>
            ))}
          </div>
        </div>
      )}

      {item.setBonuses.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">{t('setBonusesLabel')}</h4>
          <div className="text-sm text-green-500 flex flex-col gap-0.5">
            {item.setBonuses.map((b, i) => (
              <div key={`${b.key}-${i}`}>{b.label}: {b.min === b.max ? b.min : `${b.min}–${b.max}`}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
