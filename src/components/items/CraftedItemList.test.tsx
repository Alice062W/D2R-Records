import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import CraftedItemList from './CraftedItemList';
import messages from '../../../messages/en.json';
import craftedItems from '../../../data/crafted-items.json';

describe('CraftedItemList', () => {
  it('renders all 4 families with their recipes', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CraftedItemList items={craftedItems} locale="en" />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('Hit Power')).toBeInTheDocument();
    expect(screen.getByText('Hit Power Helm')).toBeInTheDocument();
    expect(screen.getByText('Safety')).toBeInTheDocument();
  });

  it('renders both fixed and variable properties for an item, not just fixed', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CraftedItemList items={craftedItems} locale="en" />
      </NextIntlClientProvider>
    );
    // "Hit Power Helm" has fixedProperties: [] and variableProperties including
    // "Attacker Takes Damage" (min 3, max 7). It must be visible even though
    // fixedProperties is empty.
    expect(screen.getAllByText(/Attacker Takes Damage/).length).toBeGreaterThan(0);
  });
});
