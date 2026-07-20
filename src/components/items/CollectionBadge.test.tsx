import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import CollectionBadge from './CollectionBadge';
import messages from '../../../messages/en.json';

function renderBadge(owned: number, total: number) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <CollectionBadge owned={owned} total={total} />
    </NextIntlClientProvider>
  );
}

describe('CollectionBadge', () => {
  it('renders nothing when total is 0', () => {
    const { container } = renderBadge(0, 0);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows an x/y (z%) badge when partially collected', () => {
    renderBadge(3, 10);
    expect(screen.getByText('3/10 (30%)')).toBeInTheDocument();
    expect(screen.queryByText(/Complete!/)).not.toBeInTheDocument();
  });

  it('shows an x/y (z%) badge (0%) when nothing is collected yet', () => {
    renderBadge(0, 5);
    expect(screen.getByText('0/5 (0%)')).toBeInTheDocument();
  });

  it('shows the fancy "Complete!" badge instead of x/y when owned equals total', () => {
    renderBadge(7, 7);
    expect(screen.getByText(/Complete!/)).toBeInTheDocument();
    expect(screen.queryByText('7/7 (100%)')).not.toBeInTheDocument();
  });
});
