import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '../../../../../messages/en.json';
import runewordsFull from '../../../../../data/runewords-full.json';

vi.mock('next-intl', async () => {
  const actual = await vi.importActual('next-intl');
  return { ...actual, useLocale: () => 'en' };
});

describe('RunewordsPage — collected/missing filter', () => {
  it('filters the list to only owned runewords when "Collected" is clicked', async () => {
    vi.resetModules();
    vi.doMock('@/lib/grail/useOwnedItems', () => ({
      useOwnedItems: () => ({
        userId: 'user-1',
        loading: false,
        ownedIds: new Set(['runeword-Runeword1']), // "Ancients' Pledge" per data/runewords-full.json
        toggle: vi.fn(),
        error: null,
      }),
    }));
    const { default: RunewordsPage } = await import('./page');
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <RunewordsPage />
      </NextIntlClientProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Collected' }));
    expect(screen.getByText("Ancients' Pledge")).toBeInTheDocument();
    expect(screen.queryByText('Enigma')).not.toBeInTheDocument();
  });
});

describe('RunewordsPage — combination status box', () => {
  it('shows no status box when signed out', async () => {
    vi.resetModules();
    vi.doMock('@/lib/grail/useOwnedItems', () => ({
      useOwnedItems: () => ({ userId: null, loading: false, ownedIds: new Set(), toggle: vi.fn(), error: null }),
    }));
    const { default: RunewordsPage } = await import('./page');
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <RunewordsPage />
      </NextIntlClientProvider>
    );
    expect(screen.queryByText('All Runewords')).not.toBeInTheDocument();
  });

  it('shows "All Runewords" with the full total and current owned count when no type/socket filter is active', async () => {
    vi.resetModules();
    vi.doMock('@/lib/grail/useOwnedItems', () => ({
      useOwnedItems: () => ({
        userId: 'user-1', loading: false, ownedIds: new Set(['runeword-Runeword1']), toggle: vi.fn(), error: null,
      }),
    }));
    const { default: RunewordsPage } = await import('./page');
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <RunewordsPage />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('All Runewords')).toBeInTheDocument();
    expect(screen.getByText(`1/${runewordsFull.length} (${Math.round((1 / runewordsFull.length) * 100)}%)`)).toBeInTheDocument();
  });

  it('updates the combination label and counts when a socket-count filter is selected', async () => {
    vi.resetModules();
    vi.doMock('@/lib/grail/useOwnedItems', () => ({
      useOwnedItems: () => ({ userId: 'user-1', loading: false, ownedIds: new Set(), toggle: vi.fn(), error: null }),
    }));
    const { default: RunewordsPage } = await import('./page');
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <RunewordsPage />
      </NextIntlClientProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: '3' }));
    const threeSocketCount = runewordsFull.filter(rw => rw.sockets === 3).length;
    expect(screen.getByText(`3 ${'Sockets'}`)).toBeInTheDocument();
    expect(screen.getByText(`0/${threeSocketCount} (0%)`)).toBeInTheDocument();
  });

  it('shows the fancy complete badge when every runeword in the current combination is owned', async () => {
    vi.resetModules();
    const allIds = new Set(runewordsFull.map(rw => rw.id));
    vi.doMock('@/lib/grail/useOwnedItems', () => ({
      useOwnedItems: () => ({ userId: 'user-1', loading: false, ownedIds: allIds, toggle: vi.fn(), error: null }),
    }));
    const { default: RunewordsPage } = await import('./page');
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <RunewordsPage />
      </NextIntlClientProvider>
    );
    expect(screen.getByText(/Complete!/)).toBeInTheDocument();
  });
});
