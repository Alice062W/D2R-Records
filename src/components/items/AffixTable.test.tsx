import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import AffixTable from './AffixTable';
import messages from '../../../messages/en.json';

describe('AffixTable', () => {
  it('renders prefix and suffix sections with affix rows', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AffixTable
          prefixes={[{ name: 'Rugged', alvl: 8, min: 5, max: 10 }]}
          suffixes={[{ name: 'of Protection', alvl: 18, min: 1, max: 20 }]}
        />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('Prefixes')).toBeInTheDocument();
    expect(screen.getByText('Rugged')).toBeInTheDocument();
    expect(screen.getByText('of Protection')).toBeInTheDocument();
  });
});
