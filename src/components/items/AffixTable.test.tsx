import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import AffixTable from './AffixTable';
import messages from '../../../messages/en.json';

function renderTable(props: React.ComponentProps<typeof AffixTable>) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <AffixTable {...props} />
    </NextIntlClientProvider>
  );
}

describe('AffixTable', () => {
  it('renders prefix and suffix sections with affix rows', () => {
    renderTable({
      prefixes: [{ name: 'Rugged', alvl: 8, min: 5, max: 10, itemTypes: ['boots'] }],
      suffixes: [{ name: 'of Protection', alvl: 18, min: 1, max: 20, itemTypes: ['boots'] }],
    });
    expect(screen.getByText('Prefixes')).toBeInTheDocument();
    expect(screen.getByText('Rugged')).toBeInTheDocument();
    expect(screen.getByText('of Protection')).toBeInTheDocument();
  });

  it('groups same-named affixes into a single collapsed row showing the highest-alvl tier', () => {
    renderTable({
      prefixes: [
        { name: 'Rugged', alvl: 1, min: 1, max: 3, itemTypes: ['boots'] },
        { name: 'Rugged', alvl: 8, min: 5, max: 10, itemTypes: ['boots', 'gloves'] },
        { name: 'Rugged', alvl: 16, min: 20, max: 20, itemTypes: ['boots'] },
      ],
      suffixes: [],
    });
    // Only one "Rugged" row rendered (grouped), not three.
    expect(screen.getAllByText('Rugged')).toHaveLength(1);
    // Collapsed row shows the highest-alvl tier's value (alvl 16, 20-20).
    expect(screen.getByText('Alvl 16')).toBeInTheDocument();
    expect(screen.getByText('20–20')).toBeInTheDocument();
    // Lower tiers are not visible until expanded.
    expect(screen.queryByText('Alvl 1')).not.toBeInTheDocument();
    expect(screen.queryByText('1–3')).not.toBeInTheDocument();
  });

  it('expands a grouped row on click to reveal every tier with alvl, item types, and range', () => {
    renderTable({
      prefixes: [
        { name: 'Rugged', alvl: 1, min: 1, max: 3, itemTypes: ['boots'] },
        { name: 'Rugged', alvl: 16, min: 20, max: 20, itemTypes: ['boots', 'gloves'] },
      ],
      suffixes: [],
    });
    const toggle = screen.getByRole('button', { name: /Rugged/ });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Alvl 1')).toBeInTheDocument();
    expect(screen.getByText('1–3')).toBeInTheDocument();
    // Both tier alvls now visible (collapsed row's 16 + expanded row's 16 + 1).
    expect(screen.getAllByText('Alvl 16').length).toBeGreaterThanOrEqual(1);

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Alvl 1')).not.toBeInTheDocument();
  });

  it('does not render a chevron/expand toggle for a single-tier affix', () => {
    renderTable({
      prefixes: [{ name: 'Solitary', alvl: 5, min: 1, max: 2, itemTypes: ['rings'] }],
      suffixes: [],
    });
    const toggle = screen.getByRole('button', { name: /Solitary/ });
    expect(toggle).not.toHaveAttribute('aria-expanded');
    expect(toggle).toBeDisabled();
  });
});
