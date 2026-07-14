'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { getAllGrailItems, SLOT_ORDER, type GrailItem } from '@/lib/grail/catalog';
import { insertFind } from '@/lib/grail/findsApi';
import { ACTS, AREAS_BY_ACT, type Act } from '@/lib/grail/zones';
import { getErrorMessage } from '@/lib/grail/errors';

export default function LogFindForm({
  onSaved,
  onCancel,
}: {
  onSaved: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations('Grail');
  const items = getAllGrailItems();
  const [itemId, setItemId] = useState('');
  const [act, setAct] = useState<Act>('Act I');
  const [area, setArea] = useState(AREAS_BY_ACT['Act I'][0]);
  const [ethereal, setEthereal] = useState(false);
  const [foundAt, setFoundAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [statValues, setStatValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected: GrailItem | undefined = items.find(i => i.id === itemId);

  function handleActChange(next: Act) {
    setAct(next);
    setArea(AREAS_BY_ACT[next][0]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      const values: Record<string, number> = {};
      for (const stat of selected.stats) {
        const raw = statValues[stat.key];
        if (raw !== undefined && raw !== '') values[stat.key] = Number(raw);
      }
      await insertFind({
        itemCode: selected.code,
        itemId: selected.id,
        itemKind: selected.kind,
        statValues: values,
        ethereal,
        foundAct: act,
        foundArea: area,
        foundAt,
        notes,
      });
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto flex flex-col gap-4"
      >
        <h3 className="text-lg font-bold text-zinc-100">{t('logFind')}</h3>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{t('itemLabel')}</label>
          <select
            required
            value={itemId}
            onChange={e => { setItemId(e.target.value); setStatValues({}); }}
            className="bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-zinc-100"
          >
            <option value="">{t('selectItem')}</option>
            {SLOT_ORDER.map(slot => {
              const slotItems = items
                .filter(i => i.slotCategory === slot)
                .sort((a, b) => a.name.localeCompare(b.name));
              if (slotItems.length === 0) return null;
              return (
                <optgroup key={slot} label={t(`slot_${slot}`)}>
                  {slotItems.map(i => (
                    <option key={i.id} value={i.id}>{i.name}{i.setName ? ` (${i.setName})` : ''}</option>
                  ))}
                </optgroup>
              );
            })}
          </select>
        </div>

        {selected && selected.stats.length > 0 && (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{t('rolledStats')}</label>
            {selected.stats.map(stat => (
              <div key={stat.key} className="flex items-center gap-2">
                <span className="text-sm text-zinc-300 flex-1">
                  {stat.label} <span className="text-zinc-600 text-xs">({stat.min}-{stat.max})</span>
                </span>
                <input
                  type="number"
                  value={statValues[stat.key] ?? ''}
                  onChange={e => setStatValues(v => ({ ...v, [stat.key]: e.target.value }))}
                  className="w-24 bg-zinc-800 border border-zinc-600 rounded-lg px-2 py-1 text-zinc-100"
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-4">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{t('act')}</label>
            <select
              value={act}
              onChange={e => handleActChange(e.target.value as Act)}
              className="bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-zinc-100"
            >
              {ACTS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{t('area')}</label>
            <select
              value={area}
              onChange={e => setArea(e.target.value)}
              className="bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-zinc-100"
            >
              {AREAS_BY_ACT[act].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-4 items-end">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{t('foundDate')}</label>
            <input
              type="date"
              value={foundAt}
              onChange={e => setFoundAt(e.target.value)}
              className="bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-zinc-100"
            />
          </div>
          <label className="flex items-center gap-2 pb-2">
            <input
              type="checkbox"
              checked={ethereal}
              onChange={e => setEthereal(e.target.checked)}
              className="w-4 h-4 accent-amber-400"
            />
            <span className="text-sm text-zinc-200">{t('ethereal')}</span>
          </label>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{t('notes')}</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            className="bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-zinc-100"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200">
            {t('cancel')}
          </button>
          <button
            type="submit"
            disabled={!selected || saving}
            className="px-4 py-2 rounded-lg bg-amber-500 text-zinc-950 font-semibold text-sm hover:bg-amber-400 disabled:opacity-30 transition-colors"
          >
            {saving ? t('saving') : t('save')}
          </button>
        </div>
      </form>
    </div>
  );
}
