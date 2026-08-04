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
      id: 'base-hax', slotCategory: 'axes', subCategory: null, invFile: 'invhax', hdIcon: null,
      grades: {
        normal: { name: 'Hand Axe', invFile: 'invhax', hdIcon: null, levelReq: 0, qlvl: 3, statRows: [{ code: 'oneHandDamage', min: 3, max: 6 }, { code: 'durability', value: 28 }, { code: 'maxSockets', value: 2 }] },
        exceptional: { name: 'Hatchet', invFile: 'invhax', hdIcon: null, levelReq: 19, qlvl: 31, statRows: [{ code: 'oneHandDamage', min: 10, max: 21 }, { code: 'requiredStrength', value: 25 }, { code: 'durability', value: 28 }, { code: 'maxSockets', value: 2 }] },
        elite: { name: 'Tomahawk', invFile: 'invhax', hdIcon: null, levelReq: 40, qlvl: 54, statRows: [{ code: 'oneHandDamage', min: 33, max: 58 }, { code: 'requiredStrength', value: 125 }, { code: 'durability', value: 28 }, { code: 'maxSockets', value: 2 }] },
      },
    };
    renderTable(line);
    expect(screen.getAllByText('Hand Axe').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Hatchet')).toBeInTheDocument();
    expect(screen.getByText('Tomahawk')).toBeInTheDocument();
    expect(screen.getByText('3 - 6')).toBeInTheDocument();
    expect(screen.getByText('33 - 58')).toBeInTheDocument();
  });

  it('renders a dash when a stat row is present on one grade tier but not another', () => {
    const line: BaseLine = {
      id: 'base-x', slotCategory: 'wands', subCategory: null, invFile: '', hdIcon: null,
      grades: {
        normal: { name: 'Yew Wand', invFile: '', hdIcon: null, levelReq: 0, qlvl: 1, statRows: [{ code: 'durability', value: 30 }, { code: 'maxSockets', value: 1 }] },
        exceptional: { name: 'Petrified Wand', invFile: '', hdIcon: null, levelReq: 13, qlvl: 25, statRows: [{ code: 'requiredLevel', value: 13 }, { code: 'durability', value: 30 }] },
        elite: null,
      },
    };
    renderTable(line);
    expect(screen.getAllByText('Yew Wand').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('-').length).toBeGreaterThan(0);
  });

  it('renders the icon when invFile is present', () => {
    const line: BaseLine = {
      id: 'base-hax', slotCategory: 'axes', subCategory: null, invFile: 'invhax', hdIcon: null,
      grades: { normal: { name: 'Hand Axe', invFile: 'invhax', hdIcon: null, levelReq: 0, qlvl: 3, statRows: [{ code: 'oneHandDamage', min: 3, max: 6 }] }, exceptional: null, elite: null },
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
      id: 'base-x', slotCategory: 'axes', subCategory: null, invFile: '', hdIcon: null,
      grades: { normal: { name: 'X', invFile: '', hdIcon: null, levelReq: 0, qlvl: null, statRows: [] }, exceptional: null, elite: null },
    };
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <BaseItemTable line={line} />
      </NextIntlClientProvider>
    );
    expect(document.querySelector('img')).toBeNull();
  });
});
