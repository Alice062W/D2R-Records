// src/components/items/AffixTable.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import AffixTable from './AffixTable';
import messages from '../../../messages/en.json';
import type { Affix } from '@/lib/grail/affixCatalog';

function renderTable(props: Partial<React.ComponentProps<typeof AffixTable>> & { prefixes: Affix[]; suffixes: Affix[] }) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <AffixTable kind="magic" {...props} />
    </NextIntlClientProvider>
  );
}

function affix(overrides: Partial<Affix>): Affix {
  return {
    name: 'Rugged',
    alvl: 8,
    group: 1,
    itemTypes: ['boots'],
    stats: [{ key: 'ac', label: 'Defense', template: '%+d Defense', min: 5, max: 10, isSkillRef: false, signed: true }],
    ...overrides,
  };
}

describe('AffixTable', () => {
  it('renders prefix and suffix section headings', () => {
    renderTable({
      prefixes: [affix({ name: 'Rugged' })],
      suffixes: [affix({ name: 'of Protection', group: 2 })],
    });
    expect(screen.getByText('Prefixes')).toBeInTheDocument();
    expect(screen.getByText('Suffixes')).toBeInTheDocument();
  });

  it('shows every tier as its own row, without collapsing same-name tiers', () => {
    renderTable({
      prefixes: [
        affix({ name: 'Rugged', alvl: 1, group: 1, stats: [{ key: 'ac', label: 'Defense', template: '%+d Defense', min: 1, max: 3, isSkillRef: false, signed: true }] }),
        affix({ name: 'Rugged', alvl: 8, group: 1, stats: [{ key: 'ac', label: 'Defense', template: '%+d Defense', min: 5, max: 10, isSkillRef: false, signed: true }] }),
        affix({ name: 'Rugged', alvl: 16, group: 1, stats: [{ key: 'ac', label: 'Defense', template: '%+d Defense', min: 20, max: 20, isSkillRef: false, signed: true }] }),
      ],
      suffixes: [],
    });
    // Every tier's own formatted text is visible at once -- nothing collapsed.
    expect(screen.getByText('+1–3 Defense')).toBeInTheDocument();
    expect(screen.getByText('+5–10 Defense')).toBeInTheDocument();
    expect(screen.getByText('+20 Defense')).toBeInTheDocument();
  });

  it('groups affixes sharing a group id into one box, with the highest-alvl member as the header', () => {
    renderTable({
      prefixes: [],
      suffixes: [
        affix({
          name: 'of Health', alvl: 7, group: 1,
          stats: [{ key: 'red-dmg', label: 'Damage Reduced', template: 'Damage Reduced by %d', min: 3, max: 5, isSkillRef: false }],
        }),
        affix({
          name: 'of Protection', alvl: 18, group: 1,
          stats: [{ key: 'red-dmg', label: 'Damage Reduced', template: 'Damage Reduced by %d', min: 6, max: 10, isSkillRef: false }],
        }),
      ],
    });
    // Header uses the higher-alvl "of Protection" name, with its OWN max value only
    // (not a range) -- the header represents that affix's own best roll.
    expect(screen.getByText(/of Protection.*Damage Reduced by 10/)).toBeInTheDocument();
    // Both rows' own text still visible inside the box.
    expect(screen.getByText('Damage Reduced by 3–5')).toBeInTheDocument();
    expect(screen.getByText('Damage Reduced by 6–10')).toBeInTheDocument();
  });

  it('renders multiple stat lines for a multi-stat affix', () => {
    renderTable({
      prefixes: [
        affix({
          name: 'Composite', alvl: 20, group: 5,
          stats: [
            { key: 'str', label: 'Strength', template: '%+d to Strength', min: 10, max: 10, isSkillRef: false, signed: true },
            { key: 'dex', label: 'Dexterity', template: '%+d to Dexterity', min: 5, max: 5, isSkillRef: false, signed: true },
          ],
        }),
      ],
      suffixes: [],
    });
    expect(screen.getByText('+10 to Strength')).toBeInTheDocument();
    expect(screen.getByText('+5 to Dexterity')).toBeInTheDocument();
  });

  it('falls back to "label: range" when a stat has no template', () => {
    renderTable({
      prefixes: [
        affix({
          name: 'Obscure', alvl: 3, group: 9,
          stats: [{ key: 'weird', label: 'Weird Stat', template: null, min: 1, max: 2, isSkillRef: false }],
        }),
      ],
      suffixes: [],
    });
    expect(screen.getByText('Weird Stat: 1–2')).toBeInTheDocument();
  });

  it('renders magic-item stat values in the magic-item blue', () => {
    renderTable({
      prefixes: [affix({ name: 'Rugged' })],
      suffixes: [],
      kind: 'magic',
    });
    expect(screen.getByText('+5–10 Defense').closest('div')?.className).toContain('text-[#8080f3]');
  });

  it('renders rare-item stat values in the rare-item yellow', () => {
    renderTable({
      prefixes: [affix({ name: 'Rugged' })],
      suffixes: [],
      kind: 'rare',
    });
    expect(screen.getByText('+5–10 Defense').className).not.toContain('text-[#8080f3]');
    // Rare items render in the classic rare-item yellow, distinct from magic's blue.
    expect(screen.getByText('+5–10 Defense').closest('div')?.className).toContain('text-[#fff818]');
  });

  it('shows a dice icon for a stat with a random-rolled range, not for a fixed value', () => {
    renderTable({
      prefixes: [
        affix({
          name: 'Ranged', alvl: 10, group: 20,
          stats: [
            { key: 'ac', label: 'Defense', template: '%+d Defense', min: 5, max: 10, isSkillRef: false, signed: true },
            { key: 'str', label: 'Strength', template: '%+d to Strength', min: 3, max: 3, isSkillRef: false, signed: true },
          ],
        }),
      ],
      suffixes: [],
    });
    const rangeRow = screen.getByText('+5–10 Defense').closest('span');
    const fixedRow = screen.getByText('+3 to Strength').closest('span');
    expect(rangeRow?.querySelector('[role="img"]')).not.toBeNull();
    expect(fixedRow?.querySelector('[role="img"]')).toBeNull();
  });

  it('lays out prefixes and suffixes as a two-column grid container', () => {
    const { container } = renderTable({
      prefixes: [affix({ name: 'Rugged' })],
      suffixes: [affix({ name: 'of Protection', group: 2 })],
    });
    const grid = container.firstElementChild as HTMLElement;
    expect(grid.className).toContain('lg:grid-cols-2');
  });
});
