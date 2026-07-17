import { useTranslations } from 'next-intl';
import type { Alvl85Area } from '@/lib/grail/alvl85Areas';

export default function Alvl85AreaList({ areas }: { areas: Alvl85Area[] }) {
  const t = useTranslations('Items');

  return (
    <div className="flex flex-col gap-6 w-full">
      <p className="text-xs text-muted">{t('alvl85StarNote')}</p>
      {areas.map(area => (
        <div key={area.areaName} className="bg-panel border border-panel-border rounded-xl p-6">
          <h3 className="text-lg font-bold text-parchment-bright mb-3">{area.areaName}</h3>
          {area.monsters.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left text-xs uppercase text-muted pb-2">{t('alvl85MonsterLabel')}</th>
                  <th className="text-left text-xs uppercase text-muted pb-2 px-3">{t('alvl85TypeLabel')}</th>
                  <th className="text-left text-xs uppercase text-muted pb-2 px-3">{t('alvl85ImmunityLabel')}</th>
                </tr>
              </thead>
              <tbody className="text-parchment">
                {area.monsters.map((monster, i) => (
                  <tr key={`${monster.name}-${i}`}>
                    <td className="py-1 text-parchment-bright font-semibold">{monster.name}</td>
                    <td className="py-1 px-3">{t(`alvl85Type_${monster.type}`)}</td>
                    <td className="py-1 px-3">
                      {monster.immunities.map(imm => (
                        <span key={imm.element} className="mr-3">
                          {t(`alvl85Element_${imm.element}`)} {imm.value}{imm.starred ? ' ★' : ''}
                        </span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </div>
  );
}
