import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import ItemCategoryGrid from './ItemCategoryGrid';
import type { GrailItem } from '@/lib/grail/catalog';
import messages from '../../../messages/en.json';

function makeItem(overrides: Partial<GrailItem>): GrailItem {
  return {
    id: 'x', code: 'x', name: 'X', kind: 'unique', setName: null, levelReq: 1,
    baseName: 'Base', grade: 'normal', slotCategory: 'helms', defense: null,
    requiredStrength: null, durability: null, invFile: '', stats: [], fixedStats: [],
    setBonuses: [], statPriority: [], ...overrides,
  };
}

describe('ItemCategoryGrid', () => {
  it('renders only the categories present in the given items, in SLOT_ORDER', () => {
    const items = [
      makeItem({ id: '1', slotCategory: 'swords' }),
      makeItem({ id: '2', slotCategory: 'helms' }),
    ];
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ItemCategoryGrid items={items} activeSlot={null} onSelect={() => {}} />
      </NextIntlClientProvider>
    );
    const desktopList = screen.getByTestId('item-category-desktop-list');
    const buttons = within(desktopList).getAllByRole('button').map(b => b.textContent);
    expect(buttons).toEqual(['Helms', 'Swords']); // helms precedes swords in SLOT_ORDER
  });

  it('calls onSelect with the clicked category', () => {
    const items = [makeItem({ id: '1', slotCategory: 'rings' })];
    const onSelect = vi.fn();
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ItemCategoryGrid items={items} activeSlot={null} onSelect={onSelect} />
      </NextIntlClientProvider>
    );
    const desktopList = screen.getByTestId('item-category-desktop-list');
    fireEvent.click(within(desktopList).getByRole('button', { name: 'Rings' }));
    expect(onSelect).toHaveBeenCalledWith('rings');
  });
});
