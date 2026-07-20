import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import CategoryCardGrid from './CategoryCardGrid';
import messages from '../../../messages/en.json';

function renderGrid(categories: string[]) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <CategoryCardGrid categories={categories} basePath="/en/items/unique" />
    </NextIntlClientProvider>
  );
}

describe('CategoryCardGrid', () => {
  it('renders one card link per category with the correct href', () => {
    renderGrid(['helms', 'axes']);
    expect(screen.getByRole('link', { name: 'Helms' })).toHaveAttribute(
      'href',
      '/en/items/unique/helms'
    );
    expect(screen.getByRole('link', { name: 'Axes' })).toHaveAttribute(
      'href',
      '/en/items/unique/axes'
    );
  });

  it('renders no cards for an empty category list', () => {
    renderGrid([]);
    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });

  it('falls back to AffixCategories for a category with no matching Grail slot key', () => {
    renderGrid(['circlets']);
    expect(screen.getByRole('link', { name: 'Circlets' })).toHaveAttribute(
      'href',
      '/en/items/unique/circlets'
    );
  });

  it('renders an icon for a category present in the icon map', () => {
    renderGrid(['helms']);
    const img = document.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('alt')).toBe('');
  });

  it('renders no icon for a category absent from the icon map', () => {
    renderGrid(['weapons']);
    expect(document.querySelector('img')).toBeNull();
  });

  it('does not call useOwnedItems-derived UI when itemIdsByCategory is omitted (Magic/Rare/Base pages)', () => {
    renderGrid(['helms']);
    expect(screen.queryByText(/\d\/\d/)).not.toBeInTheDocument();
  });

  it('shows no badge and no highlight when signed out, even with itemIdsByCategory provided', async () => {
    vi.resetModules();
    vi.doMock('@/lib/grail/useOwnedItems', () => ({
      useOwnedItems: () => ({ userId: null, loading: false, ownedIds: new Set(), toggle: vi.fn(), error: null }),
    }));
    const { default: CategoryCardGridMocked } = await import('./CategoryCardGrid');
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CategoryCardGridMocked categories={['helms']} basePath="/en/items/unique" itemIdsByCategory={{ helms: ['unique-1', 'unique-2'] }} />
      </NextIntlClientProvider>
    );
    expect(screen.queryByText(/\d\/\d/)).not.toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveClass('bg-panel');
  });

  it('shows a partial x/y badge (no highlight) when some but not all items in a category are owned', async () => {
    vi.resetModules();
    vi.doMock('@/lib/grail/useOwnedItems', () => ({
      useOwnedItems: () => ({
        userId: 'user-1', loading: false, ownedIds: new Set(['unique-1']), toggle: vi.fn(), error: null,
      }),
    }));
    const { default: CategoryCardGridMocked } = await import('./CategoryCardGrid');
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CategoryCardGridMocked categories={['helms']} basePath="/en/items/unique" itemIdsByCategory={{ helms: ['unique-1', 'unique-2'] }} />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('1/2 (50%)')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveClass('bg-panel');
  });

  it('shows the complete badge and highlight when every item in a category is owned', async () => {
    vi.resetModules();
    vi.doMock('@/lib/grail/useOwnedItems', () => ({
      useOwnedItems: () => ({
        userId: 'user-1', loading: false, ownedIds: new Set(['unique-1', 'unique-2']), toggle: vi.fn(), error: null,
      }),
    }));
    const { default: CategoryCardGridMocked } = await import('./CategoryCardGrid');
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CategoryCardGridMocked categories={['helms']} basePath="/en/items/unique" itemIdsByCategory={{ helms: ['unique-1', 'unique-2'] }} />
      </NextIntlClientProvider>
    );
    expect(screen.getByText(/Complete!/)).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveClass('bg-green-950/30');
  });
});
