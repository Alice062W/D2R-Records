import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import GrailItemDetail from './GrailItemDetail';
import type { GrailItem } from '@/lib/grail/catalog';
import messages from '../../../messages/en.json';

const baseItem: GrailItem = {
  id: 'unique-0', code: 'hax', name: 'The Gnasher', kind: 'unique', setName: null,
  levelReq: 5, baseName: 'Hand Axe', grade: 'normal', slotCategory: 'axes',
  defense: null, oneHandDamage: null, twoHandDamage: null, requiredStrength: null,
  requiredDexterity: null, weaponSpeed: null, durability: 28, classRestriction: null,
  invFile: 'invhaxu', hdIcon: null,
  properties: [], setPiecesBonuses: [], setFullBonus: [], setBonuses: [],
  statPriority: [], ladderRestricted: false, firstLadderSeason: null, lastLadderSeason: null,
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

  it('renders properties and set full bonus under their own headings', () => {
    const item: GrailItem = {
      ...baseItem,
      properties: [
        { code: 'dmg%', label: 'Enhanced Damage +65%', min: 60, max: 70, variable: true },
      ],
      setFullBonus: [
        { code: 'res-all', label: 'All Resistances +50', min: 50, max: 50, variable: false },
      ],
    };
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <GrailItemDetail item={item} finds={[]} />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('Enhanced Damage +65%').closest('div')).toHaveClass('text-[#fff818]');
    expect(screen.getByText('All Resistances +50').closest('div')).toHaveClass('text-[#22ff55]');
  });

  it('marks a variable property with a dice icon, but not a fixed one', () => {
    const item: GrailItem = {
      ...baseItem,
      properties: [
        { code: 'dmg%', label: 'Enhanced Damage +65%', min: 60, max: 70, variable: true },
        { code: 'str', label: '+10 to Strength', min: 10, max: 10, variable: false },
      ],
    };
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <GrailItemDetail item={item} finds={[]} />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('Enhanced Damage +65%').closest('div')).toHaveTextContent('🎲');
    expect(screen.getByText('+10 to Strength').closest('div')).not.toHaveTextContent('🎲');
  });
});
