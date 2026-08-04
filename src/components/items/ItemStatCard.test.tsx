import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import ItemStatCard from './ItemStatCard';
import type { GrailItem } from '@/lib/grail/catalog';
import messages from '../../../messages/en.json';

function baseItem(overrides: Partial<GrailItem> = {}): GrailItem {
  return {
    id: 'unique-0', code: 'hax', name: 'The Gnasher', kind: 'unique', setName: null,
    levelReq: 5, baseName: 'Hand Axe', grade: 'normal', slotCategory: 'axes',
    defense: null, oneHandDamage: null, twoHandDamage: null, requiredStrength: null,
    requiredDexterity: null, weaponSpeed: null, durability: 28, classRestriction: null,
    invFile: 'invhaxu', hdIcon: null,
    properties: [], setPiecesBonuses: [], setFullBonus: [], setBonuses: [],
    statPriority: [], ladderRestricted: false, firstLadderSeason: null, lastLadderSeason: null,
    ...overrides,
  };
}

describe('ItemStatCard', () => {
  it('renders name, base stats, and magic properties', () => {
    const item = baseItem({
      properties: [{ code: 'dmg%', label: 'Enhanced Damage +65%', min: 60, max: 70, variable: true }],
    });
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ItemStatCard item={item} />
      </NextIntlClientProvider>
    );
    expect(screen.getByRole('heading', { name: 'The Gnasher' })).toBeInTheDocument();
    expect(screen.getByText(/Hand Axe/)).toBeInTheDocument();
    expect(screen.getByText(/Enhanced Damage \+65%/)).toBeInTheDocument();
  });

  it('does not crash when setName is null and there are no properties or set bonuses', () => {
    const item = baseItem({
      id: 'unique-1', code: 'y', name: 'Bare Item', slotCategory: 'helms',
      defense: { min: 10, max: 12 }, requiredStrength: 20, durability: 40, invFile: '',
    });
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ItemStatCard item={item} />
      </NextIntlClientProvider>
    );
    expect(screen.getByRole('heading', { name: 'Bare Item' })).toBeInTheDocument();
  });

  it('renders an icon when invFile is present', () => {
    const item = baseItem();
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ItemStatCard item={item} />
      </NextIntlClientProvider>
    );
    const img = document.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('src')).toBe('/items/inv/invhaxu.png');
    expect(img?.getAttribute('alt')).toBe('');
  });

  it('renders no icon when invFile is empty', () => {
    const item = baseItem({
      id: 'unique-1', code: 'y', name: 'Bare Item', slotCategory: 'helms',
      defense: { min: 10, max: 12 }, requiredStrength: 20, durability: 40, invFile: '',
    });
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ItemStatCard item={item} />
      </NextIntlClientProvider>
    );
    expect(document.querySelector('img')).toBeNull();
  });

  it('renders properties, set full bonus, and set pieces bonuses each under their own heading', () => {
    const item = baseItem({
      kind: 'set', setName: 'Test Set',
      properties: [{ code: 'dmg%', label: 'Enhanced Damage +65%', min: 60, max: 70, variable: true }],
      setFullBonus: [{ code: 'res-all', label: 'All Resistances +50', min: 50, max: 50, variable: false }],
      setPiecesBonuses: [
        { code: 'str', label: '+10 to Strength', min: 10, max: 10, variable: false, piecesRequired: 2 },
        { code: 'vit', label: '+10 to Vitality', min: 10, max: 10, variable: false, piecesRequired: 2 },
      ],
    });
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ItemStatCard item={item} />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('Enhanced Damage +65%')).toBeInTheDocument();
    expect(screen.getByText('All Resistances +50')).toBeInTheDocument();
    expect(screen.getByText('+10 to Strength')).toBeInTheDocument();
    expect(screen.getByText('+10 to Vitality')).toBeInTheDocument();
  });

  describe('owned checkbox', () => {
    const ownedBaseItem = baseItem({ id: 'unique-99', code: 'x', name: 'Test Item', invFile: '' });

    it('renders no checkbox when signed out', async () => {
      vi.resetModules();
      vi.doMock('@/lib/grail/useOwnedItems', () => ({
        useOwnedItems: () => ({ userId: null, loading: false, ownedIds: new Set(), toggle: vi.fn(), error: null }),
      }));
      const { default: ItemStatCard } = await import('./ItemStatCard');
      render(
        <NextIntlClientProvider locale="en" messages={messages}>
          <ItemStatCard item={ownedBaseItem} />
        </NextIntlClientProvider>
      );
      expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    });

    it('renders an unowned toggle ("Mark as Owned") for an unowned item when signed in', async () => {
      vi.resetModules();
      vi.doMock('@/lib/grail/useOwnedItems', () => ({
        useOwnedItems: () => ({ userId: 'user-1', loading: false, ownedIds: new Set(), toggle: vi.fn(), error: null }),
      }));
      const { default: ItemStatCard } = await import('./ItemStatCard');
      render(
        <NextIntlClientProvider locale="en" messages={messages}>
          <ItemStatCard item={ownedBaseItem} />
        </NextIntlClientProvider>
      );
      const toggleButton = screen.getByRole('switch');
      expect(toggleButton).toHaveAttribute('aria-checked', 'false');
      expect(toggleButton).toHaveTextContent('Mark as Owned');
    });

    it('renders an owned toggle ("Collected") for an owned item, and calls toggle with the item id and kind on click', async () => {
      const toggle = vi.fn();
      vi.resetModules();
      vi.doMock('@/lib/grail/useOwnedItems', () => ({
        useOwnedItems: () => ({ userId: 'user-1', loading: false, ownedIds: new Set(['unique-99']), toggle, error: null }),
      }));
      const { default: ItemStatCard } = await import('./ItemStatCard');
      render(
        <NextIntlClientProvider locale="en" messages={messages}>
          <ItemStatCard item={ownedBaseItem} />
        </NextIntlClientProvider>
      );
      const toggleButton = screen.getByRole('switch');
      expect(toggleButton).toHaveAttribute('aria-checked', 'true');
      expect(toggleButton).toHaveTextContent('Collected');
      fireEvent.click(toggleButton);
      expect(toggle).toHaveBeenCalledWith('unique-99', 'unique');
    });

    it('highlights the card background when the item is owned', async () => {
      vi.resetModules();
      vi.doMock('@/lib/grail/useOwnedItems', () => ({
        useOwnedItems: () => ({ userId: 'user-1', loading: false, ownedIds: new Set(['unique-99']), toggle: vi.fn(), error: null }),
      }));
      const { default: ItemStatCard } = await import('./ItemStatCard');
      const { container } = render(
        <NextIntlClientProvider locale="en" messages={messages}>
          <ItemStatCard item={ownedBaseItem} />
        </NextIntlClientProvider>
      );
      expect(container.firstChild).toHaveClass('bg-green-950/30');
    });

    it('does not highlight the card background when the item is not owned', async () => {
      vi.resetModules();
      vi.doMock('@/lib/grail/useOwnedItems', () => ({
        useOwnedItems: () => ({ userId: 'user-1', loading: false, ownedIds: new Set(), toggle: vi.fn(), error: null }),
      }));
      const { default: ItemStatCard } = await import('./ItemStatCard');
      const { container } = render(
        <NextIntlClientProvider locale="en" messages={messages}>
          <ItemStatCard item={ownedBaseItem} />
        </NextIntlClientProvider>
      );
      expect(container.firstChild).toHaveClass('bg-panel');
    });
  });
});
