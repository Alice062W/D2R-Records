import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import CategoryItemList from './CategoryItemList';
import { getAllGrailItems, localizeGrailItem, sortItemsForDisplay } from '@/lib/grail/catalog';
import messages from '../../../messages/en.json';

function itemsFor(kind: 'unique' | 'set', category: string) {
  return sortItemsForDisplay(
    getAllGrailItems()
      .filter(i => i.kind === kind && i.slotCategory === category)
      .map(i => localizeGrailItem(i, 'en'))
  );
}

function renderList(items: ReturnType<typeof itemsFor>) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <CategoryItemList items={items} />
    </NextIntlClientProvider>
  );
}

describe('CategoryItemList', () => {
  it('shows grade tabs and filters when a category spans multiple grades', () => {
    renderList(itemsFor('unique', 'axes'));
    expect(screen.getByRole('button', { name: 'Normal' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Exceptional' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Elite' })).toBeInTheDocument();

    expect(screen.getByText('The Gnasher')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Elite' }));
    expect(screen.queryByText('The Gnasher')).not.toBeInTheDocument();
  });

  it('hides grade tabs for a single-grade category', () => {
    renderList(itemsFor('unique', 'jewels'));
    expect(screen.queryByRole('button', { name: 'Normal' })).not.toBeInTheDocument();
  });

  it('renders all items for the category with no filtering by default', () => {
    const items = itemsFor('unique', 'rings');
    renderList(items);
    expect(screen.getByText('Nagelring')).toBeInTheDocument();
    expect(screen.getByText('Manald Heal')).toBeInTheDocument();
  });
});
