import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import AuraMap from './AuraMap';
import { AURAS } from '@/lib/grail/auras';
import messages from '../../../messages/en.json';

function renderMap(auras = AURAS) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <AuraMap auras={auras} />
    </NextIntlClientProvider>
  );
}

describe('AuraMap', () => {
  it('renders all 20 auras as links', () => {
    renderMap();
    expect(screen.getByText('Might')).toBeInTheDocument();
    expect(screen.getByText('Salvation')).toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(20);
  });

  it('each aura link points to its matching id anchor in the list below (e.g. #might)', () => {
    renderMap();
    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', '#might');
    expect(links[19]).toHaveAttribute('href', '#salvation');
  });

  it('renders the aura icon', () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AuraMap auras={[AURAS[0]]} />
      </NextIntlClientProvider>
    );
    const img = container.querySelector('img') as HTMLImageElement;
    expect(img).not.toBeNull();
    expect(img.src).toContain('/skills/icons/might.png');
  });
});
