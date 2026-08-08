import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import SetGroupDetail from './SetGroupDetail';
import type { GrailItem } from '@/lib/grail/catalog';
import messages from '../../../messages/en.json';

function baseItem(overrides: Partial<GrailItem> = {}): GrailItem {
  return {
    id: 'set-1', code: 'xxx', name: "Aldur's Advance", kind: 'set', setName: "Aldur's Watchtower",
    levelReq: 45, baseName: 'Battle Boots', grade: 'exceptional', slotCategory: 'boots',
    defense: null, oneHandDamage: null, twoHandDamage: null, requiredStrength: 95,
    requiredDexterity: null, weaponSpeed: null, durability: 18, sockets: null, classRestriction: null,
    invFile: '', hdIcon: null,
    properties: [], setPiecesBonuses: [], setFullBonus: [], setBonuses: [],
    statPriority: [], ladderRestricted: false, firstLadderSeason: null, lastLadderSeason: null,
    ...overrides,
  };
}

describe('SetGroupDetail', () => {
  it('renders every piece plus partial and full-set bonuses', () => {
    const piece = baseItem();
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <SetGroupDetail
          setName="Aldur's Watchtower"
          pieces={[piece]}
          partialBonuses={[{ piecesRequired: 2, properties: [{ code: 'att%', label: 'Attack Rating +150%' }] }]}
          fullSetBonus={[{ code: 'res-all', label: 'All Resistances +50' }]}
        />
      </NextIntlClientProvider>
    );
    expect(screen.getByRole('heading', { name: "Aldur's Advance" })).toBeInTheDocument();
    expect(screen.getByText('Attack Rating +150%')).toBeInTheDocument();
    expect(screen.getByText('All Resistances +50')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});

describe('SetGroupDetail — collected/missing filter', () => {
  const pieceA = baseItem({ id: 'set-1', code: 'a', name: 'Piece A' });
  const pieceB = baseItem({ ...pieceA, id: 'set-2', name: 'Piece B' });

  it('shows no filter control when signed out', async () => {
    vi.resetModules();
    vi.doMock('@/lib/grail/useOwnedItems', () => ({
      useOwnedItems: () => ({ userId: null, loading: false, ownedIds: new Set(), toggle: vi.fn(), error: null }),
    }));
    const { default: SetGroupDetailMocked } = await import('./SetGroupDetail');
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <SetGroupDetailMocked setName="Test Set" pieces={[pieceA, pieceB]} partialBonuses={[]} fullSetBonus={[]} />
      </NextIntlClientProvider>
    );
    expect(screen.queryByRole('button', { name: 'Collected' })).not.toBeInTheDocument();
    vi.doUnmock('@/lib/grail/useOwnedItems');
  });

  it('filters pieces to only owned ones when "Collected" is clicked', async () => {
    vi.resetModules();
    vi.doMock('@/lib/grail/useOwnedItems', () => ({
      useOwnedItems: () => ({
        userId: 'user-1', loading: false, ownedIds: new Set(['set-1']), toggle: vi.fn(), error: null,
      }),
    }));
    const { default: SetGroupDetailMocked } = await import('./SetGroupDetail');
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <SetGroupDetailMocked setName="Test Set" pieces={[pieceA, pieceB]} partialBonuses={[]} fullSetBonus={[]} />
      </NextIntlClientProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Collected' }));
    expect(screen.getByText('Piece A')).toBeInTheDocument();
    expect(screen.queryByText('Piece B')).not.toBeInTheDocument();
    vi.doUnmock('@/lib/grail/useOwnedItems');
  });
});
