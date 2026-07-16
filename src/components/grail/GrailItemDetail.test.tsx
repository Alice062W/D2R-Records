import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import GrailItemDetail from './GrailItemDetail';
import type { GrailItem } from '@/lib/grail/catalog';
import messages from '../../../messages/en.json';

const baseItem: GrailItem = {
  id: 'unique-0', code: 'hax', name: 'The Gnasher', kind: 'unique', setName: null,
  levelReq: 5, baseName: 'Hand Axe', grade: 'normal', slotCategory: 'axes',
  defense: null, requiredStrength: null, durability: 28, invFile: 'invhaxu',
  stats: [], fixedStats: [], setBonuses: [], statPriority: [],
};

describe('GrailItemDetail', () => {
  it('renders name and stats', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <GrailItemDetail item={baseItem} finds={[]} />
      </NextIntlClientProvider>
    );
    expect(screen.getByRole('heading', { name: 'The Gnasher' })).toBeInTheDocument();
  });

  it('renders an icon when invFile is present', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <GrailItemDetail item={baseItem} finds={[]} />
      </NextIntlClientProvider>
    );
    const img = document.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('src')).toBe('/items/inv/invhaxu.png');
  });

  it('renders no icon when invFile is empty', () => {
    const item: GrailItem = { ...baseItem, invFile: '' };
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <GrailItemDetail item={item} finds={[]} />
      </NextIntlClientProvider>
    );
    expect(document.querySelector('img')).toBeNull();
  });
});
