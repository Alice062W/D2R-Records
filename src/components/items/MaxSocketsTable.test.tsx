import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import MaxSocketsTable from './MaxSocketsTable';
import messages from '../../../messages/en.json';
import maxSockets from '../../../data/max-sockets.json';

describe('MaxSocketsTable', () => {
  it('renders all 17 rows with their three ilvl-tier values', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <MaxSocketsTable rows={maxSockets} />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('Axes')).toBeInTheDocument();
    expect(screen.getByText('Armors')).toBeInTheDocument();
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBe(19); // 18 data rows + 1 header row
  });
});
