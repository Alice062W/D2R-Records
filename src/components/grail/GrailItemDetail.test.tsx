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

  it('colors stats by variable/fixed status and isSkillRef', () => {
    const item: GrailItem = {
      ...baseItem,
      stats: [
        { key: 'dmg%', label: 'Enhanced Damage %', min: 60, max: 70, isSkillRef: false },
        { key: 'skill:1', label: 'Level 1-20 Fireball', min: 1, max: 20, isSkillRef: true },
      ],
      fixedStats: [
        { key: 'str', label: 'Strength', value: 8, isSkillRef: false },
        { key: 'oskill:2', label: 'Combat Skills', value: 2, isSkillRef: true },
      ],
      setBonuses: [
        { key: 'res-all', label: 'All Resistances', min: 50, max: 50, isSkillRef: false },
        { key: 'sor', label: 'Sorceress Skill Levels', min: 3, max: 3, isSkillRef: true },
      ],
    };
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <GrailItemDetail item={item} finds={[]} />
      </NextIntlClientProvider>
    );
    expect(screen.getByText(/Enhanced Damage %/).closest('div')).toHaveClass('text-[#fff818]');
    expect(screen.getByText(/Level 1-20 Fireball/).closest('div')).toHaveClass('text-[#ff4a69]');
    expect(screen.getByText(/Strength/).closest('div')).toHaveClass('text-[#8080f3]');
    expect(screen.getByText(/Combat Skills/).closest('div')).toHaveClass('text-[#ff4a69]');
    expect(screen.getByText(/All Resistances/).closest('div')).toHaveClass('text-[#22ff55]');
    expect(screen.getByText(/Sorceress Skill Levels/).closest('div')).toHaveClass('text-[#ff4a69]');
  });
});
