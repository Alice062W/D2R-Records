import { useTranslations, useLocale } from 'next-intl';
import type areaLevelsJson from '../../../data/area-levels.json';

type Area = (typeof areaLevelsJson)[number];

export default function AreaLevelTable({ areas }: { areas: Area[] }) {
  const t = useTranslations('Items');
  const locale = useLocale() as 'en' | 'zh-TW' | 'zh-CN';

  return (
    <div className="bg-panel border border-panel-border rounded-xl p-6 overflow-x-auto w-full">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left text-xs uppercase text-muted pb-2">{t('areaLevelNameLabel')}</th>
            <th className="text-left text-xs uppercase text-muted pb-2 px-3">{t('areaLevelNormalLabel')}</th>
            <th className="text-left text-xs uppercase text-muted pb-2 px-3">{t('areaLevelNightmareLabel')}</th>
            <th className="text-left text-xs uppercase text-muted pb-2 px-3">{t('areaLevelHellLabel')}</th>
          </tr>
        </thead>
        <tbody className="text-parchment">
          {areas.map(area => (
            <tr key={area.id}>
              <td className="py-1 text-parchment-bright font-semibold">{area.name[locale]}</td>
              <td className="py-1 px-3">{area.normal}</td>
              <td className="py-1 px-3">{area.nightmare}</td>
              <td className="py-1 px-3">{area.hell}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
