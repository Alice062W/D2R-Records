import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import ItemStatCard from './ItemStatCard';
import type { GrailItem } from '@/lib/grail/catalog';
import messages from '../../../messages/en.json';

describe('ItemStatCard', () => {
  it('renders name, base stats, and magic properties', () => {
    const item: GrailItem = {
      id: 'unique-0', code: 'hax', name: 'The Gnasher', kind: 'unique', setName: null,
      levelReq: 5, baseName: 'Hand Axe', grade: 'normal', slotCategory: 'axes',
      defense: null, requiredStrength: null, durability: 28, invFile: 'invhaxu',
      stats: [{ key: 'dmg%', label: 'Enhanced Damage %', min: 60, max: 70, isSkillRef: false }],
      fixedStats: [{ key: 'str', label: 'Strength', value: 8, isSkillRef: false }],
      setBonuses: [], statPriority: ['dmg%'], note: null,
    };
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ItemStatCard item={item} />
      </NextIntlClientProvider>
    );
    expect(screen.getByRole('heading', { name: 'The Gnasher' })).toBeInTheDocument();
    expect(screen.getByText(/Hand Axe/)).toBeInTheDocument();
    expect(screen.getByText(/Enhanced Damage %/)).toBeInTheDocument();
    expect(screen.getByText(/60–70/)).toBeInTheDocument();
    expect(screen.getByText(/Strength/)).toBeInTheDocument();
  });

  it('does not crash when setName is null and there are no stats or set bonuses', () => {
    const item: GrailItem = {
      id: 'unique-1', code: 'y', name: 'Bare Item', kind: 'unique', setName: null,
      levelReq: 1, baseName: 'Base', grade: 'normal', slotCategory: 'helms',
      defense: { min: 10, max: 12 }, requiredStrength: 20, durability: 40,
      invFile: '', stats: [], fixedStats: [], setBonuses: [], statPriority: [], note: null,
    };
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ItemStatCard item={item} />
      </NextIntlClientProvider>
    );
    expect(screen.getByRole('heading', { name: 'Bare Item' })).toBeInTheDocument();
  });

  it('renders an icon when invFile is present', () => {
    const item: GrailItem = {
      id: 'unique-0', code: 'hax', name: 'The Gnasher', kind: 'unique', setName: null,
      levelReq: 5, baseName: 'Hand Axe', grade: 'normal', slotCategory: 'axes',
      defense: null, requiredStrength: null, durability: 28, invFile: 'invhaxu',
      stats: [], fixedStats: [], setBonuses: [], statPriority: [], note: null,
    };
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
    const item: GrailItem = {
      id: 'unique-1', code: 'y', name: 'Bare Item', kind: 'unique', setName: null,
      levelReq: 1, baseName: 'Base', grade: 'normal', slotCategory: 'helms',
      defense: { min: 10, max: 12 }, requiredStrength: 20, durability: 40,
      invFile: '', stats: [], fixedStats: [], setBonuses: [], statPriority: [], note: null,
    };
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ItemStatCard item={item} />
      </NextIntlClientProvider>
    );
    expect(document.querySelector('img')).toBeNull();
  });

  it('colors variable stats yellow, fixed stats blue, and skill-ref stats pink regardless of which array they are in', () => {
    const item: GrailItem = {
      id: 'unique-2', code: 'x', name: 'Test Item', kind: 'unique', setName: null,
      levelReq: 1, baseName: 'Base', grade: 'normal', slotCategory: 'axes',
      defense: null, requiredStrength: null, durability: null, invFile: '',
      stats: [
        { key: 'dmg%', label: 'Enhanced Damage %', min: 60, max: 70, isSkillRef: false },
        { key: 'skill:1', label: 'Level 1-20 Fireball', min: 1, max: 20, isSkillRef: true },
      ],
      fixedStats: [
        { key: 'str', label: 'Strength', value: 8, isSkillRef: false },
        { key: 'oskill:2', label: 'Combat Skills', value: 2, isSkillRef: true },
      ],
      setBonuses: [], statPriority: [], note: null,
    };
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ItemStatCard item={item} />
      </NextIntlClientProvider>
    );
    expect(screen.getByText(/Enhanced Damage %/).closest('div')).toHaveClass('text-[#fff818]');
    expect(screen.getByText(/Level 1-20 Fireball/).closest('div')).toHaveClass('text-[#ff4a69]');
    expect(screen.getByText(/Strength/).closest('div')).toHaveClass('text-[#8080f3]');
    expect(screen.getByText(/Combat Skills/).closest('div')).toHaveClass('text-[#ff4a69]');
  });

  it('marks variable stats (including skill-ref ones) with a dice icon, but not fixed stats', () => {
    const item: GrailItem = {
      id: 'unique-3', code: 'x', name: 'Test Item', kind: 'unique', setName: null,
      levelReq: 1, baseName: 'Base', grade: 'normal', slotCategory: 'axes',
      defense: null, requiredStrength: null, durability: null, invFile: '',
      stats: [
        { key: 'dmg%', label: 'Enhanced Damage %', min: 60, max: 70, isSkillRef: false },
        { key: 'skill:1', label: 'Level 1-20 Fireball', min: 1, max: 20, isSkillRef: true },
      ],
      fixedStats: [
        { key: 'oskill:2', label: 'Combat Skills', value: 2, isSkillRef: true },
      ],
      setBonuses: [
        { key: 'res-all', label: 'All Resistances', min: 50, max: 50, isSkillRef: false },
        { key: 'sor', label: 'Sorceress Skill Levels', min: 3, max: 6, isSkillRef: true },
      ],
      statPriority: [], note: null,
    };
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ItemStatCard item={item} />
      </NextIntlClientProvider>
    );
    expect(screen.getByText(/Enhanced Damage %/).closest('div')).toHaveTextContent('🎲');
    expect(screen.getByText(/Level 1-20 Fireball/).closest('div')).toHaveTextContent('🎲');
    expect(screen.getByText(/Combat Skills/).closest('div')).not.toHaveTextContent('🎲');
    expect(screen.getByText(/All Resistances/).closest('div')).not.toHaveTextContent('🎲');
    expect(screen.getByText(/Sorceress Skill Levels/).closest('div')).toHaveTextContent('🎲');
  });

  describe('owned checkbox', () => {
    const baseItem: GrailItem = {
      id: 'unique-99', code: 'x', name: 'Test Item', kind: 'unique', setName: null,
      levelReq: 1, baseName: 'Base', grade: 'normal', slotCategory: 'axes',
      defense: null, requiredStrength: null, durability: null, invFile: '',
      stats: [], fixedStats: [], setBonuses: [], statPriority: [], note: null,
    };

    it('renders no checkbox when signed out', async () => {
      vi.resetModules();
      vi.doMock('@/lib/grail/useOwnedItems', () => ({
        useOwnedItems: () => ({ userId: null, loading: false, ownedIds: new Set(), toggle: vi.fn(), error: null }),
      }));
      const { default: ItemStatCard } = await import('./ItemStatCard');
      render(
        <NextIntlClientProvider locale="en" messages={messages}>
          <ItemStatCard item={baseItem} />
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
          <ItemStatCard item={baseItem} />
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
          <ItemStatCard item={baseItem} />
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
          <ItemStatCard item={baseItem} />
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
          <ItemStatCard item={baseItem} />
        </NextIntlClientProvider>
      );
      expect(container.firstChild).toHaveClass('bg-panel');
    });
  });
});
