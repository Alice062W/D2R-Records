'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { BaseLine, BaseGrade } from '@/lib/grail/basesCatalog';
import { BASE_PATH } from '@/lib/basePath';

const GRADES = ['normal', 'exceptional', 'elite'] as const;

function fmtDamage(d: BaseGrade['oneHandDamage']) {
  return d ? `${d.min} - ${d.max}` : '-';
}
function fmtDefense(d: BaseGrade['defense']) {
  return d ? `${d.min} - ${d.max}` : '-';
}
function fmtNum(n: number | null) {
  return n != null ? String(n) : '-';
}

export default function BaseItemTable({ line }: { line: BaseLine }) {
  const t = useTranslations('BaseItems');
  const [iconFailed, setIconFailed] = useState(false);
  const present = GRADES.filter(g => line.grades[g] !== null);

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
          <tr><td className="text-muted">{t('defense')}</td>{present.map(g => <td key={g} className="px-3">{fmtDefense(line.grades[g]!.defense)}</td>)}</tr>
          <tr><td className="text-muted">{t('oneHandDamage')}</td>{present.map(g => <td key={g} className="px-3">{fmtDamage(line.grades[g]!.oneHandDamage)}</td>)}</tr>
          <tr><td className="text-muted">{t('twoHandDamage')}</td>{present.map(g => <td key={g} className="px-3">{fmtDamage(line.grades[g]!.twoHandDamage)}</td>)}</tr>
          <tr><td className="text-muted">{t('levelReq')}</td>{present.map(g => <td key={g} className="px-3">{fmtNum(line.grades[g]!.levelReq)}</td>)}</tr>
          <tr><td className="text-muted">{t('strReq')}</td>{present.map(g => <td key={g} className="px-3">{fmtNum(line.grades[g]!.requiredStrength)}</td>)}</tr>
          <tr><td className="text-muted">{t('dexReq')}</td>{present.map(g => <td key={g} className="px-3">{fmtNum(line.grades[g]!.requiredDexterity)}</td>)}</tr>
          <tr><td className="text-muted">{t('durability')}</td>{present.map(g => <td key={g} className="px-3">{fmtNum(line.grades[g]!.durability)}</td>)}</tr>
          <tr><td className="text-muted">{t('sockets')}</td>{present.map(g => <td key={g} className="px-3">{fmtNum(line.grades[g]!.sockets)}</td>)}</tr>
          <tr><td className="text-muted">{t('qlvl')}</td>{present.map(g => <td key={g} className="px-3">{fmtNum(line.grades[g]!.qlvl)}</td>)}</tr>
        </tbody>
      </table>
    </div>
  );
}
