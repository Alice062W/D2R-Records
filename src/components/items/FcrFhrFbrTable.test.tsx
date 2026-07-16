import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import FcrFhrFbrTable from './FcrFhrFbrTable';
import messages from '../../../messages/en.json';
import type { FcrFhrFbrTable as TableData } from '@/lib/grail/fcrFhrFbr';

const singleColumnTable: TableData = {
  id: 'assassin',
  className: 'Assassin',
  fcr: [{ label: '', rows: { 9: '174%', 16: '0%' } }],
  fhr: [{ label: '', rows: { 3: '200%' } }],
  fbr: [{ label: '', rows: { 1: '600%' } }],
};

const subSplitTable: TableData = {
  id: 'sorceress',
  className: 'Sorceress',
  fcr: [
    { label: 'other spells', rows: { 7: '200%' } },
    { label: 'Lightning / Chain Lightning', rows: { 11: '194%' } },
  ],
  fhr: [{ label: '', rows: { 5: '280%' } }],
  fbr: [{ label: '', rows: { 3: '200%' } }],
};

describe('FcrFhrFbrTable', () => {
  it('renders the class selector and the first table by default', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <FcrFhrFbrTable tables={[singleColumnTable, subSplitTable]} />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('Assassin')).toBeInTheDocument();
    expect(screen.getByText('Sorceress')).toBeInTheDocument();
    expect(screen.getByText('174%')).toBeInTheDocument();
  });

  it('switches to another class table on click, without a sub-header row for single-column stats', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <FcrFhrFbrTable tables={[singleColumnTable, subSplitTable]} />
      </NextIntlClientProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Sorceress' }));
    expect(screen.getByText('other spells')).toBeInTheDocument();
    expect(screen.getByText('Lightning / Chain Lightning')).toBeInTheDocument();
    expect(screen.getAllByText('200%')).toHaveLength(2);
    expect(screen.getByText('194%')).toBeInTheDocument();
  });
});
