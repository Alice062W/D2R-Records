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
    // Signed out -> "Item Collections", not "My Chronicle".
    expect(screen.getByRole('heading', { name: 'Item Collections' })).toBeInTheDocument();
    // "Popular Builds" is both the group heading and its one card's label.
    expect(screen.getByRole('heading', { name: 'Popular Builds' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'D2R Academy' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Unique Items/ })).toHaveAttribute('href', '/en/items/unique');
    expect(screen.getByRole('link', { name: /Unique Items/ })).not.toHaveTextContent('%');
  });

  it('shows a CollectionBadge and completeness color on My Chronicle cards when signed in, and neither for other cards', async () => {
    vi.resetModules();
    const allUniqueIds = getAllItemIdsForKind('unique');
    const allSetIds = getAllItemIdsForKind('set');
    const allRunewordIds = runewordsFull.map(rw => rw.id);
    // Own every unique (complete/100%), no set items (none/0%), and roughly
    // a third of runewords (partial), to exercise all three states.
    const owned = new Set([...allUniqueIds, ...allRunewordIds.slice(0, Math.round(allRunewordIds.length / 3))]);
    const expectedRunewordOwned = Math.round(allRunewordIds.length / 3);

    vi.doMock('@/lib/grail/useOwnedItems', () => ({
      useOwnedItems: () => ({ userId: 'user-1', loading: false, ownedIds: owned, toggle: vi.fn(), error: null }),
    }));
    const { default: HomeCardGridSignedIn } = await import('./HomeCardGrid');
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <HomeCardGridSignedIn />
      </NextIntlClientProvider>
    );

    // Signed in -> "My Chronicle", not "Item Collections".
    expect(screen.getByRole('heading', { name: 'My Chronicle' })).toBeInTheDocument();

    // Complete (100% owned) -> 100% progress bar and green border.
    const uniqueCard = screen.getByRole('link', { name: /Unique Items/ });
    expect(uniqueCard).toHaveTextContent('100%');
    expect(uniqueCard).toHaveTextContent(`${allUniqueIds.length}/${allUniqueIds.length}`);
    expect(uniqueCard).toHaveClass('border-green-500/60');

    // None owned -> 0% progress bar, default (non-tinted) border.
    const setCard = screen.getByRole('link', { name: /Set Items/ });
    expect(setCard).toHaveTextContent('0%');
    expect(setCard).toHaveTextContent(`0/${allSetIds.length}`);
    expect(setCard).toHaveClass('border-panel-border');

    // Partial -> amber border.
    const runewordCard = screen.getByRole('link', { name: /Runewords/ });
    expect(runewordCard).toHaveTextContent(`${expectedRunewordOwned}/${allRunewordIds.length}`);
    expect(runewordCard).toHaveClass('border-amber-500/50');

    // Links with no ownership tracking (e.g. Base Items, Popular Builds) show no badge.
    expect(screen.getByRole('link', { name: 'Base Items' })).not.toHaveTextContent('/');
    expect(screen.getByRole('link', { name: 'Popular Builds' })).not.toHaveTextContent('/');
  });
});
