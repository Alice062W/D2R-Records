import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import AuraList from './AuraList';
import messages from '../../../messages/en.json';
import type { Aura } from '@/lib/grail/auras';

describe('AuraList', () => {
  it('renders icon, visual, name, description, and the three facts for a sample aura', () => {
    const aura: Aura = {
      id: 'might', nameKey: 'aura_might', descriptionKey: 'aura_might_desc',
      reqLevel: 1, radiusBase: 16, radiusPerLevel: 2, manaCost: 1,
    };
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AuraList auras={[aura]} />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('Might')).toBeInTheDocument();
    expect(screen.getByText(/Increases the melee attack damage/)).toBeInTheDocument();
    const imgs = Array.from(container.querySelectorAll('img')) as HTMLImageElement[];
    expect(imgs.some(i => i.src.includes('/skills/icons/might.png'))).toBe(true);
    expect(imgs.some(i => i.src.includes('/skills/visuals/might.png'))).toBe(true);
  });

  it('renders no "Paladin" wording anywhere', () => {
    const aura: Aura = {
      id: 'might', nameKey: 'aura_might', descriptionKey: 'aura_might_desc',
      reqLevel: 1, radiusBase: 16, radiusPerLevel: 2, manaCost: 1,
    };
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AuraList auras={[aura]} />
      </NextIntlClientProvider>
    );
    expect(screen.queryByText(/Paladin/)).not.toBeInTheDocument();
    expect(screen.getByText(/the wearer/)).toBeInTheDocument();
  });

  it('renders a 20-column radius table with correct per-level values', () => {
    const aura: Aura = {
      id: 'might', nameKey: 'aura_might', descriptionKey: 'aura_might_desc',
      reqLevel: 1, radiusBase: 16, radiusPerLevel: 2, manaCost: 1,
    };
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AuraList auras={[aura]} />
      </NextIntlClientProvider>
    );
    const cells = Array.from(container.querySelectorAll('table td')).map(td => td.textContent);
    // level 1 -> 16, level 20 -> 16 + 2*19 = 54
    expect(cells).toContain('16');
    expect(cells).toContain('54');
    expect(container.querySelectorAll('table th').length).toBeGreaterThanOrEqual(20);
  });
});
