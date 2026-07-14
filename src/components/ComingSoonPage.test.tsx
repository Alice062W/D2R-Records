import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import ComingSoonPage from './ComingSoonPage';
import messages from '../../messages/en.json';

describe('ComingSoonPage', () => {
  it('renders the given title and the coming-soon message', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ComingSoonPage title="Runes" />
      </NextIntlClientProvider>
    );
    expect(screen.getByRole('heading', { name: 'Runes' })).toBeInTheDocument();
    expect(
      screen.getByText("This section hasn't been built yet — check back soon.")
    ).toBeInTheDocument();
  });
});
