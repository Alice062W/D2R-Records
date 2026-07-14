import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import SiteNavDrawer from './SiteNavDrawer';
import messages from '../../../messages/en.json';

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
    expect(screen.getByText('D2R Institute')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Unique Items' })).not.toBeInTheDocument();
  });

  it('opens on hamburger click and shows all groups and links', () => {
    renderDrawer();
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));

    expect(screen.getByText('Game Items')).toBeInTheDocument();
    expect(screen.getByText('Misc')).toBeInTheDocument();
    expect(screen.getByText('Our Tools')).toBeInTheDocument();

    const expectedLinks: [string, string][] = [
      ['Base Items', '/en/items/base'],
      ['Magic Items', '/en/items/magic'],
      ['Rare Items', '/en/items/rare'],
      ['Set Items', '/en/items/set'],
      ['Unique Items', '/en/items/unique'],
      ['Runes', '/en/items/runes'],
      ['Runewords', '/en/items/runewords'],
      ['Cube Recipes', '/en/items/cube-recipes'],
      ['Crafted Items', '/en/items/crafted'],
      ['FCR/FHR/FBR', '/en/character/fcr-fhr-fbr'],
      ['Alvl85 Areas', '/en/monster/alvl85'],
      ['Area Level', '/en/monster/area-level'],
      ['Level Up', '/en/character/level-up'],
      ['Max Sockets', '/en/misc/max-sockets'],
      ['Appraiser', '/en'],
      ['Grail Tracker', '/en/grail'],
      ['About Us', '/en/about'],
    ];
    for (const [label, href] of expectedLinks) {
      expect(screen.getByRole('link', { name: label })).toHaveAttribute('href', href);
    }
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
});
