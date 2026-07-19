import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '../../../../../messages/en.json';

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
