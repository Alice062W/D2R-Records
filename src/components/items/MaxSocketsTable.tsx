import { useTranslations, useLocale } from 'next-intl';
import type maxSocketsJson from '../../../data/max-sockets.json';

type Row = (typeof maxSocketsJson)[number];

export default function MaxSocketsTable({ rows }: { rows: Row[] }) {
  const t = useTranslations('Items');
  const locale = useLocale() as 'en' | 'zh-TW' | 'zh-CN';

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 overflow-x-auto w-full">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left text-xs uppercase text-zinc-500 pb-2">{t('maxSocketsItemTypeLabel')}</th>
            <th className="text-left text-xs uppercase text-zinc-500 pb-2 px-3">{t('maxSocketsIlvl1to25')}</th>
            <th className="text-left text-xs uppercase text-zinc-500 pb-2 px-3">{t('maxSocketsIlvl26to40')}</th>
            <th className="text-left text-xs uppercase text-zinc-500 pb-2 px-3">{t('maxSocketsIlvl41plus')}</th>
          </tr>
        </thead>
        <tbody className="text-zinc-300">
          {rows.map(row => (
            <tr key={row.itemType.en}>
              <td className="py-1 text-zinc-100 font-semibold">{row.itemType[locale]}</td>
              <td className="py-1 px-3">{row.ilvl1to25}</td>
              <td className="py-1 px-3">{row.ilvl26to40}</td>
              <td className="py-1 px-3">{row.ilvl41plus}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
