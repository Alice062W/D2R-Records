import { useTranslations } from 'next-intl';
import type { LevelUpRow } from '@/lib/grail/levelUpGuide';

const DIFFICULTY_LABEL_KEY = {
  normal: 'areaLevelNormalLabel',
  nightmare: 'areaLevelNightmareLabel',
  hell: 'areaLevelHellLabel',
} as const;

const ACT_LABEL_KEY = ['areaLevelAct1', 'areaLevelAct2', 'areaLevelAct3', 'areaLevelAct4', 'areaLevelAct5'] as const;

export default function LevelUpTable({ rows }: { rows: LevelUpRow[] }) {
  const t = useTranslations('Items');

  return (
    <div className="bg-panel border border-panel-border rounded-xl p-6 overflow-x-auto w-full">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left text-xs uppercase text-muted pb-2">{t('levelUpClvlLabel')}</th>
            <th className="text-left text-xs uppercase text-muted pb-2 px-3">{t('levelUpDifficultyLabel')}</th>
            <th className="text-left text-xs uppercase text-muted pb-2 px-3">{t('levelUpActLabel')}</th>
          </tr>
        </thead>
        <tbody className="text-parchment">
          {rows.map((row, i) => (
            <tr key={i}>
              <td className="py-1 text-parchment-bright font-semibold">{row.clvlMin} - {row.clvlMax}</td>
              <td className="py-1 px-3">{t(DIFFICULTY_LABEL_KEY[row.difficulty])}</td>
              <td className="py-1 px-3">{t(ACT_LABEL_KEY[row.act - 1])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
