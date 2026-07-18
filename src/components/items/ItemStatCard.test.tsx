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
});
