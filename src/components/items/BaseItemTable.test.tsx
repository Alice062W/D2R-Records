import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import BaseItemTable from './BaseItemTable';
import type { BaseLine } from '@/lib/grail/basesCatalog';
import messages from '../../../messages/en.json';

function renderTable(line: BaseLine) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <BaseItemTable line={line} />
    </NextIntlClientProvider>
  );
}

describe('BaseItemTable', () => {
  it('renders all three grade names and their 1h damage when present', () => {
    const line: BaseLine = {
      id: 'base-hax', slotCategory: 'axes', subCategory: null, invFile: 'invhax',
      grades: {
        normal: { name: 'Hand Axe', defense: null, oneHandDamage: { min: 3, max: 6 }, twoHandDamage: null, levelReq: 0, requiredStrength: null, requiredDexterity: null, durability: 28, sockets: 2, qlvl: 3 },
        exceptional: { name: 'Hatchet', defense: null, oneHandDamage: { min: 10, max: 21 }, twoHandDamage: null, levelReq: 19, requiredStrength: 25, requiredDexterity: null, durability: 28, sockets: 2, qlvl: 31 },
        elite: { name: 'Tomahawk', defense: null, oneHandDamage: { min: 33, max: 58 }, twoHandDamage: null, levelReq: 40, requiredStrength: 125, requiredDexterity: null, durability: 28, sockets: 2, qlvl: 54 },
      },
    };
    renderTable(line);
    expect(screen.getAllByText('Hand Axe').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Hatchet')).toBeInTheDocument();
    expect(screen.getByText('Tomahawk')).toBeInTheDocument();
    expect(screen.getByText('3 - 6')).toBeInTheDocument();
    expect(screen.getByText('33 - 58')).toBeInTheDocument();
  });

  it('renders a dash for a missing grade tier', () => {
    const line: BaseLine = {
      id: 'base-x', slotCategory: 'wands', subCategory: null, invFile: '',
      grades: {
        normal: { name: 'Yew Wand', defense: null, oneHandDamage: null, twoHandDamage: null, levelReq: 0, requiredStrength: null, requiredDexterity: null, durability: 30, sockets: 1, qlvl: 1 },
        exceptional: null,
        elite: null,
      },
    };
    renderTable(line);
    expect(screen.getAllByText('Yew Wand').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('-').length).toBeGreaterThan(0);
  });

  it('renders the icon when invFile is present', () => {
    const line: BaseLine = {
      id: 'base-hax', slotCategory: 'axes', subCategory: null, invFile: 'invhax',
      grades: { normal: { name: 'Hand Axe', defense: null, oneHandDamage: { min: 3, max: 6 }, twoHandDamage: null, levelReq: 0, requiredStrength: null, requiredDexterity: null, durability: 28, sockets: 2, qlvl: 3 }, exceptional: null, elite: null },
    };
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <BaseItemTable line={line} />
      </NextIntlClientProvider>
    );
    const img = document.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('src')).toBe('/items/inv/invhax.png');
  });

  it('renders no icon when invFile is empty', () => {
    const line: BaseLine = {
      id: 'base-x', slotCategory: 'axes', subCategory: null, invFile: '',
      grades: { normal: { name: 'X', defense: null, oneHandDamage: null, twoHandDamage: null, levelReq: 0, requiredStrength: null, requiredDexterity: null, durability: null, sockets: null, qlvl: null }, exceptional: null, elite: null },
    };
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <BaseItemTable line={line} />
      </NextIntlClientProvider>
    );
    expect(document.querySelector('img')).toBeNull();
  });
});
