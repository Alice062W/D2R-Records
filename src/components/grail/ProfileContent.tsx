'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import runewordsFull from '../../../data/runewords-full.json';
import { getAllItemIdsForKind } from '@/lib/grail/catalog';
import { useGrailAuth } from '@/lib/grail/useGrailAuth';
import { useProfile } from '@/lib/grail/useProfile';
import { useOwnedItems } from '@/lib/grail/useOwnedItems';
import { getErrorMessage } from '@/lib/grail/errors';
import type { Server, GameMode, Platform } from '@/lib/grail/profileApi';
import AuthGate from './AuthGate';
import ProfileAvatar from './ProfileAvatar';
import CollectionBadge from '../items/CollectionBadge';

const AVATAR_PRESETS = ['⚔️', '🛡️', '🔥', '❄️', '⚡', '☠️', '🏹', '🧙', '🐺', '💀', '👹', '🗡️'];

const SERVER_OPTIONS: Server[] = ['us', 'europe', 'asia', 'china'];
const MODE_OPTIONS: GameMode[] = ['hardcore', 'softcore'];
const PLATFORM_OPTIONS: Platform[] = ['pc', 'ps', 'xbox', 'ns'];

// Generic pill-button choice group, shared by Server/Mode/Platform/Seasonal
// below — clicking a pill saves immediately (same auto-save pattern as the
// avatar picker), no separate Save button needed.
function ChoicePills<T extends string>({
  options,
  value,
  onSelect,
  labelFor,
}: {
  options: T[];
  value: T | null | undefined;
  onSelect: (choice: T) => void;
  labelFor: (option: T) => string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(option => (
        <button
          key={option}
          type="button"
          onClick={() => onSelect(option)}
          aria-pressed={value === option}
          className={`px-3 py-1.5 rounded-lg text-sm font-cinzel border transition-colors ${
            value === option
              ? 'bg-gold text-ink-950 font-semibold border-gold'
              : 'bg-panel border-panel-border text-parchment hover:border-gold'
          }`}
        >
          {labelFor(option)}
        </button>
      ))}
    </div>
  );
}

const ALL_UNIQUE_IDS = getAllItemIdsForKind('unique');
const ALL_SET_IDS = getAllItemIdsForKind('set');
const ALL_RUNEWORD_IDS = runewordsFull.map(rw => rw.id);

function ProfileContentInner() {
  const t = useTranslations('Grail');
  const tNav = useTranslations('Nav');
  const { user } = useGrailAuth();
  const { profile, save, error: profileError } = useProfile();
  const { ownedIds, loading: ownedLoading } = useOwnedItems();

  // null means "not locally edited yet" — falls back to the fetched
  // profile's value. Avoids syncing fetched data into local state via an
  // effect (which would double-render); once the user types, their edit
  // wins until save() succeeds and clears it back to null.
  const [editedBattletag, setEditedBattletag] = useState<string | null>(null);
  const battletag = editedBattletag ?? profile?.battletag ?? '';
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSaveBattletag() {
    setSaving(true);
    setSavedMessage(null);
    setLocalError(null);
    try {
      await save({ battletag: battletag.trim() || null });
      setEditedBattletag(null);
      setSavedMessage(t('profileSaved'));
    } catch (e) {
      setLocalError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function handlePickAvatar(choice: string | null) {
    setLocalError(null);
    try {
      await save({ avatarChoice: choice });
    } catch (e) {
      setLocalError(getErrorMessage(e));
    }
  }

  async function handleSaveGameSetting(patch: Partial<{ server: Server; gameMode: GameMode; platform: Platform; seasonal: boolean }>) {
    setLocalError(null);
    try {
      await save(patch);
    } catch (e) {
      setLocalError(getErrorMessage(e));
    }
  }

  const name = user?.user_metadata?.full_name as string | undefined;
  const photoUrl = user?.user_metadata?.avatar_url as string | undefined;
  const uniqueOwned = ALL_UNIQUE_IDS.filter(id => ownedIds.has(id)).length;
  const setOwned = ALL_SET_IDS.filter(id => ownedIds.has(id)).length;
  const runewordOwned = ALL_RUNEWORD_IDS.filter(id => ownedIds.has(id)).length;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <ProfileAvatar
          photoUrl={photoUrl}
          avatarChoice={profile?.avatarChoice}
          name={name}
          email={user?.email}
          size="lg"
        />
        <div>
          <p className="text-parchment-bright font-semibold">{name ?? user?.email}</p>
          {name && <p className="text-sm text-muted">{user?.email}</p>}
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-cinzel text-parchment-bright">{t('avatarLabel')}</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handlePickAvatar(null)}
            aria-pressed={!profile?.avatarChoice}
            title={t('useGooglePhoto')}
            className={`w-10 h-10 rounded-full border flex items-center justify-center overflow-hidden transition-colors ${
              !profile?.avatarChoice ? 'border-gold' : 'border-panel-border hover:border-gold'
            }`}
          >
            <ProfileAvatar photoUrl={photoUrl} name={name} email={user?.email} size="sm" />
          </button>
          {AVATAR_PRESETS.map(emoji => (
            <button
              key={emoji}
              type="button"
              onClick={() => handlePickAvatar(emoji)}
              aria-pressed={profile?.avatarChoice === emoji}
              className={`w-10 h-10 rounded-full border flex items-center justify-center text-lg transition-colors ${
                profile?.avatarChoice === emoji ? 'border-gold bg-gold/10' : 'border-panel-border hover:border-gold'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <label htmlFor="battletag" className="text-lg font-cinzel text-parchment-bright">
          {t('battletagLabel')}
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            id="battletag"
            type="text"
            value={battletag}
            onChange={e => setEditedBattletag(e.target.value)}
            placeholder={t('battletagPlaceholder')}
            className="flex-1 px-3 py-2 rounded-lg bg-panel border border-panel-border text-parchment text-sm"
          />
          <button
            type="button"
            onClick={handleSaveBattletag}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-gold text-ink-950 font-semibold text-sm hover:bg-gold-bright transition-colors disabled:opacity-50"
          >
            {saving ? t('saving') : t('save')}
          </button>
        </div>
        {savedMessage && <p className="text-sm text-green-400">{savedMessage}</p>}
      </section>

      <section className="flex flex-col gap-5">
        <h2 className="text-lg font-cinzel text-parchment-bright">{t('gameSettingsTitle')}</h2>

        <div className="flex flex-col gap-2">
          <span className="text-sm text-muted">{t('serverLabel')}</span>
          <ChoicePills
            options={SERVER_OPTIONS}
            value={profile?.server}
            onSelect={server => handleSaveGameSetting({ server })}
            labelFor={option => t(`server_${option}`)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm text-muted">{t('modeLabel')}</span>
          <ChoicePills
            options={MODE_OPTIONS}
            value={profile?.gameMode}
            onSelect={gameMode => handleSaveGameSetting({ gameMode })}
            labelFor={option => t(`mode_${option}`)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm text-muted">{t('platformLabel')}</span>
          <ChoicePills
            options={PLATFORM_OPTIONS}
            value={profile?.platform}
            onSelect={platform => handleSaveGameSetting({ platform })}
            labelFor={option => t(`platform_${option}`)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm text-muted">{t('seasonalLabel')}</span>
          <ChoicePills
            options={['yes', 'no'] as const}
            value={profile?.seasonal === true ? 'yes' : profile?.seasonal === false ? 'no' : null}
            onSelect={choice => handleSaveGameSetting({ seasonal: choice === 'yes' })}
            labelFor={option => t(`seasonal_${option}`)}
          />
        </div>
      </section>

      {(localError ?? profileError) && <p className="text-sm text-red-400">{localError ?? profileError}</p>}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-cinzel text-parchment-bright">{t('collectionStatsTitle')}</h2>
        {ownedLoading ? (
          <p className="text-sm text-muted">{t('loading')}</p>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between bg-panel border border-panel-border rounded-xl px-4 py-3">
              <span className="text-sm text-parchment">{tNav('item_unique')}</span>
              <CollectionBadge owned={uniqueOwned} total={ALL_UNIQUE_IDS.length} />
            </div>
            <div className="flex items-center justify-between bg-panel border border-panel-border rounded-xl px-4 py-3">
              <span className="text-sm text-parchment">{tNav('item_set')}</span>
              <CollectionBadge owned={setOwned} total={ALL_SET_IDS.length} />
            </div>
            <div className="flex items-center justify-between bg-panel border border-panel-border rounded-xl px-4 py-3">
              <span className="text-sm text-parchment">{tNav('item_runewords')}</span>
              <CollectionBadge owned={runewordOwned} total={ALL_RUNEWORD_IDS.length} />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default function ProfileContent() {
  const t = useTranslations('Grail');
  return (
    <AuthGate signInPrompt={t('profileSignInPrompt')}>
      <ProfileContentInner />
    </AuthGate>
  );
}
