import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '../../../messages/en.json';

describe('CollectionSummaryBar', () => {
  it('renders nothing when signed out', async () => {
    vi.resetModules();
    vi.doMock('@/lib/grail/useOwnedItems', () => ({
      useOwnedItems: () => ({ userId: null, loading: false, ownedIds: new Set(), toggle: vi.fn(), error: null }),
    }));
    const { default: CollectionSummaryBar } = await import('./CollectionSummaryBar');
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CollectionSummaryBar itemIds={['unique-1', 'unique-2']} />
      </NextIntlClientProvider>
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows "Your Collection" with the owned/total count across the given item ids when signed in', async () => {
    vi.resetModules();
    vi.doMock('@/lib/grail/useOwnedItems', () => ({
      useOwnedItems: () => ({
        userId: 'user-1', loading: false, ownedIds: new Set(['unique-1']), toggle: vi.fn(), error: null,
      }),
    }));
    const { default: CollectionSummaryBar } = await import('./CollectionSummaryBar');
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CollectionSummaryBar itemIds={['unique-1', 'unique-2', 'unique-3']} />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('Your Collection')).toBeInTheDocument();
    expect(screen.getByText('1/3 (33%)')).toBeInTheDocument();
  });

  it('ignores owned ids that are not in the given itemIds list', async () => {
    vi.resetModules();
    vi.doMock('@/lib/grail/useOwnedItems', () => ({
      useOwnedItems: () => ({
        userId: 'user-1', loading: false, ownedIds: new Set(['unique-1', 'runeword-Runeword1']), toggle: vi.fn(), error: null,
      }),
    }));
    const { default: CollectionSummaryBar } = await import('./CollectionSummaryBar');
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CollectionSummaryBar itemIds={['unique-1', 'unique-2']} />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('1/2 (50%)')).toBeInTheDocument();
  });
});
