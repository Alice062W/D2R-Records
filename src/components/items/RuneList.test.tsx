import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import RuneList from './RuneList';
import messages from '../../../messages/en.json';
import runes from '../../../data/runes.json';

describe('RuneList', () => {
  it('renders all 33 runes', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <RuneList runes={runes} locale="en" />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('El')).toBeInTheDocument();
    expect(screen.getByText('Zod')).toBeInTheDocument();
    expect(screen.getAllByText(/^#\d+$/).length).toBe(33);
  });

  it('gives each rune card an id matching its rune id, for RuneMap to scroll to', () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <RuneList runes={runes} locale="en" />
      </NextIntlClientProvider>
    );
    expect(container.querySelector('#rune-r01')).not.toBeNull(); // El
    expect(container.querySelector('#rune-r33')).not.toBeNull(); // Zod
  });

  it('shows the recipe for a rune that has one, and none for El', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <RuneList runes={runes} locale="en" />
      </NextIntlClientProvider>
    );
    expect(screen.getByText(/Eld x3/)).toBeInTheDocument();
  });

  it('renders the icon when the rune has an invFile', () => {
    const rune = runes[0]; // El rune
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <RuneList runes={[rune]} locale="en" />
      </NextIntlClientProvider>
    );
    const img = container.querySelector('img') as HTMLImageElement;
    expect(img).not.toBeNull();
    expect(img.src).toContain('/items/inv/invrEl.png');
  });

  it('renders no icon when invFile is empty', () => {
    const rune = { ...runes[0], invFile: '' };
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <RuneList runes={[rune]} locale="en" />
      </NextIntlClientProvider>
    );
    expect(container.querySelector('img')).toBeNull();
  });

  describe('owned checkbox', () => {
    it('renders no checkbox when signed out', async () => {
      vi.resetModules();
      vi.doMock('@/lib/grail/useOwnedItems', () => ({
        useOwnedItems: () => ({ userId: null, loading: false, ownedIds: new Set(), toggle: vi.fn(), error: null }),
      }));
      const { default: RuneList } = await import('./RuneList');
      render(
        <NextIntlClientProvider locale="en" messages={messages}>
          <RuneList runes={[runes[0]]} locale="en" />
        </NextIntlClientProvider>
      );
      expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    });

    it('renders an owned toggle ("Collected") for an owned rune and calls toggle with its id and kind "rune"', async () => {
      const toggle = vi.fn();
      vi.resetModules();
      vi.doMock('@/lib/grail/useOwnedItems', () => ({
        useOwnedItems: () => ({
          userId: 'user-1', loading: false, ownedIds: new Set([runes[0].id]), toggle, error: null,
        }),
      }));
      const { default: RuneList } = await import('./RuneList');
      render(
        <NextIntlClientProvider locale="en" messages={messages}>
          <RuneList runes={[runes[0]]} locale="en" />
        </NextIntlClientProvider>
      );
      const toggleButton = screen.getByRole('switch');
      expect(toggleButton).toHaveAttribute('aria-checked', 'true');
      expect(toggleButton).toHaveTextContent('Collected');
      fireEvent.click(toggleButton);
      expect(toggle).toHaveBeenCalledWith(runes[0].id, 'rune');
    });

    it('highlights the card background when the rune is owned', async () => {
      vi.resetModules();
      vi.doMock('@/lib/grail/useOwnedItems', () => ({
        useOwnedItems: () => ({
          userId: 'user-1', loading: false, ownedIds: new Set([runes[0].id]), toggle: vi.fn(), error: null,
        }),
      }));
      const { default: RuneList } = await import('./RuneList');
      const { container } = render(
        <NextIntlClientProvider locale="en" messages={messages}>
          <RuneList runes={[runes[0]]} locale="en" />
        </NextIntlClientProvider>
      );
      expect(container.querySelector(`#${runes[0].id}`)).toHaveClass('bg-green-950/30');
    });

    it('does not highlight the card background when the rune is not owned', async () => {
      vi.resetModules();
      vi.doMock('@/lib/grail/useOwnedItems', () => ({
        useOwnedItems: () => ({ userId: 'user-1', loading: false, ownedIds: new Set(), toggle: vi.fn(), error: null }),
      }));
      const { default: RuneList } = await import('./RuneList');
      const { container } = render(
        <NextIntlClientProvider locale="en" messages={messages}>
          <RuneList runes={[runes[0]]} locale="en" />
        </NextIntlClientProvider>
      );
      expect(container.querySelector(`#${runes[0].id}`)).toHaveClass('bg-panel');
    });
  });
});
