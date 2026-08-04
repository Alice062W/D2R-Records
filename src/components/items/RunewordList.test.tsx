import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import RunewordFilters from './RunewordFilters';
import RunewordList from './RunewordList';
import { useState } from 'react';
import messages from '../../../messages/en.json';
import runewordsFull from '../../../data/runewords.json';

function TestPage() {
  const [itemType, setItemType] = useState<string | null>(null);
  const [sockets, setSockets] = useState<number | null>(null);
  const filtered = runewordsFull.filter(rw =>
    (!itemType || rw.itemTypes.includes(itemType)) &&
    (!sockets || rw.sockets === sockets)
  );
  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      <RunewordFilters
        itemTypes={['armors', 'shld']}
        activeType={itemType}
        onTypeChange={setItemType}
        activeSockets={sockets}
        onSocketsChange={setSockets}
      />
      <RunewordList runewords={filtered} locale="en" />
    </NextIntlClientProvider>
  );
}

const baseRunewordFixture = runewordsFull.find(r => r.name.en === 'Enigma')!;

describe('RunewordFilters + RunewordList', () => {
  it('shows all runewords with no filter active', () => {
    render(<TestPage />);
    expect(screen.getByText('Enigma')).toBeInTheDocument();
    expect(screen.getAllByText(/Jah|Ith|Ber/).length).toBeGreaterThan(0);
  });

  it('filters by item type', () => {
    render(<TestPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Shields' }));
    expect(screen.queryByText('Enigma')).not.toBeInTheDocument(); // Enigma requires armors, not shld
  });

  it('filters by socket count', () => {
    render(<TestPage />);
    fireEvent.click(screen.getByRole('button', { name: '3' }));
    expect(screen.getByText('Enigma')).toBeInTheDocument(); // Enigma is 3 sockets
    const fourSocketRuneword = runewordsFull.find(r => r.sockets === 4);
    if (fourSocketRuneword) {
      expect(screen.queryByText(fourSocketRuneword.name.en)).not.toBeInTheDocument();
    }
  });

  it('renders one icon per rune in rune order', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <RunewordList runewords={[baseRunewordFixture]} locale="en" />
      </NextIntlClientProvider>
    );
    const imgs = Array.from(document.querySelectorAll('img')) as HTMLImageElement[];
    expect(imgs.length).toBe(baseRunewordFixture.runes.length);
  });

  it('marks a variable stat with a dice icon', () => {
    const rw = {
      ...baseRunewordFixture,
      stats: [{ code: 'ac', label: { en: 'Enhanced Defense %', 'zh-TW': 'x', 'zh-CN': 'x' }, min: 100, max: 150, variable: true }],
    };
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <RunewordList runewords={[rw]} locale="en" />
      </NextIntlClientProvider>
    );
    expect(screen.getByText(/Enhanced Defense %/).closest('div')).toHaveClass('text-[#fff818]');
    expect(screen.getByText(/Enhanced Defense %/).closest('div')).toHaveTextContent('🎲');
  });

  it('shows a "Ladder Only" badge for a ladder-restricted runeword, and "Non-Ladder Only" for one disallowed on ladder', () => {
    const ladderOnly = { ...baseRunewordFixture, ladderRestricted: true, disallowedInLadder: false };
    const nonLadderOnly = { ...baseRunewordFixture, id: 'x', ladderRestricted: true, disallowedInLadder: true };
    const { rerender } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <RunewordList runewords={[ladderOnly]} locale="en" />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('Ladder Only')).toBeInTheDocument();
    rerender(
      <NextIntlClientProvider locale="en" messages={messages}>
        <RunewordList runewords={[nonLadderOnly]} locale="en" />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('Non-Ladder Only')).toBeInTheDocument();
  });

  describe('owned checkbox', () => {
    it('renders no checkbox when signed out', async () => {
      vi.resetModules();
      vi.doMock('@/lib/grail/useOwnedItems', () => ({
        useOwnedItems: () => ({ userId: null, loading: false, ownedIds: new Set(), toggle: vi.fn(), error: null }),
      }));
      const { default: RunewordList } = await import('./RunewordList');
      render(
        <NextIntlClientProvider locale="en" messages={messages}>
          <RunewordList runewords={[baseRunewordFixture]} locale="en" />
        </NextIntlClientProvider>
      );
      expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    });

    it('renders an owned toggle ("Collected") for an owned runeword and calls toggle with its id and kind "runeword"', async () => {
      const toggle = vi.fn();
      vi.resetModules();
      vi.doMock('@/lib/grail/useOwnedItems', () => ({
        useOwnedItems: () => ({
          userId: 'user-1', loading: false, ownedIds: new Set([baseRunewordFixture.id]), toggle, error: null,
        }),
      }));
      const { default: RunewordList } = await import('./RunewordList');
      render(
        <NextIntlClientProvider locale="en" messages={messages}>
          <RunewordList runewords={[baseRunewordFixture]} locale="en" />
        </NextIntlClientProvider>
      );
      const toggleButton = screen.getByRole('switch');
      expect(toggleButton).toHaveAttribute('aria-checked', 'true');
      expect(toggleButton).toHaveTextContent('Collected');
      fireEvent.click(toggleButton);
      expect(toggle).toHaveBeenCalledWith(baseRunewordFixture.id, 'runeword');
    });

    it('highlights the card background when the runeword is owned', async () => {
      vi.resetModules();
      vi.doMock('@/lib/grail/useOwnedItems', () => ({
        useOwnedItems: () => ({
          userId: 'user-1', loading: false, ownedIds: new Set([baseRunewordFixture.id]), toggle: vi.fn(), error: null,
        }),
      }));
      const { default: RunewordList } = await import('./RunewordList');
      render(
        <NextIntlClientProvider locale="en" messages={messages}>
          <RunewordList runewords={[baseRunewordFixture]} locale="en" />
        </NextIntlClientProvider>
      );
      expect(screen.getByText(baseRunewordFixture.name.en).closest('div.rounded-xl')).toHaveClass('bg-green-950/30');
    });

    it('does not highlight the card background when the runeword is not owned', async () => {
      vi.resetModules();
      vi.doMock('@/lib/grail/useOwnedItems', () => ({
        useOwnedItems: () => ({ userId: 'user-1', loading: false, ownedIds: new Set(), toggle: vi.fn(), error: null }),
      }));
      const { default: RunewordList } = await import('./RunewordList');
      render(
        <NextIntlClientProvider locale="en" messages={messages}>
          <RunewordList runewords={[baseRunewordFixture]} locale="en" />
        </NextIntlClientProvider>
      );
      expect(screen.getByText(baseRunewordFixture.name.en).closest('div.rounded-xl')).toHaveClass('bg-panel');
    });
  });
});
