import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import HomeCardGrid from './HomeCardGrid';
import messages from '../../messages/en.json';
import { getAllItemIdsForKind } from '@/lib/grail/catalog';
import runewordsFull from '../../data/runewords-full.json';

function renderGrid() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <HomeCardGrid />
    </NextIntlClientProvider>
  );
}

describe('HomeCardGrid', () => {
  it('renders every group and its cards, signed out (no percentage badges)', () => {
    renderGrid();
    expect(screen.getByRole('heading', { name: 'My Chronicle' })).toBeInTheDocument();
    // "My Builds" is both the group heading and its one card's label.
    expect(screen.getByRole('heading', { name: 'My Builds' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'D2R Academy' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Unique Items/ })).toHaveAttribute('href', '/en/items/unique');
    expect(screen.getByRole('link', { name: /Unique Items/ })).not.toHaveTextContent('%');
  });

  it('shows a collection completion % on My Chronicle cards when signed in, and none for other cards', async () => {
    vi.resetModules();
    const allUniqueIds = getAllItemIdsForKind('unique');
    const allRunewordIds = runewordsFull.map(rw => rw.id);
    // Own every unique (100%), no set items (0%), and roughly a third of
    // runewords, to exercise rounding on a non-clean fraction.
    const owned = new Set([...allUniqueIds, ...allRunewordIds.slice(0, Math.round(allRunewordIds.length / 3))]);
    const expectedRunewordPercent = Math.round((Math.round(allRunewordIds.length / 3) / allRunewordIds.length) * 100);

    vi.doMock('@/lib/grail/useOwnedItems', () => ({
      useOwnedItems: () => ({ userId: 'user-1', loading: false, ownedIds: owned, toggle: vi.fn(), error: null }),
    }));
    const { default: HomeCardGridSignedIn } = await import('./HomeCardGrid');
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <HomeCardGridSignedIn />
      </NextIntlClientProvider>
    );

    expect(screen.getByRole('link', { name: /Unique Items/ })).toHaveTextContent('100%');
    expect(screen.getByRole('link', { name: /Set Items/ })).toHaveTextContent('0%');
    expect(screen.getByRole('link', { name: /Runewords/ })).toHaveTextContent(`${expectedRunewordPercent}%`);
    // Links with no percentage tracking (e.g. Base Items, My Builds) show no "%" text.
    expect(screen.getByRole('link', { name: 'Base Items' })).not.toHaveTextContent('%');
    expect(screen.getByRole('link', { name: 'My Builds' })).not.toHaveTextContent('%');
  });
});
