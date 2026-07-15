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
});
