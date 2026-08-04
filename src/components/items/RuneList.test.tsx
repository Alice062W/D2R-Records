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

  it('gives each rune card an id matching its rune id, for RuneMap to scroll to', () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <RuneList runes={runes} locale="en" />
      </NextIntlClientProvider>
    );
    expect(container.querySelector('#rune-r01')).not.toBeNull(); // El
    expect(container.querySelector('#rune-r33')).not.toBeNull(); // Zod
  });

  it('renders the icon when the rune has an hdIcon (preferred over invFile)', () => {
    const rune = runes[0]; // El rune
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <RuneList runes={[rune]} locale="en" />
      </NextIntlClientProvider>
    );
    const img = container.querySelector('img') as HTMLImageElement;
    expect(img).not.toBeNull();
    expect(img.src).toContain(`/items/hd/${rune.hdIcon}.png`);
  });

  it('falls back to the classic icon when hdIcon is missing', () => {
    const rune = { ...runes[0], hdIcon: null as unknown as string };
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <RuneList runes={[rune]} locale="en" />
      </NextIntlClientProvider>
    );
    const img = container.querySelector('img') as HTMLImageElement;
    expect(img).not.toBeNull();
    expect(img.src).toContain('/items/inv/invrEl.png');
  });

  it('renders no icon when both hdIcon and invFile are empty', () => {
    const rune = { ...runes[0], hdIcon: null as unknown as string, invFile: '' };
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <RuneList runes={[rune]} locale="en" />
      </NextIntlClientProvider>
    );
    expect(container.querySelector('img')).toBeNull();
  });
});
