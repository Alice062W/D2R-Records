import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import ItemStatCard from './ItemStatCard';
import type { GrailItem } from '@/lib/grail/catalog';
import messages from '../../../messages/en.json';

describe('ItemStatCard', () => {
  it('renders name, base stats, and magic properties', () => {
    const item: GrailItem = {
      id: 'unique-0', code: 'hax', name: 'The Gnasher', kind: 'unique', setName: null,
      levelReq: 5, baseName: 'Hand Axe', grade: 'normal', slotCategory: 'axes',
      defense: null, requiredStrength: null, durability: 28, invFile: 'invhaxu',
      stats: [{ key: 'dmg%', label: 'Enhanced Damage %', min: 60, max: 70, isSkillRef: false }],
      fixedStats: [{ key: 'str', label: 'Strength', value: 8, isSkillRef: false }],
      setBonuses: [], statPriority: ['dmg%'],
    };
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ItemStatCard item={item} />
      </NextIntlClientProvider>
    );
    expect(screen.getByRole('heading', { name: 'The Gnasher' })).toBeInTheDocument();
    expect(screen.getByText(/Hand Axe/)).toBeInTheDocument();
    expect(screen.getByText(/Enhanced Damage %/)).toBeInTheDocument();
    expect(screen.getByText(/60–70/)).toBeInTheDocument();
    expect(screen.getByText(/Strength/)).toBeInTheDocument();
  });

  it('does not crash when setName is null and there are no stats or set bonuses', () => {
    const item: GrailItem = {
      id: 'unique-1', code: 'y', name: 'Bare Item', kind: 'unique', setName: null,
      levelReq: 1, baseName: 'Base', grade: 'normal', slotCategory: 'helms',
      defense: { min: 10, max: 12 }, requiredStrength: 20, durability: 40,
      invFile: '', stats: [], fixedStats: [], setBonuses: [], statPriority: [],
    };
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ItemStatCard item={item} />
      </NextIntlClientProvider>
    );
    expect(screen.getByRole('heading', { name: 'Bare Item' })).toBeInTheDocument();
  });

  it('renders an icon when invFile is present', () => {
    const item: GrailItem = {
      id: 'unique-0', code: 'hax', name: 'The Gnasher', kind: 'unique', setName: null,
      levelReq: 5, baseName: 'Hand Axe', grade: 'normal', slotCategory: 'axes',
      defense: null, requiredStrength: null, durability: 28, invFile: 'invhaxu',
      stats: [], fixedStats: [], setBonuses: [], statPriority: [],
    };
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ItemStatCard item={item} />
      </NextIntlClientProvider>
    );
    const img = document.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('src')).toBe('/items/inv/invhaxu.png');
    expect(img?.getAttribute('alt')).toBe('');
  });

  it('renders no icon when invFile is empty', () => {
    const item: GrailItem = {
      id: 'unique-1', code: 'y', name: 'Bare Item', kind: 'unique', setName: null,
      levelReq: 1, baseName: 'Base', grade: 'normal', slotCategory: 'helms',
      defense: { min: 10, max: 12 }, requiredStrength: 20, durability: 40,
      invFile: '', stats: [], fixedStats: [], setBonuses: [], statPriority: [],
    };
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ItemStatCard item={item} />
      </NextIntlClientProvider>
    );
    expect(document.querySelector('img')).toBeNull();
  });

  it('colors variable stats yellow, fixed stats blue, and skill-ref stats pink regardless of which array they are in', () => {
    const item: GrailItem = {
      id: 'unique-2', code: 'x', name: 'Test Item', kind: 'unique', setName: null,
      levelReq: 1, baseName: 'Base', grade: 'normal', slotCategory: 'axes',
      defense: null, requiredStrength: null, durability: null, invFile: '',
      stats: [
        { key: 'dmg%', label: 'Enhanced Damage %', min: 60, max: 70, isSkillRef: false },
        { key: 'skill:1', label: 'Level 1-20 Fireball', min: 1, max: 20, isSkillRef: true },
      ],
      fixedStats: [
        { key: 'str', label: 'Strength', value: 8, isSkillRef: false },
        { key: 'oskill:2', label: 'Combat Skills', value: 2, isSkillRef: true },
      ],
      setBonuses: [], statPriority: [],
    };
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ItemStatCard item={item} />
      </NextIntlClientProvider>
    );
    expect(screen.getByText(/Enhanced Damage %/).closest('div')).toHaveClass('text-[#fff818]');
    expect(screen.getByText(/Level 1-20 Fireball/).closest('div')).toHaveClass('text-[#ff4a69]');
    expect(screen.getByText(/Strength/).closest('div')).toHaveClass('text-[#8080f3]');
    expect(screen.getByText(/Combat Skills/).closest('div')).toHaveClass('text-[#ff4a69]');
  });
});
