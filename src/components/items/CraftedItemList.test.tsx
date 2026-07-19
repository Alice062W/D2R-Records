import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import CraftedItemList from './CraftedItemList';
import messages from '../../../messages/en.json';
import craftedItems from '../../../data/crafted-items.json';

describe('CraftedItemList', () => {
  it('shows all 4 family tabs, defaulting to Hit Power', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CraftedItemList items={craftedItems} locale="en" />
      </NextIntlClientProvider>
    );
    expect(screen.getByRole('button', { name: 'Hit Power' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Blood' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Caster' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Safety' })).toBeInTheDocument();
    expect(screen.getByText('Hit Power Helm')).toBeInTheDocument();
    expect(screen.queryByText('Blood Helm')).not.toBeInTheDocument();
  });

  it('switches the visible family when a different tab is clicked, showing only that family', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CraftedItemList items={craftedItems} locale="en" />
      </NextIntlClientProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Blood' }));
    expect(screen.getByText('Blood Helm')).toBeInTheDocument();
    expect(screen.queryByText('Hit Power Helm')).not.toBeInTheDocument();
    expect(screen.queryByText('Caster Helm')).not.toBeInTheDocument();
    expect(screen.queryByText('Safety Helm')).not.toBeInTheDocument();
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

  it('renders the magic-item-input icon next to the name, and one icon per additional input', () => {
    const item = {
      id: 'craft-64',
      name: { en: 'Hit Power Helm', 'zh-TW': 'x', 'zh-CN': 'x' },
      family: 'hitPower' as const,
      magicItemInput: { en: 'Magic Full Helm', 'zh-TW': 'x', 'zh-CN': 'x' },
      magicItemInputIcon: 'invfhl',
      additionalInputs: [
        { en: 'Jewel', 'zh-TW': 'x', 'zh-CN': 'x' },
        { en: 'Ith Rune', 'zh-TW': 'x', 'zh-CN': 'x' },
        { en: 'Perfect Sapphire', 'zh-TW': 'x', 'zh-CN': 'x' },
      ],
      additionalInputIcons: ['invgswe', 'invrIth', 'invgsbe'],
      fixedProperties: [],
      variableProperties: [],
    };
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CraftedItemList items={[item]} locale="en" />
      </NextIntlClientProvider>
    );
    const srcs = Array.from(container.querySelectorAll('img')).map(i => (i as HTMLImageElement).src);
    expect(srcs.some(s => s.includes('invfhl'))).toBe(true);
    expect(srcs.some(s => s.includes('invgswe'))).toBe(true);
    expect(srcs.some(s => s.includes('invrIth'))).toBe(true);
    expect(srcs.some(s => s.includes('invgsbe'))).toBe(true);
  });
});
