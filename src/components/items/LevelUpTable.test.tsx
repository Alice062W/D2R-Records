import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import LevelUpTable from './LevelUpTable';
import messages from '../../../messages/en.json';

describe('LevelUpTable', () => {
  it('renders one row per guide entry with clvl range, difficulty, and act', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <LevelUpTable rows={[{ clvlMin: 1, clvlMax: 11, difficulty: 'normal', act: 1 }]} />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('1 - 11')).toBeInTheDocument();
    expect(screen.getByText('Normal')).toBeInTheDocument();
    expect(screen.getByText('Act 1')).toBeInTheDocument();
  });
});
