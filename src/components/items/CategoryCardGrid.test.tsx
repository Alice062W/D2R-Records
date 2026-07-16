import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import CategoryCardGrid from './CategoryCardGrid';
import messages from '../../../messages/en.json';

function renderGrid(categories: string[]) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <CategoryCardGrid categories={categories} basePath="/en/items/unique" />
    </NextIntlClientProvider>
  );
}

describe('CategoryCardGrid', () => {
  it('renders one card link per category with the correct href', () => {
    renderGrid(['helms', 'axes']);
    expect(screen.getByRole('link', { name: 'Helms' })).toHaveAttribute(
      'href',
      '/en/items/unique/helms'
    );
    expect(screen.getByRole('link', { name: 'Axes' })).toHaveAttribute(
      'href',
      '/en/items/unique/axes'
    );
  });

  it('renders no cards for an empty category list', () => {
    renderGrid([]);
    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });

  it('falls back to AffixCategories for a category with no matching Grail slot key', () => {
    renderGrid(['circlets']);
    expect(screen.getByRole('link', { name: 'Circlets' })).toHaveAttribute(
      'href',
      '/en/items/unique/circlets'
    );
  });

  it('renders an icon for a category present in the icon map', () => {
    renderGrid(['helms']);
    const img = document.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('alt')).toBe('');
  });

  it('renders no icon for a category absent from the icon map', () => {
    renderGrid(['weapons']);
    expect(document.querySelector('img')).toBeNull();
  });
});
