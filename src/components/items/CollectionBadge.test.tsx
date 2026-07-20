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

  it('shows an amber-styled x/y (z%) badge when partially collected', () => {
    renderBadge(3, 10);
    const badge = screen.getByText('3/10 (30%)');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-amber-500/10');
    expect(screen.queryByText(/Complete!/)).not.toBeInTheDocument();
  });

  it('shows a plain muted x/y (0%) badge, visually distinct from the partial-progress style, when nothing is collected yet', () => {
    renderBadge(0, 5);
    const badge = screen.getByText('0/5 (0%)');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-panel-alt');
    expect(badge).not.toHaveClass('bg-amber-500/10');
  });

  it('shows the fancy "Complete!" badge instead of x/y when owned equals total', () => {
    renderBadge(7, 7);
    expect(screen.getByText(/Complete!/)).toBeInTheDocument();
    expect(screen.queryByText('7/7 (100%)')).not.toBeInTheDocument();
  });
});
