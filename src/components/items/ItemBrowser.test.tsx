import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import ItemBrowser from './ItemBrowser';
import { getAllGrailItems } from '@/lib/grail/catalog';
import messages from '../../../messages/en.json';

function renderBrowser(kind: 'unique' | 'set') {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ItemBrowser kind={kind} />
    </NextIntlClientProvider>
  );
}

describe('ItemBrowser', () => {
  it('filters the full catalog to the expected known totals per kind', () => {
    // Matches the project's known totals (see plans/todo.md): 403 uniques, 135 sets.
    const uniqueCount = getAllGrailItems().filter(i => i.kind === 'unique').length;
    const setCount = getAllGrailItems().filter(i => i.kind === 'set').length;
    expect(uniqueCount).toBe(403);
    expect(setCount).toBe(135);
  });

  it('shows a prompt before any category is selected', () => {
    renderBrowser('unique');
    expect(screen.getByText('Select a category from the menu to view its items.')).toBeInTheDocument();
  });

  it('shows only unique items (never set items) when kind="unique"', () => {
    renderBrowser('unique');
    fireEvent.click(screen.getByRole('button', { name: 'Rings' }));
    // The Stone of Jordan is a well-known unique ring.
    expect(screen.getByText('The Stone of Jordan')).toBeInTheDocument();
  });

  it('shows only set items (never unique items) when kind="set"', () => {
    renderBrowser('set');
    fireEvent.click(screen.getByRole('button', { name: 'Boots' }));
    // Aldur's Advance is a well-known set boots item; The Gnasher (unique) must not appear anywhere.
    expect(screen.queryByText('The Gnasher')).not.toBeInTheDocument();
  });

  it('shows grade tabs when a category spans multiple grades, and filters by the selected tab', () => {
    renderBrowser('unique');
    // Axes has items across all three grades (e.g. The Gnasher = normal, Runemaster = elite).
    fireEvent.click(screen.getByRole('button', { name: 'Axes' }));
    expect(screen.getByRole('button', { name: 'Normal' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Exceptional' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Elite' })).toBeInTheDocument();

    expect(screen.getByText('The Gnasher')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Elite' }));
    expect(screen.queryByText('The Gnasher')).not.toBeInTheDocument();
  });

  it('hides grade tabs when the category has items in only one grade', () => {
    renderBrowser('unique');
    // Jewels only exist in a single grade in this catalog (no base-item grade tiers).
    fireEvent.click(screen.getByRole('button', { name: 'Jewels' }));
    expect(screen.queryByRole('button', { name: 'Normal' })).not.toBeInTheDocument();
  });
});
