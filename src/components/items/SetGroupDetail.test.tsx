import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import SetGroupDetail from './SetGroupDetail';
import type { GrailItem } from '@/lib/grail/catalog';
import messages from '../../../messages/en.json';

describe('SetGroupDetail', () => {
  it('renders every piece plus partial and full-set bonuses', () => {
    const piece: GrailItem = {
      id: 'set-1', code: 'xxx', name: "Aldur's Advance", kind: 'set', setName: "Aldur's Watchtower",
      levelReq: 45, baseName: 'Battle Boots', grade: 'exceptional', slotCategory: 'boots',
      defense: null, requiredStrength: 95, durability: 18, invFile: '',
      stats: [], fixedStats: [], setBonuses: [], statPriority: [],
    };
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <SetGroupDetail
          setName="Aldur's Watchtower"
          pieces={[piece]}
          partialBonuses={[{ piecesRequired: 2, stats: [{ key: 'att%', label: 'Attack Rating %', min: 150, max: 150, isSkillRef: false }] }]}
          fullSetBonuses={[{ key: 'res-all', label: 'All Resistances', min: 50, max: 50, isSkillRef: false }]}
        />
      </NextIntlClientProvider>
    );
    expect(screen.getByRole('heading', { name: "Aldur's Advance" })).toBeInTheDocument();
    expect(screen.getByText(/Attack Rating %: 150/)).toBeInTheDocument();
    expect(screen.getByText(/All Resistances: 50/)).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('colors full-set bonuses by isSkillRef and variable/fixed status', () => {
    const piece: GrailItem = {
      id: 'set-2', code: 'yyy', name: 'Tal Rasha Piece', kind: 'set', setName: 'Tal Rasha',
      levelReq: 65, baseName: 'Crystal', grade: 'exceptional', slotCategory: 'orb',
      defense: null, requiredStrength: null, durability: 50, invFile: '',
      stats: [], fixedStats: [], setBonuses: [], statPriority: [],
    };
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <SetGroupDetail
          setName="Tal Rasha"
          pieces={[piece]}
          partialBonuses={[{ piecesRequired: 3, stats: [{ key: 'mag%', label: 'Magic Find %', min: 20, max: 40, isSkillRef: false }] }]}
          fullSetBonuses={[
            { key: 'sor', label: 'Sorceress Skill Levels', min: 3, max: 3, isSkillRef: true },
            { key: 'res-all', label: 'All Resistances', min: 50, max: 50, isSkillRef: false },
          ]}
        />
      </NextIntlClientProvider>
    );
    expect(screen.getByText(/Sorceress Skill Levels: 3/)).toHaveClass('text-[#ff4a69]');
    expect(screen.getByText(/All Resistances: 50/)).toHaveClass('text-[#22ff55]');
    expect(screen.getByText(/Magic Find %: 20–40/)).toHaveClass('text-[#fff818]');
  });
});
