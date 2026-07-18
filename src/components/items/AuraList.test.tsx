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
    // radius at level 1 = 16, at level 20 = 16 + 2*19 = 54
    expect(screen.getByText(/16.*54/)).toBeInTheDocument();
  });
});
