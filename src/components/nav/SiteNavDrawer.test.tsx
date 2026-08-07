import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import SiteNavDrawer from './SiteNavDrawer';
import messages from '../../../messages/en.json';
import { getAllItemIdsForKind } from '@/lib/grail/catalog';
import runewordsFull from '../../../data/runewords.json';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/en',
}));

function renderDrawer() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <SiteNavDrawer />
    </NextIntlClientProvider>
  );
}

describe('SiteNavDrawer', () => {
  it('is closed by default (no nav links visible)', () => {
    renderDrawer();
    expect(screen.getByRole('link', { name: 'D2R Institute' })).toHaveAttribute('href', '/en');
    expect(screen.queryByRole('link', { name: 'Unique Items' })).not.toBeInTheDocument();
  });

  it('opens on hamburger click and shows all groups and links', () => {
    renderDrawer();
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));

    // Signed out -> "Item Collections", not "My Chronicle".
    expect(screen.getByRole('heading', { name: 'Item Collections' })).toBeInTheDocument();
    // "Popular Builds" is both the group heading and its one link's label.
    expect(screen.getByRole('heading', { name: 'Popular Builds' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'D2R Academy' })).toBeInTheDocument();
    expect(screen.queryByText('Our Tools')).not.toBeInTheDocument();

    const expectedLinks: [string, string][] = [
      // Item Collections
      ['Unique Items', '/en/items/unique'],
      ['Set Items', '/en/items/set'],
      ['Runewords', '/en/items/runewords'],
      // Popular Builds
      ['Popular Builds', '/en/builds'],
      // D2R Academy
      ['Base Items', '/en/items/base'],
      ['Magic Item Affixes', '/en/items/magic'],
      ['Rare Item Affixes', '/en/items/rare'],
      ['Runes', '/en/items/runes'],
      ['Cube Recipes', '/en/items/cube-recipes'],
      ['Crafted Items', '/en/items/crafted'],
      ['FCR/FHR/FBR', '/en/character/fcr-fhr-fbr'],
      ['About Us', '/en/about'],
    ];
    for (const [label, href] of expectedLinks) {
      expect(screen.getByRole('link', { name: label })).toHaveAttribute('href', href);
    }
    // The "Our Tools" group (Appraiser/Grail Tracker) is hidden — those
    // links no longer appear in the drawer at all.
    expect(screen.queryByRole('link', { name: 'Appraiser' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Grail Tracker' })).not.toBeInTheDocument();
    // Alvl85 Areas / Area Level / Level Up / Max Sockets pages are hidden.
    expect(screen.queryByRole('link', { name: 'Alvl85 Areas' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Area Level' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Level Up' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Max Sockets' })).not.toBeInTheDocument();
  });

  it('closes when the backdrop is clicked', () => {
    renderDrawer();
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(screen.getByRole('link', { name: 'Unique Items' })).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('nav-drawer-backdrop'));
    expect(screen.queryByRole('link', { name: 'Unique Items' })).not.toBeInTheDocument();
  });

  it('closes when a link inside it is clicked', () => {
    renderDrawer();
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    fireEvent.click(screen.getByRole('link', { name: 'Unique Items' }));
    expect(screen.queryByRole('link', { name: 'Set Items' })).not.toBeInTheDocument();
  });

  it('shows the support link, account control, and locale switcher in the top bar regardless of drawer state', async () => {
    renderDrawer();
    expect(screen.getByRole('link', { name: /Support this tool/ })).toHaveAttribute('href', 'https://ko-fi.com');
    // Signed out (no Supabase env vars in the test environment) — the
    // account control renders as a Login button, not the old Grail
    // Tracker link.
    expect(await screen.findByRole('button', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'EN' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '繁中' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '简中' })).toBeInTheDocument();
  });

  it('shows a collection completion % next to Unique/Set/Runewords when signed in, and none for other game-item links', async () => {
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
    const { default: SiteNavDrawerSignedIn } = await import('./SiteNavDrawer');
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <SiteNavDrawerSignedIn />
      </NextIntlClientProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));

    // Signed in -> "My Chronicle", not "Item Collections".
    expect(screen.getByRole('heading', { name: 'My Chronicle' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Unique Items/ })).toHaveTextContent('100%');
    expect(screen.getByRole('link', { name: /Set Items/ })).toHaveTextContent('0%');
    expect(screen.getByRole('link', { name: /Runewords/ })).toHaveTextContent(`${expectedRunewordPercent}%`);
    // Links with no percentage tracking (e.g. Base Items) show no "%" text.
    expect(screen.getByRole('link', { name: 'Base Items' })).not.toHaveTextContent('%');
  });
});
