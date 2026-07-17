import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import RuneList from './RuneList';
import messages from '../../../messages/en.json';
import runes from '../../../data/runes.json';

describe('RuneList', () => {
  it('renders all 33 runes', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <RuneList runes={runes} locale="en" />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('El')).toBeInTheDocument();
    expect(screen.getByText('Zod')).toBeInTheDocument();
    expect(screen.getAllByText(/^#\d+$/).length).toBe(33);
  });

  it('shows the recipe for a rune that has one, and none for El', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <RuneList runes={runes} locale="en" />
      </NextIntlClientProvider>
    );
    expect(screen.getByText(/Eld x3/)).toBeInTheDocument();
  });

  it('renders the icon when the rune has an invFile', () => {
    const rune = runes[0]; // El rune
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <RuneList runes={[rune]} locale="en" />
      </NextIntlClientProvider>
    );
    const img = container.querySelector('img') as HTMLImageElement;
    expect(img).not.toBeNull();
    expect(img.src).toContain('/items/inv/invrEl.png');
  });

  it('renders no icon when invFile is empty', () => {
    const rune = { ...runes[0], invFile: '' };
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <RuneList runes={[rune]} locale="en" />
      </NextIntlClientProvider>
    );
    expect(container.querySelector('img')).toBeNull();
  });
});
