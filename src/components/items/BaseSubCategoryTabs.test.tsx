import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import BaseSubCategoryTabs from './BaseSubCategoryTabs';
import messages from '../../../messages/en.json';

describe('BaseSubCategoryTabs', () => {
  it('renders All plus one tab per distinct non-null subCategory present', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <BaseSubCategoryTabs subCategories={['circlet', 'barbarian', 'druid']} selected={null} onSelect={() => {}} />
      </NextIntlClientProvider>
    );
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Circlets' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Barbarian Helms' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Druid Helms' })).toBeInTheDocument();
  });

  it('calls onSelect with the clicked subCategory', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <BaseSubCategoryTabs subCategories={['paladin', 'shrunkenHeads']} selected={null} onSelect={onSelect} />
      </NextIntlClientProvider>
    );
    await user.click(screen.getByRole('button', { name: 'Paladin Shields' }));
    expect(onSelect).toHaveBeenCalledWith('paladin');
  });
});
