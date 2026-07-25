'use client';

import Link from 'next/link';
import { BASE_PATH } from '@/lib/basePath';
import type { CompletionState } from '@/lib/navGroups';

const BORDER_BY_STATE: Record<CompletionState, string> = {
  complete: 'border-green-500/60',
  partial: 'border-amber-500/50',
  none: 'border-panel-border',
};

export default function ChronicleRewardCard({
  href,
  label,
  imageSrc,
  nameColorClass,
  tracked,
  owned,
  total,
  state,
}: {
  href: string;
  label: string;
  imageSrc: string;
  nameColorClass: string;
  tracked: boolean;
  owned: number;
  total: number;
  state: CompletionState;
}) {
  const percent = tracked && total > 0 ? Math.round((owned / total) * 100) : 0;

  return (
    <Link
      href={href}
      className={`group relative block aspect-[320/462] rounded-xl overflow-hidden border ${BORDER_BY_STATE[tracked ? state : 'none']} bg-black transition-colors hover:border-gold`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${BASE_PATH}${imageSrc}`}
        alt=""
        aria-hidden="true"
        className="chronicle-pan absolute inset-0 w-full h-full object-cover"
        style={{ animation: 'chronicle-pan 12s ease-in-out infinite' }}
      />

      {tracked && (
        <div className="absolute top-0 inset-x-0 p-2.5 bg-gradient-to-b from-black/85 via-black/40 to-transparent">
          <div className="h-3 rounded-sm border border-panel-border-light bg-black/70 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-gold to-gold-bright transition-[width] duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="mt-1 text-center text-sm font-bold font-cinzel text-parchment-bright">
            {percent}%
          </p>
        </div>
      )}

      <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
        <h3 className={`text-sm font-bold font-cinzel drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] ${nameColorClass}`}>
          {label}
        </h3>
        {tracked && (
          <p className="text-xs text-parchment/90">{owned}/{total}</p>
        )}
      </div>
    </Link>
  );
}
