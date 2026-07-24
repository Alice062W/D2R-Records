import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import CategoryItemList from './CategoryItemList';
import { getAllGrailItems, localizeGrailItem, sortItemsForDisplay } from '@/lib/grail/catalog';
import messages from '../../../messages/en.json';
import type { GrailItem } from '@/lib/grail/catalog';

function makeItem(id: string, name: string): GrailItem {
  return {
    id, code: id, name, kind: 'unique', setName: null,
    levelReq: 1, baseName: 'Base', grade: 'normal', slotCategory: 'axes',
    defense: null, oneHandDamage: null, twoHandDamage: null, requiredStrength: null, requiredDexterity: null, weaponSpeed: null, durability: null, invFile: '',
    stats: [], fixedStats: [], setBonuses: [], statPriority: [], note: null, statPools: [],
  };
}

function itemsFor(kind: 'unique' | 'set', category: string) {
  return sortItemsForDisplay(
    getAllGrailItems()
      .filter(i => i.kind === kind && i.slotCategory === category)
      .map(i => localizeGrailItem(i, 'en'))
  );
}

function renderList(items: ReturnType<typeof itemsFor>) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <CategoryItemList items={items} />
    </NextIntlClientProvider>
  );
}

describe('CategoryItemList', () => {
  it('shows grade tabs and filters when a category spans multiple grades', () => {
    renderList(itemsFor('unique', 'axes'));
    expect(screen.getByRole('button', { name: 'Normal' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Exceptional' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Elite' })).toBeInTheDocument();

    expect(screen.getByText('The Gnasher')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Elite' }));
    expect(screen.queryByText('The Gnasher')).not.toBeInTheDocument();
  });

  it('hides grade tabs for a single-grade category', () => {
    renderList(itemsFor('unique', 'jewels'));
    expect(screen.queryByRole('button', { name: 'Normal' })).not.toBeInTheDocument();
  });

  it('renders all items for the category with no filtering by default', () => {
    const items = itemsFor('unique', 'rings');
    renderList(items);
    expect(screen.getByText('Nagelring')).toBeInTheDocument();
    expect(screen.getByText('Manald Heal')).toBeInTheDocument();
  });
});

describe('CategoryItemList — collected/missing filter', () => {
  it('shows no filter control when signed out', async () => {
    vi.resetModules();
    vi.doMock('@/lib/grail/useOwnedItems', () => ({
      useOwnedItems: () => ({ userId: null, loading: false, ownedIds: new Set(), toggle: vi.fn(), error: null }),
    }));
    const { default: CategoryItemListMocked } = await import('./CategoryItemList');
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CategoryItemListMocked items={[makeItem('unique-1', 'Item A')]} />
      </NextIntlClientProvider>
    );
    expect(screen.queryByRole('button', { name: 'Collected' })).not.toBeInTheDocument();
    vi.doUnmock('@/lib/grail/useOwnedItems');
  });

  it('filters to only owned items when "Collected" is clicked', async () => {
    vi.resetModules();
    vi.doMock('@/lib/grail/useOwnedItems', () => ({
      useOwnedItems: () => ({
        userId: 'user-1', loading: false, ownedIds: new Set(['unique-1']), toggle: vi.fn(), error: null,
      }),
    }));
    const { default: CategoryItemListMocked } = await import('./CategoryItemList');
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CategoryItemListMocked items={[makeItem('unique-1', 'Item A'), makeItem('unique-2', 'Item B')]} />
      </NextIntlClientProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Collected' }));
    expect(screen.getByText('Item A')).toBeInTheDocument();
    expect(screen.queryByText('Item B')).not.toBeInTheDocument();
    vi.doUnmock('@/lib/grail/useOwnedItems');
  });

  it('filters to only unowned items when "Missing" is clicked', async () => {
    vi.resetModules();
    vi.doMock('@/lib/grail/useOwnedItems', () => ({
      useOwnedItems: () => ({
        userId: 'user-1', loading: false, ownedIds: new Set(['unique-1']), toggle: vi.fn(), error: null,
      }),
    }));
    const { default: CategoryItemListMocked } = await import('./CategoryItemList');
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CategoryItemListMocked items={[makeItem('unique-1', 'Item A'), makeItem('unique-2', 'Item B')]} />
      </NextIntlClientProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Missing' }));
    expect(screen.queryByText('Item A')).not.toBeInTheDocument();
    expect(screen.getByText('Item B')).toBeInTheDocument();
    vi.doUnmock('@/lib/grail/useOwnedItems');
  });

  it('shows all items when "All" is active (the default)', async () => {
    vi.resetModules();
    vi.doMock('@/lib/grail/useOwnedItems', () => ({
      useOwnedItems: () => ({
        userId: 'user-1', loading: false, ownedIds: new Set(['unique-1']), toggle: vi.fn(), error: null,
      }),
    }));
    const { default: CategoryItemListMocked } = await import('./CategoryItemList');
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CategoryItemListMocked items={[makeItem('unique-1', 'Item A'), makeItem('unique-2', 'Item B')]} />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('Item A')).toBeInTheDocument();
    expect(screen.getByText('Item B')).toBeInTheDocument();
    vi.doUnmock('@/lib/grail/useOwnedItems');
  });
});
