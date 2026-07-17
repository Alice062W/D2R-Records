'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { appraise, getAllBases, type AppraiseResult } from '@/lib/appraise';
import { BASE_PATH } from '@/lib/basePath';

const BASES = getAllBases();

const TIER_STYLES: Record<number, string> = {
  1: 'border-gold bg-gold/10 text-gold-bright',
  2: 'border-green-500 bg-green-950/40 text-green-300',
  3: 'border-blue-500 bg-blue-950/40 text-blue-300',
  4: 'border-panel-border-light bg-panel text-muted',
};

const TIER_ICON: Record<number, string> = {
  1: '🟡',
  2: '🟢',
  3: '🔵',
  4: '⚫',
};

function traderieUrl(itemName: string): string {
  const slug = itemName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return `https://traderie.com/diablo2resurrected/product/${slug}`;
}

export default function AppraiserForm() {
  const t = useTranslations('Appraiser');

  const [baseCode, setBaseCode] = useState('');
  const [sockets, setSockets] = useState(4);
  const [ethereal, setEthereal] = useState(false);
  const [ilvl, setIlvl] = useState(85);
  const [result, setResult] = useState<AppraiseResult | null>(null);

  const selectedBase = BASES.find(b => b.code === baseCode);
  const maxSock = selectedBase?.maxSockets ?? 6;

  function handleAppraise() {
    if (!baseCode) return;
    setResult(appraise({ baseCode, sockets, ethereal, ilvl }));
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      {/* ── Inputs ── */}
      <div className="flex flex-col gap-4 bg-panel border border-panel-border rounded-xl p-6">
        {/* Base item selector */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted">
            {t('itemBase')}
          </label>
          <select
            className="bg-panel-alt border border-panel-border-light rounded-lg px-3 py-2 text-parchment-bright focus:outline-none focus:border-gold"
            value={baseCode}
            onChange={e => { setBaseCode(e.target.value); setResult(null); setSockets(Math.min(sockets, BASES.find(b=>b.code===e.target.value)?.maxSockets ?? 6)); }}
          >
            <option value="">{t('selectBase')}</option>
            {['elite','exceptional','normal'].map(tier => (
              <optgroup key={tier} label={t(`tier_${tier}`)}>
                {BASES.filter(b => b.tier === tier).map(b => (
                  <option key={b.code} value={b.code}>{b.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Selected item preview */}
        {selectedBase && (
          <div className="flex items-center gap-3 py-1">
            <Image
              src={`${BASE_PATH}/items/${selectedBase.code}.png`}
              alt={selectedBase.name}
              width={40}
              height={40}
              className="rounded"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <span className="text-sm text-parchment">{selectedBase.name}</span>
          </div>
        )}

        {/* Sockets + Ethereal row */}
        <div className="flex gap-4 flex-wrap">
          <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted">
              {t('sockets')}
            </label>
            <select
              className="bg-panel-alt border border-panel-border-light rounded-lg px-3 py-2 text-parchment-bright focus:outline-none focus:border-gold"
              value={sockets}
              onChange={e => { setSockets(Number(e.target.value)); setResult(null); }}
            >
              {Array.from({ length: maxSock }, (_, i) => i + 1).map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted">
              {t('itemLevel')}
            </label>
            <input
              type="number"
              min={1} max={99}
              className="bg-panel-alt border border-panel-border-light rounded-lg px-3 py-2 text-parchment-bright focus:outline-none focus:border-gold"
              value={ilvl}
              onChange={e => { setIlvl(Number(e.target.value)); setResult(null); }}
            />
          </div>

          <div className="flex flex-col gap-1 justify-end min-w-[120px]">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={ethereal}
                onChange={e => { setEthereal(e.target.checked); setResult(null); }}
                className="w-4 h-4 accent-amber-400"
              />
              <span className="text-sm text-parchment-bright">{t('ethereal')}</span>
            </label>
          </div>
        </div>

        <button
          onClick={handleAppraise}
          disabled={!baseCode}
          className="mt-2 w-full py-3 rounded-xl font-bold text-sm uppercase tracking-wider bg-gold text-ink-950 hover:bg-gold-bright disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          {t('appraise')}
        </button>
      </div>

      {/* ── Result ── */}
      {result && (
        <div className={`mt-6 border-2 rounded-xl p-6 ${TIER_STYLES[result.tier]}`}>
          <div className="flex items-center gap-3 mb-4">
            {selectedBase && (
              <Image
                src={`${BASE_PATH}/items/${selectedBase.code}.png`}
                alt={selectedBase.name}
                width={36}
                height={36}
                className="rounded shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
            <span className="text-2xl">{TIER_ICON[result.tier]}</span>
            <div>
              <div className="text-xl font-bold">{result.tierLabel}</div>
              {selectedBase && (
                <div className="text-xs text-muted mt-0.5">
                  {selectedBase.name} · {sockets}{t('socketsShort')} {ethereal ? `· ${t('eth')}` : ''}
                </div>
              )}
            </div>
          </div>

          {result.ethNote && (
            <div className="mb-3 text-xs bg-panel-alt/60 border border-panel-border-light rounded-lg px-3 py-2 text-gold-bright">
              ⚡ {result.ethNote}
            </div>
          )}

          {result.socketNote && (
            <div className="mb-3 text-xs bg-panel-alt/60 border border-panel-border-light rounded-lg px-3 py-2 text-blue-300">
              ℹ {result.socketNote}
            </div>
          )}

          {result.matchedRunewords.length > 0 ? (
            <>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                {t('eligibleRunewords')}
              </div>
              <div className="flex flex-col gap-2">
                {result.matchedRunewords.map(rw => (
                  <div
                    key={rw.name}
                    className="flex items-center justify-between bg-panel-alt/60 border border-panel-border rounded-lg px-3 py-2 gap-3"
                  >
                    <div>
                      <span className="font-semibold text-parchment-bright">{rw.name}</span>
                      <span className="ml-2 text-xs text-muted">
                        [{rw.runes.join(' · ')}]
                      </span>
                      <div className="flex gap-2 mt-0.5">
                        {rw.ladderOnly && (
                          <span className="text-xs bg-purple-900 text-purple-300 px-1.5 py-0.5 rounded">
                            {t('ladder')}
                          </span>
                        )}
                        {rw.d2rOnly && (
                          <span className="text-xs bg-blue-900 text-blue-300 px-1.5 py-0.5 rounded">
                            D2R
                          </span>
                        )}
                      </div>
                    </div>
                    <a
                      href={traderieUrl(rw.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-xs px-3 py-1.5 rounded-lg border border-panel-border-light text-parchment hover:border-gold hover:text-gold-bright transition-colors"
                    >
                      {t('viewTraderie')} ↗
                    </a>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-sm text-muted italic">
              {t('noRunewords')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
