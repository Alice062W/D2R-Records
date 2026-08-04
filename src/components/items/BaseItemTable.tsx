'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { BaseLine, BaseGrade, BaseStatRow } from '@/lib/grail/basesCatalog';
import { BASE_PATH } from '@/lib/basePath';

const GRADES = ['normal', 'exceptional', 'elite'] as const;

// Maps a base_items.json statRow code to its BaseItems i18n label key
// (a few codes are named differently on each side, e.g. requiredLevel/levelReq).
const ROW_LABEL_KEY: Record<string, string> = {
  defense: 'defense',
  oneHandDamage: 'oneHandDamage',
  twoHandDamage: 'twoHandDamage',
  missileDamage: 'missileDamage',
  requiredLevel: 'levelReq',
  requiredStrength: 'strReq',
  requiredDexterity: 'dexReq',
  weaponSpeed: 'weaponSpeed',
  blockChance: 'blockChance',
  durability: 'durability',
  maxSockets: 'sockets',
  maxStack: 'maxStack',
};

// Fixed display order across all statRows seen on any grade of this line,
// preserving each grade's own statRows order as the tie-break source.
function orderedRowCodes(grades: (BaseGrade | null)[]): string[] {
  const codes: string[] = [];
  for (const g of grades) {
    if (!g) continue;
    for (const row of g.statRows) {
      if (!codes.includes(row.code)) codes.push(row.code);
    }
  }
  return codes;
}

function fmtRow(row: BaseStatRow | undefined): string {
  if (!row) return '-';
  if (row.min != null && row.max != null) return `${row.min} - ${row.max}`;
  if (row.value != null) return String(row.value);
  return '-';
}

export default function BaseItemTable({ line }: { line: BaseLine }) {
  const t = useTranslations('BaseItems');
  const [iconFailed, setIconFailed] = useState(false);
  const present = GRADES.filter(g => line.grades[g] !== null);
  const rowCodes = orderedRowCodes(present.map(g => line.grades[g]));

  return (
    <div className="bg-panel border border-panel-border rounded-xl p-6 overflow-x-auto">
      <div className="mb-3 flex items-center gap-3">
        {line.invFile && !iconFailed && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`${BASE_PATH}/items/inv/${line.invFile}.png`}
            alt=""
            aria-hidden="true"
            className="w-12 h-12 object-contain shrink-0"
            onError={() => setIconFailed(true)}
          />
        )}
        <span className="text-lg font-bold text-parchment-bright">{line.grades.normal!.name}</span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left text-xs uppercase text-muted pb-2"> </th>
            {present.map(g => (
              <th key={g} className="text-left text-parchment-bright font-bold pb-2 px-3">
                {line.grades[g]!.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-parchment">
          {rowCodes.map(code => (
            <tr key={code}>
              <td className="text-muted">{t(ROW_LABEL_KEY[code] ?? code)}</td>
              {present.map(g => (
                <td key={g} className="px-3">
                  {fmtRow(line.grades[g]!.statRows.find(r => r.code === code))}
                </td>
              ))}
            </tr>
          ))}
          <tr><td className="text-muted">{t('qlvl')}</td>{present.map(g => <td key={g} className="px-3">{line.grades[g]!.qlvl ?? '-'}</td>)}</tr>
        </tbody>
      </table>
    </div>
  );
}
