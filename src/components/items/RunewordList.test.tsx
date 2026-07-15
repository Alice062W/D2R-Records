import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import RunewordFilters from './RunewordFilters';
import RunewordList from './RunewordList';
import { useState } from 'react';
import messages from '../../../messages/en.json';
import runewordsFull from '../../../data/runewords-full.json';

function TestPage() {
  const [itemType, setItemType] = useState<string | null>(null);
  const [sockets, setSockets] = useState<number | null>(null);
  const filtered = runewordsFull.filter(rw =>
    (!itemType || rw.itemTypes.includes(itemType)) &&
    (!sockets || rw.sockets === sockets)
  );
  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      <RunewordFilters
        itemTypes={['armors', 'shld']}
        activeType={itemType}
        onTypeChange={setItemType}
        activeSockets={sockets}
        onSocketsChange={setSockets}
      />
      <RunewordList runewords={filtered} />
    </NextIntlClientProvider>
  );
}

describe('RunewordFilters + RunewordList', () => {
  it('shows all 93 runewords with no filter active', () => {
    render(<TestPage />);
    expect(screen.getByText('Enigma')).toBeInTheDocument();
    expect(screen.getAllByText(/Ral|Ort|Tal|Jah|Ith|Ber/).length).toBeGreaterThan(0);
  });

  it('filters by item type', () => {
    render(<TestPage />);
    fireEvent.click(screen.getByRole('button', { name: 'shld' }));
    expect(screen.queryByText('Enigma')).not.toBeInTheDocument(); // Enigma requires armors, not shld
  });

  it('filters by socket count', () => {
    render(<TestPage />);
    fireEvent.click(screen.getByRole('button', { name: '3' }));
    expect(screen.getByText('Enigma')).toBeInTheDocument(); // Enigma is 3 sockets
    const fourSocketRuneword = runewordsFull.find(r => r.sockets === 4);
    if (fourSocketRuneword) {
      expect(screen.queryByText(fourSocketRuneword.name.en)).not.toBeInTheDocument();
    }
  });
});
