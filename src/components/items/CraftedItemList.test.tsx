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

  it('renders exactly one image per card (the header icon) -- no icons on input/additional-input lines', () => {
    const item = {
      id: 'craft-64',
      name: { en: 'Hit Power Helm', 'zh-TW': 'x', 'zh-CN': 'x' },
      family: 'hitPower' as const,
      magicItemInput: { en: 'Magic Full Helm', 'zh-TW': 'x', 'zh-CN': 'x' },
      magicItemInputIcon: 'invfhl',
      magicItemInputHdIcon: '',
      additionalInputs: [
        { en: 'Jewel', 'zh-TW': 'x', 'zh-CN': 'x' },
        { en: 'Ith Rune', 'zh-TW': 'x', 'zh-CN': 'x' },
        { en: 'Perfect Sapphire', 'zh-TW': 'x', 'zh-CN': 'x' },
      ],
      additionalInputIcons: ['invgswe', 'invrIth', 'invgsbe'],
      additionalInputHdIcons: ['', '', ''],
      fixedProperties: [],
      variableProperties: [],
      magicItemInputVariants: null,
    };
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CraftedItemList items={[item]} locale="en" />
      </NextIntlClientProvider>
    );
    const imgs = container.querySelectorAll('img');
    expect(imgs.length).toBe(1);
    expect((imgs[0] as HTMLImageElement).src).toContain('invfhl');
  });

  it('prefers the HD icon over the classic inv icon when both are present', () => {
    const item = {
      id: 'craft-64',
      name: { en: 'Hit Power Helm', 'zh-TW': 'x', 'zh-CN': 'x' },
      family: 'hitPower' as const,
      magicItemInput: { en: 'Magic Full Helm', 'zh-TW': 'x', 'zh-CN': 'x' },
      magicItemInputIcon: 'invfhl',
      magicItemInputHdIcon: 'full_helm',
      additionalInputs: [],
      additionalInputIcons: [],
      additionalInputHdIcons: [],
      fixedProperties: [],
      variableProperties: [],
      magicItemInputVariants: null,
    };
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CraftedItemList items={[item]} locale="en" />
      </NextIntlClientProvider>
    );
    const srcs = Array.from(container.querySelectorAll('img')).map(i => (i as HTMLImageElement).src);
    expect(srcs.some(s => s.includes('/items/hd/full_helm.png'))).toBe(true);
    expect(srcs.some(s => s.includes('invfhl'))).toBe(false);
  });

  it('lists the magic-item-input variant chain when present (e.g. Full Helm / Basinet / Giant Conch)', () => {
    const item = craftedItems.find(i => i.id === 'craft-64')!;
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CraftedItemList items={[item]} locale="en" />
      </NextIntlClientProvider>
    );
    expect(screen.getAllByText(/Full Helm/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Basinet/)).toBeInTheDocument();
    expect(screen.getByText(/Giant Conch/)).toBeInTheDocument();
  });

  it('renders no variant chain for a single-item input (e.g. Amulet)', () => {
    const item = craftedItems.find(i => i.id === 'craft-70')!; // Hit Power Amulet
    expect(item.magicItemInputVariants).toBeNull();
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CraftedItemList items={[item]} locale="en" />
      </NextIntlClientProvider>
    );
    expect(screen.queryByText(/Basinet/)).not.toBeInTheDocument();
  });
});
