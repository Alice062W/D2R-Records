import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import OwnedToggle from './OwnedToggle';
import messages from '../../../messages/en.json';

function renderToggle(owned: boolean, onToggle = vi.fn()) {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <OwnedToggle owned={owned} onToggle={onToggle} />
    </NextIntlClientProvider>
  );
  return onToggle;
}

describe('OwnedToggle', () => {
  it('shows "Mark as Owned" and aria-checked=false when not owned', () => {
    renderToggle(false);
    const button = screen.getByRole('switch');
    expect(button).toHaveAttribute('aria-checked', 'false');
    expect(button).toHaveTextContent('Mark as Owned');
    expect(button).not.toHaveClass('bg-green-600/20');
  });

  it('shows "Collected" and aria-checked=true when owned', () => {
    renderToggle(true);
    const button = screen.getByRole('switch');
    expect(button).toHaveAttribute('aria-checked', 'true');
    expect(button).toHaveTextContent('Collected');
    expect(button).toHaveClass('bg-green-600/20');
  });

  it('calls onToggle when clicked', () => {
    const onToggle = renderToggle(false);
    fireEvent.click(screen.getByRole('switch'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
