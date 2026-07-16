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
      id: 'base-hax', slotCategory: 'axes', subCategory: null,
      grades: {
        normal: { name: 'Hand Axe', oneHandDamage: { min: 3, max: 6 }, twoHandDamage: null, levelReq: 0, requiredStrength: null, requiredDexterity: null, durability: 28, sockets: 2, qlvl: 3 },
        exceptional: { name: 'Hatchet', oneHandDamage: { min: 10, max: 21 }, twoHandDamage: null, levelReq: 19, requiredStrength: 25, requiredDexterity: null, durability: 28, sockets: 2, qlvl: 31 },
        elite: { name: 'Tomahawk', oneHandDamage: { min: 33, max: 58 }, twoHandDamage: null, levelReq: 40, requiredStrength: 125, requiredDexterity: null, durability: 28, sockets: 2, qlvl: 54 },
      },
    };
    renderTable(line);
    expect(screen.getByText('Hand Axe')).toBeInTheDocument();
    expect(screen.getByText('Hatchet')).toBeInTheDocument();
    expect(screen.getByText('Tomahawk')).toBeInTheDocument();
    expect(screen.getByText('3 - 6')).toBeInTheDocument();
    expect(screen.getByText('33 - 58')).toBeInTheDocument();
  });

  it('renders a dash for a missing grade tier', () => {
    const line: BaseLine = {
      id: 'base-x', slotCategory: 'wands', subCategory: null,
      grades: {
        normal: { name: 'Yew Wand', oneHandDamage: null, twoHandDamage: null, levelReq: 0, requiredStrength: null, requiredDexterity: null, durability: 30, sockets: 1, qlvl: 1 },
        exceptional: null,
        elite: null,
      },
    };
    renderTable(line);
    expect(screen.getByText('Yew Wand')).toBeInTheDocument();
    expect(screen.getAllByText('-').length).toBeGreaterThan(0);
  });
});
